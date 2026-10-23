package com.homely.api.aidesign;

import com.homely.api.aidesign.dto.DesignJobResponse;
import com.homely.api.billing.BillingService;
import com.homely.api.common.ApiException;
import com.homely.api.room.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.*;

/**
 * TASK-093: verify hành vi nhân bản job — ĐẶC BIỆT là KHÔNG được đụng usage limit (billingService/
 * jobProcessor không được gọi trong đường duplicateJob, khác hẳn createJob). Repository được giả
 * lập bằng map trong bộ nhớ (thay vì DB thật) để test tất định, phản ánh đúng hành vi find/save
 * thật thay vì chỉ verify lời gọi — không phụ thuộc timing của @Async DesignJobProcessor thật.
 */
class DesignServiceTest {

    private final DesignJobRepository jobRepository = mock(DesignJobRepository.class);
    private final DesignResultRepository resultRepository = mock(DesignResultRepository.class);
    private final DesignFurnitureItemRepository furnitureItemRepository = mock(DesignFurnitureItemRepository.class);
    private final DesignColorPaletteRepository colorPaletteRepository = mock(DesignColorPaletteRepository.class);
    private final DesignJobProcessor jobProcessor = mock(DesignJobProcessor.class);
    private final RoomService roomService = mock(RoomService.class);
    private final BillingService billingService = mock(BillingService.class);

    private final Map<UUID, DesignResult> resultsByJobId = new HashMap<>();
    private final Map<UUID, List<DesignFurnitureItem>> furnitureByResultId = new HashMap<>();
    private final Map<UUID, List<DesignColorPalette>> colorsByResultId = new HashMap<>();

    private DesignService designService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID sourceJobId = UUID.randomUUID();
    private final UUID sourceResultId = UUID.randomUUID();
    private final UUID roomId = UUID.randomUUID();
    private final UUID preferenceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        designService = new DesignService(jobRepository, resultRepository, furnitureItemRepository,
                colorPaletteRepository, jobProcessor, roomService, billingService);

        when(jobRepository.save(any(DesignJob.class))).thenAnswer(inv -> {
            DesignJob job = inv.getArgument(0);
            if (job.getId() == null) job.setId(UUID.randomUUID());
            return job;
        });

        when(resultRepository.save(any(DesignResult.class))).thenAnswer(inv -> {
            DesignResult result = inv.getArgument(0);
            if (result.getId() == null) result.setId(UUID.randomUUID());
            resultsByJobId.put(result.getJobId(), result);
            return result;
        });
        when(resultRepository.findByJobId(any(UUID.class)))
                .thenAnswer(inv -> Optional.ofNullable(resultsByJobId.get((UUID) inv.getArgument(0))));

        when(furnitureItemRepository.save(any(DesignFurnitureItem.class))).thenAnswer(inv -> {
            DesignFurnitureItem item = inv.getArgument(0);
            if (item.getId() == null) item.setId(UUID.randomUUID());
            furnitureByResultId.computeIfAbsent(item.getResultId(), k -> new ArrayList<>()).add(item);
            return item;
        });
        when(furnitureItemRepository.findByResultId(any(UUID.class)))
                .thenAnswer(inv -> furnitureByResultId.getOrDefault(inv.getArgument(0), List.of()));

        when(colorPaletteRepository.save(any(DesignColorPalette.class))).thenAnswer(inv -> {
            DesignColorPalette color = inv.getArgument(0);
            if (color.getId() == null) color.setId(UUID.randomUUID());
            colorsByResultId.computeIfAbsent(color.getResultId(), k -> new ArrayList<>()).add(color);
            return color;
        });
        when(colorPaletteRepository.findByResultId(any(UUID.class)))
                .thenAnswer(inv -> colorsByResultId.getOrDefault(inv.getArgument(0), List.of()));
    }

    private DesignJob completedSourceJob() {
        DesignJob job = new DesignJob();
        job.setId(sourceJobId);
        job.setOwnerId(ownerId);
        job.setRoomId(roomId);
        job.setPreferenceId(preferenceId);
        job.setStatus("COMPLETED");
        return job;
    }

    private DesignResult sourceResult() {
        DesignResult result = new DesignResult();
        result.setId(sourceResultId);
        result.setJobId(sourceJobId);
        result.setDecorDescription("Phong cách tối giản");
        result.setLayoutDescription("Bám tường dài");
        result.setAiExplanation("Giải thích AI");
        result.setEstimatedCost(24_000_000L);
        result.setResultAssetId(null);
        return result;
    }

    private DesignFurnitureItem sourceFurniture() {
        DesignFurnitureItem item = new DesignFurnitureItem();
        item.setId(UUID.randomUUID());
        item.setResultId(sourceResultId);
        item.setName("Sofa");
        item.setCategory("seating");
        item.setPosition("Sát tường");
        item.setEstimatedCost(10_500_000L);
        return item;
    }

    private DesignColorPalette sourceColor() {
        DesignColorPalette color = new DesignColorPalette();
        color.setId(UUID.randomUUID());
        color.setResultId(sourceResultId);
        color.setColorHex("#E8E2D8");
        color.setRole("PRIMARY");
        return color;
    }

    @Test
    void duplicateJob_shouldCloneIndependentRecords_andNotTouchUsageLimit() {
        DesignJob sourceJob = completedSourceJob();
        DesignFurnitureItem sourceFurniture = sourceFurniture();
        DesignColorPalette sourceColor = sourceColor();

        when(jobRepository.findById(sourceJobId)).thenReturn(Optional.of(sourceJob));
        resultsByJobId.put(sourceJobId, sourceResult());
        furnitureByResultId.put(sourceResultId, List.of(sourceFurniture));
        colorsByResultId.put(sourceResultId, List.of(sourceColor));

        DesignJobResponse response = designService.duplicateJob(ownerId, sourceJobId);

        assertThat(response.jobId()).isNotEqualTo(sourceJobId);
        assertThat(response.roomId()).isEqualTo(roomId);
        assertThat(response.status()).isEqualTo("COMPLETED");
        assertThat(response.result()).isNotNull();
        assertThat(response.result().decorDescription()).isEqualTo("Phong cách tối giản");
        assertThat(response.result().estimatedCost()).isEqualTo(24_000_000L);
        assertThat(response.result().furniture()).hasSize(1);
        assertThat(response.result().furniture().get(0).name()).isEqualTo("Sofa");
        assertThat(response.result().colors()).hasSize(1);
        assertThat(response.result().colors().get(0).colorHex()).isEqualTo("#E8E2D8");

        // Job mới lưu với status COMPLETED ngay (không qua PENDING/PROCESSING) + đánh dấu
        // duplicatedFromJobId = job gốc (TASK-093, dùng để loại trừ khỏi usage limit).
        ArgumentCaptor<DesignJob> jobCaptor = ArgumentCaptor.forClass(DesignJob.class);
        verify(jobRepository, times(1)).save(jobCaptor.capture());
        DesignJob savedNewJob = jobCaptor.getValue();
        assertThat(savedNewJob.getStatus()).isEqualTo("COMPLETED");
        assertThat(savedNewJob.getDuplicatedFromJobId()).isEqualTo(sourceJobId);
        assertThat(savedNewJob.getOwnerId()).isEqualTo(ownerId);
        assertThat(savedNewJob.getRoomId()).isEqualTo(roomId);
        assertThat(savedNewJob.getPreferenceId()).isEqualTo(preferenceId);
        assertThat(savedNewJob.getId()).isNotEqualTo(sourceJobId);

        // furniture/color clone là bản ghi MỚI, ĐỘC LẬP: id khác, resultId trỏ sang result mới.
        ArgumentCaptor<DesignFurnitureItem> furnitureCaptor = ArgumentCaptor.forClass(DesignFurnitureItem.class);
        verify(furnitureItemRepository, times(1)).save(furnitureCaptor.capture());
        DesignFurnitureItem clonedFurniture = furnitureCaptor.getValue();
        assertThat(clonedFurniture.getId()).isNotEqualTo(sourceFurniture.getId());
        assertThat(clonedFurniture.getResultId()).isNotEqualTo(sourceResultId);
        assertThat(clonedFurniture.getName()).isEqualTo(sourceFurniture.getName());
        assertThat(clonedFurniture.getEstimatedCost()).isEqualTo(sourceFurniture.getEstimatedCost());

        ArgumentCaptor<DesignColorPalette> colorCaptor = ArgumentCaptor.forClass(DesignColorPalette.class);
        verify(colorPaletteRepository, times(1)).save(colorCaptor.capture());
        DesignColorPalette clonedColor = colorCaptor.getValue();
        assertThat(clonedColor.getId()).isNotEqualTo(sourceColor.getId());
        assertThat(clonedColor.getResultId()).isNotEqualTo(sourceResultId);
        assertThat(clonedColor.getColorHex()).isEqualTo(sourceColor.getColorHex());

        // CRITICAL (TASK-093): duplicate KHÔNG được gọi qua đường usage-limit/hàng đợi generate thật.
        verifyNoInteractions(billingService);
        verifyNoInteractions(jobProcessor);
    }

    @Test
    void duplicateJob_shouldRejectNonOwner() {
        DesignJob sourceJob = completedSourceJob(); // owner = ownerId, caller bên dưới là người khác
        when(jobRepository.findById(sourceJobId)).thenReturn(Optional.of(sourceJob));

        UUID anotherUserId = UUID.randomUUID();

        assertThatThrownBy(() -> designService.duplicateJob(anotherUserId, sourceJobId))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verifyNoInteractions(resultRepository);
        verify(jobRepository, never()).save(any());
        verifyNoInteractions(billingService);
    }

    // TASK-103: toggle yêu thích — chủ sở hữu bật/tắt được, giá trị lưu và trả về khớp nhau.
    @Test
    void toggleFavorite_shouldFlipValue_forOwner() {
        DesignJob job = completedSourceJob();
        assertThat(job.isFavorite()).isFalse();
        when(jobRepository.findById(sourceJobId)).thenReturn(Optional.of(job));

        DesignJobResponse firstToggle = designService.toggleFavorite(ownerId, sourceJobId);
        assertThat(firstToggle.isFavorite()).isTrue();
        assertThat(job.isFavorite()).isTrue();

        DesignJobResponse secondToggle = designService.toggleFavorite(ownerId, sourceJobId);
        assertThat(secondToggle.isFavorite()).isFalse();
        assertThat(job.isFavorite()).isFalse();

        verify(jobRepository, times(2)).save(job);
    }

    // TASK-103: security — user khác (không phải chủ sở hữu) không được toggle favorite job không
    // thuộc mình, đúng pattern lỗi FORBIDDEN/JOB_ACCESS_DENIED hiện có (giống duplicateJob).
    @Test
    void toggleFavorite_shouldRejectNonOwner() {
        DesignJob job = completedSourceJob(); // owner = ownerId
        when(jobRepository.findById(sourceJobId)).thenReturn(Optional.of(job));

        UUID anotherUserId = UUID.randomUUID();

        assertThatThrownBy(() -> designService.toggleFavorite(anotherUserId, sourceJobId))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(apiEx.getCode()).isEqualTo("JOB_ACCESS_DENIED");
                });

        assertThat(job.isFavorite()).isFalse();
        verify(jobRepository, never()).save(any());
    }

    // TASK-103: job không tồn tại -> 404 JOB_NOT_FOUND (đúng pattern lỗi hiện có).
    @Test
    void toggleFavorite_shouldRejectWhenJobNotFound() {
        UUID missingJobId = UUID.randomUUID();
        when(jobRepository.findById(missingJobId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> designService.toggleFavorite(ownerId, missingJobId))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(apiEx.getCode()).isEqualTo("JOB_NOT_FOUND");
                });
    }

    // TASK-103: favoriteOnly kết hợp AND với status — khi cả hai được truyền, phải gọi đúng
    // repository method findByOwnerIdAndStatusAndIsFavoriteTrue (không phải OR/bỏ qua status).
    @Test
    void listJobs_shouldCombineFavoriteOnlyAndStatus_withAnd() {
        DesignJob favoriteCompletedJob = completedSourceJob();
        favoriteCompletedJob.setFavorite(true);
        Pageable pageable = PageRequest.of(0, 10);
        Page<DesignJob> page = new PageImpl<>(List.of(favoriteCompletedJob));
        when(jobRepository.findByOwnerIdAndStatusAndIsFavoriteTrue(ownerId, "COMPLETED", pageable)).thenReturn(page);
        when(roomService.findByIds(any())).thenReturn(Map.of());

        var result = designService.listJobs(ownerId, "COMPLETED", true, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).isFavorite()).isTrue();
        verify(jobRepository).findByOwnerIdAndStatusAndIsFavoriteTrue(ownerId, "COMPLETED", pageable);
        verify(jobRepository, never()).findByOwnerIdAndStatus(any(), any(), any());
    }

    // TASK-103: favoriteOnly=false (không truyền) phải giữ nguyên hành vi cũ, không đụng đường
    // favorite mới — tránh hồi quy filter status hiện có.
    @Test
    void listJobs_shouldKeepOldBehavior_whenFavoriteOnlyFalse() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<DesignJob> page = new PageImpl<>(List.of(completedSourceJob()));
        when(jobRepository.findByOwnerIdAndStatus(ownerId, "COMPLETED", pageable)).thenReturn(page);
        when(roomService.findByIds(any())).thenReturn(Map.of());

        designService.listJobs(ownerId, "COMPLETED", pageable);

        verify(jobRepository).findByOwnerIdAndStatus(ownerId, "COMPLETED", pageable);
        verify(jobRepository, never()).findByOwnerIdAndStatusAndIsFavoriteTrue(any(), any(), any());
    }

    @Test
    void duplicateJob_shouldRejectWhenSourceJobNotCompleted() {
        DesignJob pendingJob = completedSourceJob();
        pendingJob.setStatus("PENDING");
        when(jobRepository.findById(sourceJobId)).thenReturn(Optional.of(pendingJob));

        assertThatThrownBy(() -> designService.duplicateJob(ownerId, sourceJobId))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiEx.getCode()).isEqualTo("JOB_NOT_COMPLETED");
                });

        verifyNoInteractions(resultRepository);
        verify(jobRepository, never()).save(any());
    }

    // ---------------------------------------------------------------------------------------
    // TASK-111: Admin Data Integrity Checker — verify LOGIC tìm mồ côi bằng repository giả lập
    // (không phụ thuộc DB thật, vốn có FK constraint cứng ở mọi quan hệ này nên không thể tạo
    // orphan thật qua INSERT bình thường để test E2E — xem V1__init.sql). Mỗi test có cả case
    // "có orphan" (bắt đúng, không bắt nhầm bản ghi hợp lệ khác) và ngầm định case "không orphan"
    // (roomId/preferenceId hợp lệ trong cùng list không bị liệt kê).
    // ---------------------------------------------------------------------------------------

    @Test
    void findOrphanJobRoomRefIds_shouldReturnOnlyJobsWithMissingRoom() {
        UUID okRoomId = UUID.randomUUID();
        UUID missingRoomId = UUID.randomUUID();
        UUID okJobId = UUID.randomUUID();
        UUID orphanJobId = UUID.randomUUID();

        DesignJob okJob = new DesignJob();
        okJob.setId(okJobId);
        okJob.setRoomId(okRoomId);

        DesignJob orphanJob = new DesignJob();
        orphanJob.setId(orphanJobId);
        orphanJob.setRoomId(missingRoomId);

        when(jobRepository.findAll()).thenReturn(List.of(okJob, orphanJob));
        when(roomService.findMissingRoomIds(anySet())).thenReturn(java.util.Set.of(missingRoomId));

        List<UUID> orphanIds = designService.findOrphanJobRoomRefIds();

        assertThat(orphanIds).containsExactly(orphanJobId);
    }

    @Test
    void findOrphanJobRoomRefIds_shouldReturnEmpty_whenNoMissingRoom() {
        DesignJob okJob = completedSourceJob();
        when(jobRepository.findAll()).thenReturn(List.of(okJob));
        when(roomService.findMissingRoomIds(anySet())).thenReturn(java.util.Set.of());

        assertThat(designService.findOrphanJobRoomRefIds()).isEmpty();
    }

    @Test
    void findOrphanJobPreferenceRefIds_shouldIgnoreNullPreference_andReturnOnlyMissingOnes() {
        UUID missingPreferenceId = UUID.randomUUID();
        UUID orphanJobId = UUID.randomUUID();

        DesignJob jobWithNullPreference = new DesignJob();
        jobWithNullPreference.setId(UUID.randomUUID());
        jobWithNullPreference.setRoomId(UUID.randomUUID());
        jobWithNullPreference.setPreferenceId(null);

        DesignJob orphanJob = new DesignJob();
        orphanJob.setId(orphanJobId);
        orphanJob.setRoomId(UUID.randomUUID());
        orphanJob.setPreferenceId(missingPreferenceId);

        when(jobRepository.findAll()).thenReturn(List.of(jobWithNullPreference, orphanJob));
        when(roomService.findMissingPreferenceIds(anySet())).thenReturn(java.util.Set.of(missingPreferenceId));

        List<UUID> orphanIds = designService.findOrphanJobPreferenceRefIds();

        assertThat(orphanIds).containsExactly(orphanJobId);
    }

    @Test
    void findOrphanResultIds_shouldReturnResultsWithMissingJob() {
        UUID okJobId = UUID.randomUUID();
        UUID missingJobId = UUID.randomUUID();

        DesignResult okResult = new DesignResult();
        okResult.setId(UUID.randomUUID());
        okResult.setJobId(okJobId);

        DesignResult orphanResult = new DesignResult();
        orphanResult.setId(UUID.randomUUID());
        orphanResult.setJobId(missingJobId);

        DesignJob okJob = new DesignJob();
        okJob.setId(okJobId);

        when(jobRepository.findAll()).thenReturn(List.of(okJob));
        when(resultRepository.findAll()).thenReturn(List.of(okResult, orphanResult));

        List<UUID> orphanIds = designService.findOrphanResultIds();

        assertThat(orphanIds).containsExactly(orphanResult.getId());
    }

    @Test
    void findOrphanFurnitureItemIds_shouldReturnItemsWithMissingResult() {
        UUID okResultId = UUID.randomUUID();
        UUID missingResultId = UUID.randomUUID();

        DesignFurnitureItem okItem = new DesignFurnitureItem();
        okItem.setId(UUID.randomUUID());
        okItem.setResultId(okResultId);

        DesignFurnitureItem orphanItem = new DesignFurnitureItem();
        orphanItem.setId(UUID.randomUUID());
        orphanItem.setResultId(missingResultId);

        DesignResult okResult = new DesignResult();
        okResult.setId(okResultId);

        when(resultRepository.findAll()).thenReturn(List.of(okResult));
        when(furnitureItemRepository.findAll()).thenReturn(List.of(okItem, orphanItem));

        List<UUID> orphanIds = designService.findOrphanFurnitureItemIds();

        assertThat(orphanIds).containsExactly(orphanItem.getId());
    }

    @Test
    void findMissingJobIds_shouldReturnOnlyIdsNotInRepository() {
        UUID existingJobId = UUID.randomUUID();
        UUID missingJobId = UUID.randomUUID();

        DesignJob existingJob = new DesignJob();
        existingJob.setId(existingJobId);

        when(jobRepository.findAllById(any())).thenReturn(List.of(existingJob));

        java.util.Set<UUID> missing = designService.findMissingJobIds(List.of(existingJobId, missingJobId));

        assertThat(missing).containsExactly(missingJobId);
    }

    @Test
    void findMissingJobIds_shouldReturnEmptySet_whenInputEmpty() {
        java.util.Set<UUID> missing = designService.findMissingJobIds(List.of());

        assertThat(missing).isEmpty();
        verifyNoInteractions(jobRepository);
    }
}
