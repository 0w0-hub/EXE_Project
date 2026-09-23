package com.homely.api.insights;

import com.homely.api.aidesign.DesignFurnitureItemRepository;
import com.homely.api.aidesign.DesignJob;
import com.homely.api.aidesign.DesignJobRepository;
import com.homely.api.aidesign.DesignResult;
import com.homely.api.aidesign.DesignResultRepository;
import com.homely.api.insights.dto.InsightsResponse;
import com.homely.api.room.Room;
import com.homely.api.room.RoomPreference;
import com.homely.api.room.RoomPreferenceRepository;
import com.homely.api.room.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * TASK-099: tổng hợp thống kê thiết kế cá nhân ở mức TOÀN BỘ tài khoản, chỉ đọc từ dữ liệu THẬT
 * qua các repository hiện có (RoomRepository/DesignJobRepository/RoomPreferenceRepository/
 * DesignResultRepository/DesignFurnitureItemRepository) — KHÔNG có bảng DB riêng, không cache.
 * Xem tasks/active/TASK-099-design-insights.md.
 *
 * Quy ước job nhân bản (TASK-093): DesignJob.duplicatedFromJobId khác null nghĩa là job được tạo
 * ra từ nhân bản 1 job khác, KHÔNG PHẢI lượt generate AI thật — loại trừ khỏi mọi số liệu bên dưới.
 */
@Service
public class InsightsService {

    private static final String STATUS_COMPLETED = "COMPLETED";

    private final RoomRepository roomRepository;
    private final RoomPreferenceRepository roomPreferenceRepository;
    private final DesignJobRepository designJobRepository;
    private final DesignResultRepository designResultRepository;
    private final DesignFurnitureItemRepository designFurnitureItemRepository;

    public InsightsService(RoomRepository roomRepository,
                            RoomPreferenceRepository roomPreferenceRepository,
                            DesignJobRepository designJobRepository,
                            DesignResultRepository designResultRepository,
                            DesignFurnitureItemRepository designFurnitureItemRepository) {
        this.roomRepository = roomRepository;
        this.roomPreferenceRepository = roomPreferenceRepository;
        this.designJobRepository = designJobRepository;
        this.designResultRepository = designResultRepository;
        this.designFurnitureItemRepository = designFurnitureItemRepository;
    }

    public InsightsResponse getInsights(UUID userId) {
        List<Room> rooms = roomRepository.findByOwnerId(userId);
        Set<UUID> roomIds = rooms.stream().map(Room::getId).collect(Collectors.toSet());

        List<DesignJob> completedJobs = designJobRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .filter(job -> STATUS_COMPLETED.equals(job.getStatus()) && job.getDuplicatedFromJobId() == null)
                .toList();
        long totalDesigns = completedJobs.size();

        String mostCommonRoomType = mostCommon(rooms.stream()
                .map(Room::getRoomType)
                .filter(type -> type != null && !type.isBlank())
                .toList());

        // RoomPreferenceRepository chỉ có sẵn findAll/findById (không có findByRoomId), và thêm
        // method mới vào file repository đó nằm ngoài phạm vi Scope của TASK-099 (chỉ tạo package
        // insights/ mới) — lọc trong bộ nhớ theo roomIds của user thay vì thêm query riêng.
        List<RoomPreference> preferences = roomIds.isEmpty()
                ? List.of()
                : roomPreferenceRepository.findAll().stream()
                        .filter(pref -> roomIds.contains(pref.getRoomId()))
                        .toList();

        String mostCommonStyle = mostCommon(preferences.stream()
                .map(RoomPreference::getStyle)
                .filter(style -> style != null && !style.isBlank())
                .toList());

        List<Long> budgets = preferences.stream()
                .map(RoomPreference::getBudget)
                .filter(Objects::nonNull)
                .toList();
        Double averageBudget = budgets.isEmpty()
                ? null
                : budgets.stream().mapToLong(Long::longValue).average().orElse(0);

        long totalFurnitureItems = completedJobs.stream()
                .map(job -> designResultRepository.findByJobId(job.getId()))
                .flatMap(Optional::stream)
                .map(DesignResult::getId)
                .mapToLong(resultId -> designFurnitureItemRepository.findByResultId(resultId).size())
                .sum();

        return new InsightsResponse(totalDesigns, mostCommonRoomType, mostCommonStyle, totalFurnitureItems, averageBudget);
    }

    private String mostCommon(List<String> values) {
        if (values.isEmpty()) {
            return null;
        }
        Map<String, Long> counts = values.stream()
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()));
        return counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }
}
