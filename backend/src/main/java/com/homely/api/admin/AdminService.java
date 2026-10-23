 package com.homely.api.admin;

import com.homely.api.admin.dto.AdminDashboardResponse;
import com.homely.api.admin.dto.AdminExplorerJobItemResponse;
import com.homely.api.admin.dto.AdminExplorerJobLookupResponse;
import com.homely.api.admin.dto.AdminExplorerRoomResponse;
import com.homely.api.admin.dto.AdminExplorerUserResponse;
import com.homely.api.admin.dto.AdminOrphanCheckItemResponse;
import com.homely.api.admin.dto.AdminOrphanCheckResponse;
import com.homely.api.admin.dto.AdminSystemHealthResponse;
import com.homely.api.aidesign.DesignJob;
import com.homely.api.aidesign.DesignService;
import com.homely.api.room.Room;
import com.homely.api.room.RoomService;
import com.homely.api.room.dto.RoomResponse;
import com.homely.api.sharing.ShareService;
import com.homely.api.user.User;
import com.homely.api.user.UserService;
import com.homely.api.user.dto.UserResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Chỉ dùng cho admin — tổng hợp số liệu qua service của từng module (user/room/aidesign),
 * không đọc trực tiếp repository của module khác — xem rules/architecture/service-boundaries.md.
 */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private static final List<String> STATUSES = List.of("PENDING", "PROCESSING", "COMPLETED", "FAILED");

    // TASK-094: ngưỡng "job bị treo" — DesignJobProcessor xử lý 1 job qua 1 lần gọi AI provider
    // (không có bước chờ người dùng), bình thường xong trong vài giây tới vài phút. Quá 10 phút
    // vẫn ở PROCESSING gần như chắc chắn là bất thường (worker crash, provider treo...), không
    // phải thời gian xử lý bình thường kéo dài — chỉ để hiển thị cảnh báo, không tự động sửa.
    private static final Duration STUCK_JOB_THRESHOLD = Duration.ofMinutes(10);

    private static final Duration FAILED_JOB_WINDOW = Duration.ofHours(24);

    // TASK-104: Admin Data Explorer — giới hạn hiển thị tối đa 20 room/job đầu tiên (Out of scope:
    // không phân trang đầy đủ, số lượng thực tế mỗi user rất nhỏ). totalRoomCount/totalJobCount trả
    // kèm để FE hiển thị "và N room/job khác" khi bị cắt bớt.
    private static final int EXPLORER_LIST_LIMIT = 20;

    // TASK-111: Admin Data Integrity Checker — giới hạn hiển thị tối đa 50 id mồ côi đầu tiên/loại
    // kiểm tra (khác EXPLORER_LIST_LIMIT=20 của TASK-104 — xem Scope trong
    // tasks/active/TASK-111-admin-orphan-checker.md). totalOrphanCount trả kèm để FE hiển thị
    // "và N id khác" khi bị cắt bớt.
    private static final int ORPHAN_ID_LIMIT = 50;

    private final UserService userService;
    private final RoomService roomService;
    private final DesignService designService;
    private final ShareService shareService;

    public AdminService(UserService userService, RoomService roomService, DesignService designService,
                         ShareService shareService) {
        this.userService = userService;
        this.roomService = roomService;
        this.designService = designService;
        this.shareService = shareService;
    }

    public AdminDashboardResponse getDashboard() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (String status : STATUSES) {
            byStatus.put(status, designService.countByStatus(status));
        }
        long totalJobs = byStatus.values().stream().mapToLong(Long::longValue).sum();
        return new AdminDashboardResponse(userService.countAll(), roomService.countAll(), totalJobs, byStatus);
    }

    /** TASK-094: mọi số liệu đo trực tiếp ngay lúc gọi, không cache — xem tasks/active/TASK-094-admin-system-health.md. */
    public AdminSystemHealthResponse getSystemHealth() {
        Instant now = Instant.now();

        String databaseStatus;
        try {
            userService.countAll(); // query đơn giản để xác nhận DB còn phản hồi
            databaseStatus = "UP";
        } catch (Exception ex) {
            log.warn("Admin system health: database check failed", ex);
            databaseStatus = "DOWN";
        }

        long pendingJobsCount = designService.countPendingOrProcessing();
        long failedJobsLast24h = designService.countFailedSince(now.minus(FAILED_JOB_WINDOW));
        long stuckJobsCount = designService.countStuckProcessing(now.minus(STUCK_JOB_THRESHOLD));

        return new AdminSystemHealthResponse(databaseStatus, pendingJobsCount, failedJobsLast24h, stuckJobsCount, now);
    }

    /**
     * TASK-104: GET /api/v1/admin/explorer/user?email=... — tra CHÍNH XÁC 1 user theo email (không
     * search mờ) + toàn bộ room/job của user đó, gộp xuyên bảng để admin không phải tự đối chiếu ID
     * bằng tay giữa /admin/users và /admin/designs. Không tồn tại -> ApiException 404
     * (UserService.getByEmail) tự động lan tới GlobalExceptionHandler.
     */
    public AdminExplorerUserResponse findUserByEmailWithDetails(String email) {
        User user = userService.getByEmail(email);
        List<Room> rooms = roomService.listMine(user.getId());

        List<AdminExplorerRoomResponse> roomResponses = rooms.stream()
                .limit(EXPLORER_LIST_LIMIT)
                .map(room -> {
                    List<DesignJob> jobs = designService.listJobsForRoom(room.getId());
                    List<AdminExplorerJobItemResponse> jobItems = jobs.stream()
                            .limit(EXPLORER_LIST_LIMIT)
                            .map(AdminExplorerJobItemResponse::from)
                            .toList();
                    return new AdminExplorerRoomResponse(RoomResponse.from(room), jobItems, jobs.size());
                })
                .toList();

        return new AdminExplorerUserResponse(UserResponse.from(user), roomResponses, rooms.size());
    }

    /**
     * TASK-104: GET /api/v1/admin/explorer/job?jobId=... — tra ngược "job này của ai": job + room
     * liên kết + email chủ sở hữu. Không tồn tại -> ApiException 404 (DesignService.getJobForAdmin)
     * tự động lan tới GlobalExceptionHandler.
     */
    public AdminExplorerJobLookupResponse findJobById(UUID jobId) {
        DesignJob job = designService.getJobForAdmin(jobId);
        Room room = roomService.getById(job.getRoomId());
        User owner = userService.getById(job.getOwnerId());

        return new AdminExplorerJobLookupResponse(
                AdminExplorerJobItemResponse.from(job), RoomResponse.from(room), owner.getId(), owner.getEmail());
    }

    /**
     * TASK-111: "Admin Data Integrity Checker" — quét đúng 5 mối quan hệ khoá ngoại LOGIC liệt kê
     * trong Scope (design_jobs.room_id/preference_id, design_results.job_id,
     * design_furniture_items.result_id, design_share.job_id), tính LIVE mỗi lần gọi (không cache).
     * THUẦN READ-ONLY — không có nhánh sửa/xoá nào ở đây; nếu tìm thấy orphan thật, việc xử lý là
     * quyết định của coordinator/user sau khi xem báo cáo (xem Out of scope trong task file).
     * <p>
     * Mỗi kiểm tra tự tính trong đúng service sở hữu bảng liên quan (DesignService/ShareService) rồi
     * truyền id THẬT về đây — admin chỉ gộp lại thành response, không tự query repository của module
     * khác (rules/architecture/service-boundaries.md).
     */
    public AdminOrphanCheckResponse checkOrphans() {
        List<AdminOrphanCheckItemResponse> checks = new ArrayList<>();
        checks.add(buildOrphanCheckItem(
                "design_jobs.room_id -> rooms.id", "design_jobs", designService.findOrphanJobRoomRefIds()));
        checks.add(buildOrphanCheckItem(
                "design_jobs.preference_id -> room_preferences.id", "design_jobs", designService.findOrphanJobPreferenceRefIds()));
        checks.add(buildOrphanCheckItem(
                "design_results.job_id -> design_jobs.id", "design_results", designService.findOrphanResultIds()));
        checks.add(buildOrphanCheckItem(
                "design_furniture_items.result_id -> design_results.id", "design_furniture_items", designService.findOrphanFurnitureItemIds()));
        checks.add(buildOrphanCheckItem(
                "design_share.job_id -> design_jobs.id", "design_share", shareService.findOrphanShareIds()));

        boolean anyOrphansFound = checks.stream().anyMatch(c -> c.totalOrphanCount() > 0);
        return new AdminOrphanCheckResponse(checks, anyOrphansFound, Instant.now());
    }

    private AdminOrphanCheckItemResponse buildOrphanCheckItem(String checkName, String table, List<UUID> orphanIds) {
        long total = orphanIds.size();
        List<UUID> limited = orphanIds.stream().limit(ORPHAN_ID_LIMIT).toList();
        return new AdminOrphanCheckItemResponse(checkName, table, total, limited, total > ORPHAN_ID_LIMIT);
    }
}
