package com.homely.api.insights;

import com.homely.api.aidesign.DesignFurnitureItem;
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
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * TASK-099: verify InsightsService tính đúng từ dữ liệu THẬT qua repository (giả lập bằng Mockito,
 * không phụ thuộc DB) — đặc biệt là loại trừ job nhân bản/chưa COMPLETED (quy ước TASK-093) và
 * không bịa dữ liệu khi user rỗng. Xem tasks/active/TASK-099-design-insights.md.
 */
class InsightsServiceTest {

    private final RoomRepository roomRepository = mock(RoomRepository.class);
    private final RoomPreferenceRepository roomPreferenceRepository = mock(RoomPreferenceRepository.class);
    private final DesignJobRepository designJobRepository = mock(DesignJobRepository.class);
    private final DesignResultRepository designResultRepository = mock(DesignResultRepository.class);
    private final DesignFurnitureItemRepository designFurnitureItemRepository = mock(DesignFurnitureItemRepository.class);

    private final InsightsService insightsService = new InsightsService(roomRepository, roomPreferenceRepository,
            designJobRepository, designResultRepository, designFurnitureItemRepository);

    private final UUID ownerId = UUID.randomUUID();

    private static Room room(UUID id, UUID ownerId, String roomType) {
        Room room = new Room();
        room.setId(id);
        room.setOwnerId(ownerId);
        room.setRoomType(roomType);
        return room;
    }

    private static RoomPreference preference(UUID roomId, String style, Long budget) {
        RoomPreference pref = new RoomPreference();
        pref.setId(UUID.randomUUID());
        pref.setRoomId(roomId);
        pref.setStyle(style);
        pref.setBudget(budget);
        return pref;
    }

    private static DesignJob job(UUID ownerId, String status, UUID duplicatedFromJobId) {
        DesignJob job = new DesignJob();
        job.setId(UUID.randomUUID());
        job.setOwnerId(ownerId);
        job.setRoomId(UUID.randomUUID());
        job.setStatus(status);
        job.setDuplicatedFromJobId(duplicatedFromJobId);
        return job;
    }

    @Test
    void emptyAccount_returnsZeroAndNullFields_notError() {
        when(roomRepository.findByOwnerId(ownerId)).thenReturn(List.of());
        when(designJobRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)).thenReturn(List.of());

        InsightsResponse response = insightsService.getInsights(ownerId);

        assertThat(response.totalDesigns()).isZero();
        assertThat(response.totalFurnitureItems()).isZero();
        assertThat(response.mostCommonRoomType()).isNull();
        assertThat(response.mostCommonStyle()).isNull();
        assertThat(response.averageBudget()).isNull();
    }

    @Test
    void excludesNonCompletedAndDuplicatedJobs_fromTotalDesignsAndFurnitureCount() {
        UUID room1 = UUID.randomUUID();
        when(roomRepository.findByOwnerId(ownerId)).thenReturn(List.of(room(room1, ownerId, "Phòng khách")));
        when(roomPreferenceRepository.findAll()).thenReturn(List.of());

        DesignJob completedReal = job(ownerId, "COMPLETED", null);
        DesignJob completedDuplicate = job(ownerId, "COMPLETED", UUID.randomUUID()); // TASK-093: job nhân bản, phải loại trừ
        DesignJob pending = job(ownerId, "PENDING", null);
        DesignJob failed = job(ownerId, "FAILED", null);
        when(designJobRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId))
                .thenReturn(List.of(completedReal, completedDuplicate, pending, failed));

        DesignResult result = new DesignResult();
        result.setId(UUID.randomUUID());
        result.setJobId(completedReal.getId());
        when(designResultRepository.findByJobId(completedReal.getId())).thenReturn(Optional.of(result));
        when(designResultRepository.findByJobId(completedDuplicate.getId())).thenReturn(Optional.empty());

        DesignFurnitureItem item1 = new DesignFurnitureItem();
        item1.setResultId(result.getId());
        DesignFurnitureItem item2 = new DesignFurnitureItem();
        item2.setResultId(result.getId());
        when(designFurnitureItemRepository.findByResultId(result.getId())).thenReturn(List.of(item1, item2));

        InsightsResponse response = insightsService.getInsights(ownerId);

        assertThat(response.totalDesigns()).isEqualTo(1); // chỉ completedReal
        assertThat(response.totalFurnitureItems()).isEqualTo(2);
    }

    @Test
    void computesMostCommonRoomTypeStyleAndAverageBudget_fromRealData() {
        UUID room1 = UUID.randomUUID();
        UUID room2 = UUID.randomUUID();
        UUID room3 = UUID.randomUUID();
        UUID otherUsersRoom = UUID.randomUUID();

        when(roomRepository.findByOwnerId(ownerId)).thenReturn(List.of(
                room(room1, ownerId, "Phòng khách"),
                room(room2, ownerId, "Phòng khách"),
                room(room3, ownerId, "Phòng ngủ")
        ));
        when(designJobRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)).thenReturn(List.of());

        // findAll() trả cả preference của user KHÁC (roomId không thuộc user) — phải bị lọc bỏ.
        when(roomPreferenceRepository.findAll()).thenReturn(List.of(
                preference(room1, "Scandinavian", 10_000_000L),
                preference(room2, "Scandinavian", 20_000_000L),
                preference(room3, "Japandi", null), // budget null -> loại khỏi trung bình
                preference(otherUsersRoom, "Modern", 999_000_000L)
        ));

        InsightsResponse response = insightsService.getInsights(ownerId);

        assertThat(response.mostCommonRoomType()).isEqualTo("Phòng khách");
        assertThat(response.mostCommonStyle()).isEqualTo("Scandinavian");
        assertThat(response.averageBudget()).isEqualTo(15_000_000d); // (10tr + 20tr) / 2, bỏ qua budget null
    }
}
