package com.homely.api.user;

import com.homely.api.aidesign.DesignService;
import com.homely.api.aidesign.dto.DesignJobSummaryResponse;
import com.homely.api.common.ApiException;
import com.homely.api.room.Room;
import com.homely.api.room.RoomService;
import com.homely.api.sharing.DesignShareRepository;
import com.homely.api.user.dto.AchievementResponse;
import com.homely.api.user.dto.ActivityItemResponse;
import com.homely.api.user.dto.UserExportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    // TASK-084: top N gần nhất là đủ cho acceptance criteria hiện tại, không cần phân trang phức tạp.
    private static final int ACTIVITY_LIMIT = 50;

    private final UserRepository userRepository;
    private final RoomService roomService;
    private final DesignService designService;
    private final DesignShareRepository shareRepository;

    public UserService(UserRepository userRepository, RoomService roomService, DesignService designService,
                        DesignShareRepository shareRepository) {
        this.userRepository = userRepository;
        this.roomService = roomService;
        this.designService = designService;
        this.shareRepository = shareRepository;
    }

    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
    }

    /**
     * TASK-104: tra cứu CHÍNH XÁC theo email (không search mờ/like — dữ liệu nhạy cảm) — dùng bởi
     * Admin Data Explorer (GET /api/v1/admin/explorer/user). Ném 404 giống getById ở trên.
     */
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
    }

    /** Dùng bởi admin module. */
    public long countAll() {
        return userRepository.count();
    }

    public Page<User> listAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    /**
     * TASK-087: gom dữ liệu cá nhân của CHÍNH user (profile không kèm password hash + room +
     * design job) cho GET /api/v1/users/me/export — xem tasks/active/TASK-087-personal-data-export.md.
     */
    public UserExportResponse buildExport(UUID userId) {
        User user = getById(userId);
        var profile = new UserExportResponse.ProfileExport(user.getId(), user.getEmail(), user.getFullName(), user.getCreatedAt());

        var rooms = roomService.listMine(userId).stream()
                .map(r -> new UserExportResponse.RoomExport(r.getId(), r.getRoomType(), r.getWidthMeters(), r.getLengthMeters(), r.getCreatedAt()))
                .toList();

        var designJobs = designService.listForExport(userId);

        return new UserExportResponse(profile, rooms, designJobs);
    }

    /**
     * TASK-084: ghép lịch sử hoạt động của CHÍNH user từ dữ liệu THẬT đã có sẵn ở 3 module khác
     * (room/aidesign/sharing) — KHÔNG tạo bảng audit log mới (xem
     * tasks/active/TASK-084-activity-history.md, mục "QUAN TRỌNG — không bịa dữ liệu").
     * Room/DesignJob đọc qua RoomService/DesignService (đúng convention hiện có — xem
     * rules/architecture/service-boundaries.md và cách UserService.buildExport ở trên làm, TASK-087).
     * DesignShare đọc trực tiếp DesignShareRepository vì ShareService (module `sharing`) hiện chưa
     * có sẵn method liệt kê share theo owner, và task này không mở rộng module khác ngoài `user`.
     */
    public List<ActivityItemResponse> getActivity(UUID userId) {
        List<Room> rooms = roomService.listMine(userId);
        List<DesignJobSummaryResponse> jobs = designService.listJobs(userId, null, Pageable.unpaged()).getContent();

        List<ActivityItemResponse> items = new ArrayList<>();

        for (Room room : rooms) {
            items.add(new ActivityItemResponse(
                    "ROOM_CREATED",
                    "Tạo phòng " + describeRoomType(room.getRoomType()),
                    room.getCreatedAt()));
        }

        for (DesignJobSummaryResponse job : jobs) {
            String roomLabel = describeRoomType(job.roomType());

            items.add(new ActivityItemResponse(
                    "DESIGN_GENERATED",
                    "Tạo thiết kế AI cho phòng " + roomLabel,
                    job.createdAt()));

            shareRepository.findByJobId(job.jobId()).ifPresent(share -> items.add(new ActivityItemResponse(
                    "DESIGN_SHARED",
                    "Bật chia sẻ công khai thiết kế phòng " + roomLabel,
                    share.getCreatedAt())));
        }

        return items.stream()
                .sorted(Comparator.comparing(ActivityItemResponse::createdAt).reversed())
                .limit(ACTIVITY_LIMIT)
                .toList();
    }

    private static String describeRoomType(String roomType) {
        return (roomType != null && !roomType.isBlank()) ? roomType : "chưa đặt tên";
    }

    /**
     * TASK-091: tính huy hiệu thành tựu TỪ dữ liệu thật đã có (room/design job COMPLETED/share) mỗi
     * lần gọi — KHÔNG có bảng lưu trạng thái "đã đạt" hay điểm/XP riêng (xem
     * tasks/active/TASK-091-achievements.md, mục "QUAN TRỌNG — không bịa dữ liệu/nghiệp vụ mới").
     * Vì tính lại mỗi request thay vì lưu trạng thái, "đạt huy hiệu" là suy ra từ điều kiện đủ dữ
     * liệu tại thời điểm gọi, không phải sự kiện được ghi lại — chấp nhận được ở quy mô này.
     * Danh sách room/job tái dùng RoomService/DesignService (đúng convention getActivity ở trên,
     * TASK-084); share tra trực tiếp DesignShareRepository.findByJobId đã có sẵn, không thêm method
     * repository mới vì không cần đếm — chỉ cần biết CÓ hay KHÔNG ít nhất 1 share.
     */
    public List<AchievementResponse> getAchievements(UUID userId) {
        List<Room> rooms = roomService.listMine(userId);
        List<DesignJobSummaryResponse> jobs = designService.listJobs(userId, null, Pageable.unpaged()).getContent();

        long roomCount = rooms.size();
        long completedDesignCount = jobs.stream().filter(j -> "COMPLETED".equals(j.status())).count();
        long distinctRoomTypeCount = rooms.stream()
                .map(Room::getRoomType)
                .filter(type -> type != null && !type.isBlank())
                .distinct()
                .count();
        boolean hasShare = jobs.stream().anyMatch(j -> shareRepository.findByJobId(j.jobId()).isPresent());

        List<AchievementResponse> achievements = new ArrayList<>();
        achievements.add(new AchievementResponse(
                "FIRST_ROOM", "Phòng đầu tiên", "Tạo phòng đầu tiên của bạn trên Homely",
                roomCount >= 1, "Tạo ít nhất 1 phòng"));
        achievements.add(new AchievementResponse(
                "FIVE_ROOMS", "5 phòng", "Tạo 5 phòng trở lên",
                roomCount >= 5, "Tạo ít nhất 5 phòng"));
        achievements.add(new AchievementResponse(
                "FIRST_DESIGN", "Thiết kế đầu tiên", "Hoàn thành thiết kế AI đầu tiên",
                completedDesignCount >= 1, "Hoàn thành ít nhất 1 thiết kế AI"));
        achievements.add(new AchievementResponse(
                "FIVE_DESIGNS", "5 thiết kế", "Hoàn thành 5 thiết kế AI trở lên",
                completedDesignCount >= 5, "Hoàn thành ít nhất 5 thiết kế AI"));
        achievements.add(new AchievementResponse(
                "FIRST_SHARE", "Chia sẻ đầu tiên", "Bật chia sẻ công khai cho 1 thiết kế",
                hasShare, "Chia sẻ công khai ít nhất 1 thiết kế"));
        achievements.add(new AchievementResponse(
                "TEN_DESIGNS", "10 thiết kế", "Hoàn thành 10 thiết kế AI trở lên",
                completedDesignCount >= 10, "Hoàn thành ít nhất 10 thiết kế AI"));
        achievements.add(new AchievementResponse(
                "ROOM_VARIETY", "Đa dạng không gian", "Tạo phòng ở 3 loại không gian khác nhau trở lên",
                distinctRoomTypeCount >= 3, "Tạo phòng ở ít nhất 3 loại không gian khác nhau"));

        return achievements;
    }
}
