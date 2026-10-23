package com.homely.api.aidesign;

import com.homely.api.aidesign.dto.DesignJobExportResponse;
import com.homely.api.aidesign.dto.DesignJobResponse;
import com.homely.api.aidesign.dto.DesignJobSummaryResponse;
import com.homely.api.aidesign.dto.GenerateDesignRequest;
import com.homely.api.billing.BillingService;
import com.homely.api.common.ApiException;
import com.homely.api.room.Room;
import com.homely.api.room.RoomPreference;
import com.homely.api.room.RoomService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DesignService {

    private static final Set<String> VALID_STATUSES = Set.of("PENDING", "PROCESSING", "COMPLETED", "FAILED");

    // TASK-100: trạng thái đủ điều kiện xuất hiện ở "Recently Edited / Continue Designing".
    private static final Set<String> RECENT_EDITED_STATUSES = Set.of("PROCESSING", "COMPLETED");

    // TASK-100: tối đa 5 job — trước đây dùng "findTop5By..." (derive từ tên method), TASK-107 đổi
    // repository method này sang @Query (để thêm lọc deletedAt) nên giới hạn số lượng chuyển sang
    // truyền qua Pageable, giữ đúng hành vi "tối đa 5" cũ (xem DesignJobRepository.findRecentByOwnerIdAndStatusIn).
    private static final int RECENT_EDITED_LIMIT = 5;

    // TASK-106: giá trị `sort` hợp lệ cho listMine — giá trị khác/rỗng dùng mặc định createdAt_desc,
    // KHÔNG lỗi 400 (tránh phá trải nghiệm nếu FE/consumer cũ gửi giá trị lạ).
    private static final Set<String> VALID_SORTS = Set.of("createdAt_desc", "createdAt_asc", "updatedAt_desc", "roomType_asc");

    // TASK-106: giới hạn độ dài tên riêng, khớp cột custom_name NVARCHAR(200) (V9 migration).
    private static final int CUSTOM_NAME_MAX_LENGTH = 200;

    // TASK-123: giới hạn độ dài ghi chú nhanh, khớp cột note NVARCHAR(500) (V11 migration).
    private static final int NOTE_MAX_LENGTH = 500;

    // TASK-107: status nội bộ đánh dấu job đã bị xoá VĨNH VIỄN — KHÔNG xoá vật lý row design_jobs
    // (xem permanentlyDeleteJob) để countJobsSince/usage-me không bị giảm ngược khi xoá vĩnh viễn
    // (Out of scope TASK-107: "KHÔNG hoàn lượt đã dùng", tránh lỗ hổng lách giới hạn gói bằng
    // xoá-tạo lại liên tục). Với MỌI thao tác của user (và link share công khai), job PURGED phải
    // coi như không tồn tại (404) — xem getOwnedJob/getJobForSharing. KHÔNG thêm vào VALID_STATUSES
    // ở trên (không phải trạng thái xử lý generate, không cho filter GET /designs?status=PURGED).
    // Admin (getJobForAdmin, KHÔNG lọc) vẫn tra được tombstone này để audit.
    private static final String STATUS_PURGED = "PURGED";

    private final DesignJobRepository jobRepository;
    private final DesignResultRepository resultRepository;
    private final DesignFurnitureItemRepository furnitureItemRepository;
    private final DesignColorPaletteRepository colorPaletteRepository;
    private final DesignJobProcessor jobProcessor;
    private final RoomService roomService;
    private final BillingService billingService;

    public DesignService(DesignJobRepository jobRepository,
                          DesignResultRepository resultRepository,
                          DesignFurnitureItemRepository furnitureItemRepository,
                          DesignColorPaletteRepository colorPaletteRepository,
                          DesignJobProcessor jobProcessor,
                          RoomService roomService,
                          BillingService billingService) {
        this.jobRepository = jobRepository;
        this.resultRepository = resultRepository;
        this.furnitureItemRepository = furnitureItemRepository;
        this.colorPaletteRepository = colorPaletteRepository;
        this.jobProcessor = jobProcessor;
        this.roomService = roomService;
        this.billingService = billingService;
    }

    public DesignJob createJob(UUID ownerId, GenerateDesignRequest request) {
        // Kiểm tra ownership của room trước khi tạo job — rules/security/authorization.md
        roomService.getOwned(ownerId, request.roomId());

        // Kiểm tra giới hạn gói trước khi tạo job — xem docs/services/billing-service.md.
        long used = countJobsSince(ownerId, BillingService.startOfCurrentMonth());
        billingService.checkUsageLimit(ownerId, used);

        DesignJob job = new DesignJob();
        job.setOwnerId(ownerId);
        job.setRoomId(request.roomId());
        job.setPreferenceId(request.preferenceId());
        job = jobRepository.save(job);

        jobProcessor.process(job.getId());
        return job;
    }

    public DesignJobResponse getJobWithResult(UUID ownerId, UUID jobId) {
        DesignJob job = getOwnedJob(ownerId, jobId);
        return buildJobResponse(job);
    }

    /** Kiểm tra ownership + trả entity thật — dùng bởi module `sharing` khi bật/tắt chia sẻ
     *  (TASK-078, cùng pattern check quyền với RoomService.getOwned). */
    public DesignJob getOwnedJob(UUID ownerId, UUID jobId) {
        DesignJob job = findJobOrThrow(jobId);
        if (!job.getOwnerId().equals(ownerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "JOB_ACCESS_DENIED", "Bạn không có quyền xem job này");
        }
        rejectIfPurged(job);
        return job;
    }

    /** TASK-107: job PURGED (đã xoá vĩnh viễn) phải coi như KHÔNG TỒN TẠI với mọi thao tác của user
     *  — cùng mã lỗi JOB_NOT_FOUND với "chưa từng tồn tại" (không tiết lộ job đã từng bị xoá vĩnh
     *  viễn). Đặt SAU kiểm tra ownership (403 vẫn ưu tiên hơn cho job không thuộc sở hữu). */
    private void rejectIfPurged(DesignJob job) {
        if (STATUS_PURGED.equals(job.getStatus())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Design job not found");
        }
    }

    /**
     * TASK-078: đọc job KHÔNG kiểm tra ownership — chỉ dùng bởi module `sharing` sau khi đã tự
     * xác thực qua share token còn hiệu lực (kiểm soát truy cập nằm ở tầng share, không phải ở
     * đây). DesignJobResponse vốn không có ownerId/email nên an toàn để trả public.
     */
    public DesignJobResponse getJobForSharing(UUID jobId) {
        DesignJob job = findJobOrThrow(jobId);
        rejectIfPurged(job);
        return buildJobResponse(job);
    }

    /**
     * TASK-093: nhân bản job COMPLETED thành DesignJob/DesignResult/furniture/colors ĐỘC LẬP,
     * status=COMPLETED ngay (không qua jobProcessor/hàng đợi generate). KHÔNG gọi
     * billingService.checkUsageLimit/countJobsSince như createJob — đây là sao chép, không phải
     * generate AI mới nên KHÔNG được tính vào giới hạn lượt tạo thiết kế theo gói (xem Scope TASK-093).
     */
    @Transactional
    public DesignJobResponse duplicateJob(UUID ownerId, UUID jobId) {
        DesignJob sourceJob = getOwnedJob(ownerId, jobId);
        if (!"COMPLETED".equals(sourceJob.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JOB_NOT_COMPLETED",
                    "Chỉ có thể nhân bản job đã hoàn thành (COMPLETED)");
        }

        DesignResult sourceResult = resultRepository.findByJobId(sourceJob.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESULT_NOT_FOUND", "Job chưa có kết quả để nhân bản"));

        DesignJob newJob = new DesignJob();
        newJob.setOwnerId(sourceJob.getOwnerId());
        newJob.setRoomId(sourceJob.getRoomId());
        newJob.setPreferenceId(sourceJob.getPreferenceId());
        newJob.setStatus("COMPLETED");
        newJob.setDuplicatedFromJobId(sourceJob.getId());
        newJob = jobRepository.save(newJob);

        DesignResult newResult = new DesignResult();
        newResult.setJobId(newJob.getId());
        newResult.setDecorDescription(sourceResult.getDecorDescription());
        newResult.setLayoutDescription(sourceResult.getLayoutDescription());
        newResult.setAiExplanation(sourceResult.getAiExplanation());
        newResult.setEstimatedCost(sourceResult.getEstimatedCost());
        newResult.setResultAssetId(sourceResult.getResultAssetId());
        newResult = resultRepository.save(newResult);

        for (DesignFurnitureItem item : furnitureItemRepository.findByResultId(sourceResult.getId())) {
            DesignFurnitureItem clone = new DesignFurnitureItem();
            clone.setResultId(newResult.getId());
            clone.setName(item.getName());
            clone.setCategory(item.getCategory());
            clone.setPosition(item.getPosition());
            clone.setEstimatedCost(item.getEstimatedCost());
            clone.setModelAssetId(item.getModelAssetId());
            furnitureItemRepository.save(clone);
        }

        for (DesignColorPalette color : colorPaletteRepository.findByResultId(sourceResult.getId())) {
            DesignColorPalette clone = new DesignColorPalette();
            clone.setResultId(newResult.getId());
            clone.setColorHex(color.getColorHex());
            clone.setRole(color.getRole());
            colorPaletteRepository.save(clone);
        }

        return buildJobResponse(newJob);
    }

    /**
     * TASK-103: toggle qua lại true/false trạng thái yêu thích của 1 job. Dùng getOwnedJob (cùng
     * pattern check quyền với duplicateJob) để đảm bảo user A không đánh dấu được job của user B —
     * job không tồn tại -> 404 JOB_NOT_FOUND, tồn tại nhưng không phải chủ sở hữu -> 403
     * JOB_ACCESS_DENIED (đúng pattern lỗi hiện có, không tạo mã lỗi mới).
     */
    @Transactional
    public DesignJobResponse toggleFavorite(UUID ownerId, UUID jobId) {
        DesignJob job = getOwnedJob(ownerId, jobId);
        job.setFavorite(!job.isFavorite());
        jobRepository.save(job);
        return buildJobResponse(job);
    }

    /**
     * TASK-106: đặt/xoá tên riêng của job (Design Naming Assistant). Dùng getOwnedJob (cùng pattern
     * check quyền với toggleFavorite/duplicateJob) — job không tồn tại -> 404 JOB_NOT_FOUND, không
     * phải chủ sở hữu -> 403 JOB_ACCESS_DENIED. customName null hoặc rỗng (sau khi trim) nghĩa là
     * XOÁ tên riêng, quay về tên tự sinh (suggestedName) — không tạo giá trị mặc định giả.
     */
    @Transactional
    public DesignJobResponse setCustomName(UUID ownerId, UUID jobId, String customName) {
        DesignJob job = getOwnedJob(ownerId, jobId);
        String trimmed = customName == null ? null : customName.trim();
        if (trimmed != null && trimmed.isEmpty()) {
            trimmed = null;
        }
        if (trimmed != null && trimmed.length() > CUSTOM_NAME_MAX_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CUSTOM_NAME_TOO_LONG",
                    "Tên thiết kế tối đa " + CUSTOM_NAME_MAX_LENGTH + " ký tự");
        }
        job.setCustomName(trimmed);
        jobRepository.save(job);
        return buildJobResponse(job);
    }

    /**
     * TASK-123: đặt/xoá ghi chú nhanh (Quick Notes) của job. Dùng getOwnedJob (cùng pattern check
     * quyền với setCustomName/toggleFavorite) — job không tồn tại -> 404 JOB_NOT_FOUND, không phải
     * chủ sở hữu -> 403 JOB_ACCESS_DENIED. note null hoặc rỗng (sau khi trim) nghĩa là XOÁ ghi chú.
     */
    @Transactional
    public DesignJobResponse setNote(UUID ownerId, UUID jobId, String note) {
        DesignJob job = getOwnedJob(ownerId, jobId);
        String trimmed = note == null ? null : note.trim();
        if (trimmed != null && trimmed.isEmpty()) {
            trimmed = null;
        }
        if (trimmed != null && trimmed.length() > NOTE_MAX_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NOTE_TOO_LONG",
                    "Ghi chú tối đa " + NOTE_MAX_LENGTH + " ký tự");
        }
        job.setNote(trimmed);
        jobRepository.save(job);
        return buildJobResponse(job);
    }

    /**
     * TASK-107: xoá MỀM — set deletedAt = now, job biến mất khỏi mọi listing thường của user ngay
     * (xem DesignJobRepository) nhưng vẫn còn nguyên dữ liệu, hiện trong GET /designs/trash, khôi
     * phục được. Cùng pattern check quyền với toggleFavorite/setCustomName (getOwnedJob).
     */
    @Transactional
    public DesignJobResponse softDeleteJob(UUID ownerId, UUID jobId) {
        DesignJob job = getOwnedJob(ownerId, jobId);
        job.setDeletedAt(Instant.now());
        jobRepository.save(job);
        return buildJobResponse(job);
    }

    /**
     * TASK-107: khôi phục job từ thùng rác — set deletedAt = null, job quay lại đúng vị trí trong
     * Projects (createdAt/mọi dữ liệu khác giữ nguyên, không đổi). Job chưa từng ở trong thùng rác
     * (deletedAt đã null) -> 400 JOB_NOT_IN_TRASH, tránh gọi nhầm/gọi lặp vô nghĩa.
     */
    @Transactional
    public DesignJobResponse restoreJob(UUID ownerId, UUID jobId) {
        DesignJob job = getOwnedJob(ownerId, jobId);
        if (job.getDeletedAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JOB_NOT_IN_TRASH", "Job này không ở trong thùng rác");
        }
        job.setDeletedAt(null);
        jobRepository.save(job);
        return buildJobResponse(job);
    }

    /**
     * TASK-107: xoá VĨNH VIỄN — CHỈ cho phép khi job ĐÃ ở trong thùng rác (deletedAt != null), tránh
     * xoá nhầm trực tiếp không qua bước xoá mềm trước (-> 400 JOB_NOT_IN_TRASH nếu chưa). Xoá thật
     * dữ liệu con THUỘC module aidesign theo đúng thứ tự tránh vi phạm khoá ngoại: color palette +
     * furniture item (con của DesignResult) trước, rồi DesignResult, dựa trên đúng các repository
     * DesignResultWriter đã dùng khi TẠO dữ liệu (V1__init.sql: fk_furniture_result/fk_colors_result
     * -> design_results, fk_results_job -> design_jobs).
     * <p>
     * KHÔNG xoá vật lý row design_jobs — giữ lại làm "tombstone" (status = PURGED, xem hằng số ở
     * trên) vì 2 lý do bắt buộc của task: (1) countJobsSince tính usage/me bằng COUNT(*) trên chính
     * bảng design_jobs — xoá hẳn row sẽ khiến usage/me TỰ GIẢM sau khi xoá vĩnh viễn, đúng lỗ hổng
     * "lách giới hạn gói bằng xoá-tạo lại liên tục" mà Out of scope của TASK-107 yêu cầu tránh; (2)
     * design_share/design_comment thuộc module `sharing` (đã phụ thuộc NGƯỢC vào aidesign qua
     * ShareService -> DesignService) — aidesign KHÔNG được phép phụ thuộc lại vào sharing (vi phạm
     * "không dependency vòng", xem rules/architecture/dependency-rules.md) nên không thể tự xoá
     * design_share/design_comment từ đây; vì job row vẫn còn tồn tại (chỉ đổi status), FK
     * fk_design_share_job vẫn hợp lệ, KHÔNG có nguy cơ vi phạm khoá ngoại. Với user (getOwnedJob) và
     * link share công khai (getJobForSharing), job PURGED bị chặn 404 ngay — coi như đã biến mất
     * hoàn toàn khỏi hệ thống dù row nội bộ còn giữ để không ảnh hưởng usage/me.
     */
    @Transactional
    public void permanentlyDeleteJob(UUID ownerId, UUID jobId) {
        DesignJob job = getOwnedJob(ownerId, jobId);
        if (job.getDeletedAt() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JOB_NOT_IN_TRASH",
                    "Chỉ xoá vĩnh viễn job đã ở trong thùng rác — xoá mềm trước");
        }

        resultRepository.findByJobId(job.getId()).ifPresent(result -> {
            colorPaletteRepository.deleteAll(colorPaletteRepository.findByResultId(result.getId()));
            furnitureItemRepository.deleteAll(furnitureItemRepository.findByResultId(result.getId()));
            resultRepository.delete(result);
        });

        job.setStatus(STATUS_PURGED);
        job.setErrorMessage(null);
        jobRepository.save(job);
    }

    /** TASK-107: GET /api/v1/designs/trash — job đã xoá mềm của CHÍNH user, mới xoá trước. */
    public Page<DesignJobSummaryResponse> listTrash(UUID ownerId, Pageable pageable) {
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("deletedAt").descending());
        Page<DesignJob> page = jobRepository.findByOwnerIdAndDeletedAtIsNotNullAndStatusNot(ownerId, STATUS_PURGED, sorted);
        return mapPageToSummary(page);
    }

    /**
     * TASK-104: tra job theo id KHÔNG kiểm tra ownership — chỉ dùng bởi Admin Data Explorer để tra
     * ngược "job này của ai" (RBAC ADMIN đã chặn ở tầng controller/SecurityConfig). Trả entity thật
     * (như getOwnedJob/getJobForSharing) để admin module tự map DTO.
     */
    public DesignJob getJobForAdmin(UUID jobId) {
        return findJobOrThrow(jobId);
    }

    /** TASK-104: toàn bộ job của 1 room (raw entity), mới nhất trước — dùng bởi Admin Data Explorer
     *  khi liệt kê "user này có room/job nào". Số lượng nhỏ nên không phân trang (Out of scope). */
    public List<DesignJob> listJobsForRoom(UUID roomId) {
        return jobRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
    }

    private DesignJob findJobOrThrow(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Design job not found"));
    }

    private DesignJobResponse buildJobResponse(DesignJob job) {
        if (!"COMPLETED".equals(job.getStatus())) {
            return DesignJobResponse.pending(job);
        }

        DesignResult result = resultRepository.findByJobId(job.getId()).orElse(null);
        if (result == null) {
            return DesignJobResponse.pending(job);
        }

        List<DesignJobResponse.FurnitureItemResponse> furniture = furnitureItemRepository.findByResultId(result.getId())
                .stream()
                .map(f -> new DesignJobResponse.FurnitureItemResponse(f.getName(), f.getCategory(), f.getPosition(), f.getEstimatedCost(), f.getModelAssetId()))
                .toList();

        List<DesignJobResponse.ColorResponse> colors = colorPaletteRepository.findByResultId(result.getId())
                .stream()
                .map(c -> new DesignJobResponse.ColorResponse(c.getColorHex(), c.getRole()))
                .toList();

        var resultResponse = new DesignJobResponse.DesignResultResponse(
                result.getDecorDescription(),
                result.getLayoutDescription(),
                result.getAiExplanation(),
                result.getEstimatedCost(),
                result.getResultAssetId(),
                furniture,
                colors
        );

        return DesignJobResponse.withResult(job, resultResponse);
    }

    /** TASK-093: loại trừ job nhân bản (duplicatedFromJobId != null) — job nhân bản không phải
     *  lượt generate AI thật, không được tính vào giới hạn gói (dùng ở cả checkUsageLimit lẫn
     *  GET /usage/me nên số liệu usage không đổi khi nhân bản, xem UsageController). */
    public long countJobsSince(UUID ownerId, Instant since) {
        return jobRepository.countByOwnerIdAndCreatedAtGreaterThanEqualAndDuplicatedFromJobIdIsNull(ownerId, since);
    }

    public long countByStatus(String status) {
        return jobRepository.countByStatus(status);
    }

    /** TASK-094: job đang chờ hoặc đang xử lý ngay lúc gọi — dùng cho admin system health. */
    public long countPendingOrProcessing() {
        return jobRepository.countByStatusIn(Set.of("PENDING", "PROCESSING"));
    }

    /** TASK-094: job FAILED được tạo trong khoảng thời gian gần đây (ví dụ 24h). */
    public long countFailedSince(Instant since) {
        return jobRepository.countByStatusAndCreatedAtGreaterThanEqual("FAILED", since);
    }

    /** TASK-094: job PROCESSING nhưng lâu chưa được cập nhật — dấu hiệu có thể bị treo. */
    public long countStuckProcessing(Instant updatedBefore) {
        return jobRepository.countByStatusAndUpdatedAtLessThan("PROCESSING", updatedBefore);
    }

    /**
     * ownerId == null nghĩa là "tất cả user" — dùng chung cho GET /designs (lịch sử của chính
     * user) và GET /admin/designs (admin xem tất cả) để không lặp logic paging/filter.
     */
    public Page<DesignJobSummaryResponse> listJobs(UUID ownerId, String status, Pageable pageable) {
        return listJobs(ownerId, status, false, pageable);
    }

    /**
     * TASK-103: thêm favoriteOnly — filter ĐỘC LẬP, kết hợp AND với status khi có (không thay thế).
     * favoriteOnly chỉ áp dụng khi có ownerId (dùng cho GET /designs của chính user); admin
     * (GET /admin/designs, ownerId=null) tiếp tục gọi overload 3 tham số ở trên, không đụng scope.
     */
    public Page<DesignJobSummaryResponse> listJobs(UUID ownerId, String status, boolean favoriteOnly, Pageable pageable) {
        if (status != null && !VALID_STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS", "Trạng thái không hợp lệ");
        }

        Page<DesignJob> page;
        if (ownerId != null) {
            if (favoriteOnly && status != null) {
                page = jobRepository.findByOwnerIdAndStatusAndIsFavoriteTrue(ownerId, status, pageable);
            } else if (favoriteOnly) {
                page = jobRepository.findByOwnerIdAndIsFavoriteTrue(ownerId, pageable);
            } else if (status != null) {
                page = jobRepository.findByOwnerIdAndStatus(ownerId, status, pageable);
            } else {
                page = jobRepository.findByOwnerId(ownerId, pageable);
            }
        } else {
            page = status != null ? jobRepository.findByStatus(status, pageable) : jobRepository.findAll(pageable);
        }

        return mapPageToSummary(page);
    }

    /**
     * TASK-106: overload RIÊNG thêm `sort` cho GET /api/v1/designs (Projects.jsx) — KHÔNG sửa
     * overload 4 tham số ở trên để không đổi hành vi/behavior các test/nơi gọi hiện có (Pageable
     * truyền thẳng, không bọc lại Sort). Controller.listMine gọi overload này.
     * Giá trị `sort` không hợp lệ/null -> mặc định "createdAt_desc" (giữ đúng hành vi cũ), KHÔNG lỗi 400.
     */
    public Page<DesignJobSummaryResponse> listJobs(UUID ownerId, String status, boolean favoriteOnly, String sort, Pageable pageable) {
        if (status != null && !VALID_STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS", "Trạng thái không hợp lệ");
        }
        String effectiveSort = (sort != null && VALID_SORTS.contains(sort)) ? sort : "createdAt_desc";

        // roomType không phải cột của DesignJob (thuộc bảng rooms, module `room`) nên không thể
        // ORDER BY bằng query derive-từ-tên trong module aidesign — xử lý riêng, xem
        // findAllByOwnerId*/listJobsSortedByRoomType (DesignJobRepository, TASK-106).
        if (ownerId != null && "roomType_asc".equals(effectiveSort)) {
            return listJobsSortedByRoomType(ownerId, status, favoriteOnly, pageable);
        }

        Sort sortSpec = switch (effectiveSort) {
            case "createdAt_asc" -> Sort.by("createdAt").ascending();
            case "updatedAt_desc" -> Sort.by("updatedAt").descending();
            default -> Sort.by("createdAt").descending();
        };
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sortSpec);

        Page<DesignJob> page;
        if (ownerId != null) {
            if (favoriteOnly && status != null) {
                page = jobRepository.findByOwnerIdAndStatusAndIsFavoriteTrue(ownerId, status, sortedPageable);
            } else if (favoriteOnly) {
                page = jobRepository.findByOwnerIdAndIsFavoriteTrue(ownerId, sortedPageable);
            } else if (status != null) {
                page = jobRepository.findByOwnerIdAndStatus(ownerId, status, sortedPageable);
            } else {
                page = jobRepository.findByOwnerId(ownerId, sortedPageable);
            }
        } else {
            page = status != null ? jobRepository.findByStatus(status, sortedPageable) : jobRepository.findAll(sortedPageable);
        }

        return mapPageToSummary(page);
    }

    /**
     * TASK-106: sort "roomType_asc" — lấy KHÔNG phân trang (chỉ theo status/favoriteOnly, vẫn đúng
     * ranh giới module vì chỉ query DesignJob), ghép roomType qua RoomService.findByIds, sort trong
     * Java rồi tự cắt trang thủ công (PageImpl). Dữ liệu cá nhân mỗi user thường nhỏ nên chấp nhận
     * đánh đổi hiệu năng này để không JOIN xuyên module.
     */
    private Page<DesignJobSummaryResponse> listJobsSortedByRoomType(UUID ownerId, String status, boolean favoriteOnly, Pageable pageable) {
        List<DesignJob> all;
        if (favoriteOnly && status != null) {
            all = jobRepository.findAllByOwnerIdAndStatusAndIsFavoriteTrue(ownerId, status);
        } else if (favoriteOnly) {
            all = jobRepository.findAllByOwnerIdAndIsFavoriteTrue(ownerId);
        } else if (status != null) {
            all = jobRepository.findAllByOwnerIdAndStatus(ownerId, status);
        } else {
            all = jobRepository.findAllByOwnerId(ownerId);
        }

        Map<UUID, Room> roomsById = roomService.findByIds(all.stream().map(DesignJob::getRoomId).distinct().toList());

        List<DesignJob> sorted = all.stream()
                .sorted(Comparator
                        .comparing((DesignJob job) -> Optional.ofNullable(roomsById.get(job.getRoomId()))
                                .map(Room::getRoomType).orElse(""), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(DesignJob::getCreatedAt, Comparator.reverseOrder()))
                .toList();

        int total = sorted.size();
        int start = Math.min((int) pageable.getOffset(), total);
        int end = Math.min(start + pageable.getPageSize(), total);
        List<DesignJob> pageContent = sorted.subList(start, end);

        Map<UUID, RoomPreference> prefsById = fetchPreferences(pageContent);
        List<DesignJobSummaryResponse> mapped = pageContent.stream()
                .map(job -> toSummaryResponse(job, roomsById, prefsById))
                .toList();

        return new PageImpl<>(mapped, pageable, total);
    }

    private Page<DesignJobSummaryResponse> mapPageToSummary(Page<DesignJob> page) {
        Map<UUID, Room> roomsById = roomService.findByIds(page.getContent().stream().map(DesignJob::getRoomId).distinct().toList());
        Map<UUID, RoomPreference> prefsById = fetchPreferences(page.getContent());
        return page.map(job -> toSummaryResponse(job, roomsById, prefsById));
    }

    private Map<UUID, RoomPreference> fetchPreferences(List<DesignJob> jobs) {
        List<UUID> preferenceIds = jobs.stream().map(DesignJob::getPreferenceId).filter(Objects::nonNull).distinct().toList();
        if (preferenceIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, RoomPreference> result = roomService.findPreferencesByIds(preferenceIds);
        return result != null ? result : Map.of();
    }

    private DesignJobSummaryResponse toSummaryResponse(DesignJob job, Map<UUID, Room> roomsById, Map<UUID, RoomPreference> prefsById) {
        Room room = roomsById != null ? roomsById.get(job.getRoomId()) : null;
        RoomPreference preference = (prefsById != null && job.getPreferenceId() != null) ? prefsById.get(job.getPreferenceId()) : null;
        return new DesignJobSummaryResponse(
                job.getId(), job.getRoomId(), job.getOwnerId(),
                Optional.ofNullable(room).map(Room::getRoomType).orElse(null),
                job.getStatus(), job.getCreatedAt(), job.getUpdatedAt(), job.isFavorite(),
                job.getCustomName(), buildSuggestedName(room, preference), job.getDeletedAt(), job.getNote());
    }

    /**
     * TASK-106: tên hiển thị tự sinh THUẦN CÔNG THỨC (KHÔNG gọi LLM, không bịa dữ liệu) — chỉ ghép
     * các field THẬT đã có: roomType (Room) · style (RoomPreference) · kích thước (Room). Field nào
     * thiếu thì bỏ qua (không thay bằng giá trị giả).
     */
    private String buildSuggestedName(Room room, RoomPreference preference) {
        List<String> parts = new ArrayList<>();
        if (room != null && room.getRoomType() != null && !room.getRoomType().isBlank()) {
            parts.add(room.getRoomType());
        }
        if (preference != null && preference.getStyle() != null && !preference.getStyle().isBlank()) {
            parts.add(preference.getStyle());
        }
        if (room != null && room.getWidthMeters() != null && room.getLengthMeters() != null) {
            parts.add(formatMeters(room.getWidthMeters()) + "×" + formatMeters(room.getLengthMeters()) + "m");
        }
        return parts.isEmpty() ? "Thiết kế chưa đặt tên" : String.join(" · ", parts);
    }

    /** 3.0m -> "3", 3.5m -> "3.5" — tránh hiện ".0" thừa cho kích thước tròn số (thường gặp nhất). */
    private String formatMeters(Double value) {
        if (value == Math.floor(value) && !value.isInfinite()) {
            return String.valueOf(value.intValue());
        }
        return String.valueOf(value);
    }

    /**
     * TASK-100: "Recently Edited / Continue Designing" trên Dashboard — tối đa 5 job PROCESSING/
     * COMPLETED gần đây nhất theo updatedAt THẬT (không phải createdAt như listJobs ở trên, vì mục
     * đích là "quay lại đúng thiết kế đang làm gần nhất" chứ không phải "mới tạo gần nhất").
     * Tái dùng DesignJobSummaryResponse có sẵn (đã thêm updatedAt) thay vì tạo DTO/package mới.
     */
    public List<DesignJobSummaryResponse> listRecentJobs(UUID ownerId) {
        List<DesignJob> jobs = jobRepository.findRecentByOwnerIdAndStatusIn(
                ownerId, RECENT_EDITED_STATUSES, PageRequest.of(0, RECENT_EDITED_LIMIT));

        Map<UUID, Room> roomsById = roomService.findByIds(jobs.stream().map(DesignJob::getRoomId).distinct().toList());
        Map<UUID, RoomPreference> prefsById = fetchPreferences(jobs);

        return jobs.stream()
                .map(job -> toSummaryResponse(job, roomsById, prefsById))
                .toList();
    }

    /**
     * TASK-087: dữ liệu gọn cho export cá nhân (GET /api/v1/users/me/export) — không kèm furniture/
     * color palette (khác buildJobResponse), chỉ status/createdAt/style/estimatedCost theo đúng
     * scope nhỏ của yêu cầu gốc.
     */
    public List<DesignJobExportResponse> listForExport(UUID ownerId) {
        return jobRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(job -> {
                    String style = job.getPreferenceId() != null
                            ? roomService.findPreferenceById(job.getPreferenceId()).map(p -> p.getStyle()).orElse(null)
                            : null;
                    Long estimatedCost = "COMPLETED".equals(job.getStatus())
                            ? resultRepository.findByJobId(job.getId()).map(DesignResult::getEstimatedCost).orElse(null)
                            : null;
                    return new DesignJobExportResponse(job.getId(), job.getRoomId(), job.getStatus(),
                            job.getCreatedAt(), style, estimatedCost);
                })
                .toList();
    }

    /**
     * TASK-111: id job nào trong danh sách truyền vào KHÔNG tồn tại trong bảng design_jobs — dùng
     * bởi module `sharing` (ShareService.findOrphanShareIds) để tìm design_share mồ côi, theo đúng
     * hướng phụ thuộc 1 chiều sharing -> aidesign đã có sẵn (ShareService đã inject DesignService) —
     * aidesign KHÔNG gọi ngược lại sharing, không vi phạm ranh giới module. KHÔNG lọc deletedAt: xoá
     * mềm/PURGED vẫn còn row design_jobs thật (xem permanentlyDeleteJob), không phải orphan thật.
     */
    public Set<UUID> findMissingJobIds(Collection<UUID> jobIds) {
        if (jobIds.isEmpty()) {
            return Set.of();
        }
        Set<UUID> existing = jobRepository.findAllById(jobIds).stream().map(DesignJob::getId).collect(Collectors.toSet());
        Set<UUID> missing = new HashSet<>(jobIds);
        missing.removeAll(existing);
        return missing;
    }

    /**
     * TASK-111 — Admin Data Integrity Checker (Kiểm tra 1): id design_jobs có room_id không tồn tại
     * trong bảng rooms. aidesign sở hữu design_jobs nên tự lấy toàn bộ roomId cần kiểm tra rồi nhờ
     * RoomService (sở hữu bảng rooms) trả về id nào KHÔNG tồn tại — không JOIN xuyên module, không
     * vi phạm ranh giới module (rules/architecture/service-boundaries.md). KHÔNG lọc deletedAt —
     * admin phải thấy cả job đã xoá mềm (cùng convention TASK-104/107).
     */
    public List<UUID> findOrphanJobRoomRefIds() {
        List<DesignJob> jobs = jobRepository.findAll();
        Set<UUID> roomIds = jobs.stream().map(DesignJob::getRoomId).collect(Collectors.toSet());
        Set<UUID> missingRoomIds = roomService.findMissingRoomIds(roomIds);
        if (missingRoomIds.isEmpty()) {
            return List.of();
        }
        return jobs.stream().filter(j -> missingRoomIds.contains(j.getRoomId())).map(DesignJob::getId).toList();
    }

    /** TASK-111 — Admin Data Integrity Checker (Kiểm tra 2): id design_jobs có preference_id KHÁC
     *  NULL nhưng không tồn tại trong bảng room_preferences. Cùng pattern/lý do với
     *  findOrphanJobRoomRefIds ở trên. */
    public List<UUID> findOrphanJobPreferenceRefIds() {
        List<DesignJob> jobs = jobRepository.findAll();
        Set<UUID> preferenceIds = jobs.stream().map(DesignJob::getPreferenceId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> missingPreferenceIds = roomService.findMissingPreferenceIds(preferenceIds);
        if (missingPreferenceIds.isEmpty()) {
            return List.of();
        }
        return jobs.stream()
                .filter(j -> j.getPreferenceId() != null && missingPreferenceIds.contains(j.getPreferenceId()))
                .map(DesignJob::getId)
                .toList();
    }

    /**
     * TASK-111 — Admin Data Integrity Checker (Kiểm tra 3): id design_results có job_id không tồn
     * tại trong design_jobs. Cả 2 bảng đều thuộc aidesign nên tính hoàn toàn nội bộ, không cần gọi
     * module khác.
     */
    public List<UUID> findOrphanResultIds() {
        Set<UUID> jobIds = jobRepository.findAll().stream().map(DesignJob::getId).collect(Collectors.toSet());
        return resultRepository.findAll().stream()
                .filter(r -> !jobIds.contains(r.getJobId()))
                .map(DesignResult::getId)
                .toList();
    }

    /**
     * TASK-111 — Admin Data Integrity Checker (Kiểm tra 4): id design_furniture_items có result_id
     * không tồn tại trong design_results. Cả 2 bảng đều thuộc aidesign nên tính hoàn toàn nội bộ.
     */
    public List<UUID> findOrphanFurnitureItemIds() {
        Set<UUID> resultIds = resultRepository.findAll().stream().map(DesignResult::getId).collect(Collectors.toSet());
        return furnitureItemRepository.findAll().stream()
                .filter(f -> !resultIds.contains(f.getResultId()))
                .map(DesignFurnitureItem::getId)
                .toList();
    }
}
