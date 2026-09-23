package com.homely.api.aidesign;

import com.homely.api.aidesign.dto.DesignJobResponse;
import com.homely.api.aidesign.dto.DesignJobSummaryResponse;
import com.homely.api.aidesign.dto.GenerateDesignRequest;
import com.homely.api.aidesign.dto.RenameDesignJobRequest;
import com.homely.api.aidesign.dto.UpdateNoteRequest;
import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.common.PagedResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * API sinh & theo dõi phương án thiết kế — xem rules/api/rest.md và docs/services/ai-design-service.md.
 */
@RestController
@RequestMapping("/api/v1/designs")
public class DesignController {

    private final DesignService designService;

    public DesignController(DesignService designService) {
        this.designService = designService;
    }

    @PostMapping("/generate")
    public ApiResponse<DesignJobResponse> generate(@Valid @RequestBody GenerateDesignRequest request) {
        DesignJob job = designService.createJob(CurrentUser.id(), request);
        return ApiResponse.success(DesignJobResponse.pending(job));
    }

    @GetMapping("/jobs/{jobId}")
    public ApiResponse<DesignJobResponse> getJob(@PathVariable UUID jobId) {
        return ApiResponse.success(designService.getJobWithResult(CurrentUser.id(), jobId));
    }

    // TASK-093: nhân bản job COMPLETED thành job mới độc lập — không tính vào giới hạn lượt tạo
    // thiết kế theo gói (xem DesignService.duplicateJob, code path riêng không đụng usage limit).
    @PostMapping("/jobs/{jobId}/duplicate")
    public ApiResponse<DesignJobResponse> duplicate(@PathVariable UUID jobId) {
        return ApiResponse.success(designService.duplicateJob(CurrentUser.id(), jobId));
    }

    // TASK-100: "Recently Edited / Continue Designing" trên Dashboard — tối đa 5 job PROCESSING/
    // COMPLETED gần đây nhất theo updatedAt thật, dùng để quay lại nhanh thiết kế đang làm dở.
    @GetMapping("/recent")
    public ApiResponse<List<DesignJobSummaryResponse>> listRecent() {
        return ApiResponse.success(designService.listRecentJobs(CurrentUser.id()));
    }

    // TASK-103: toggle qua lại true/false trạng thái yêu thích của job (đúng pattern route
    // /jobs/{jobId}/... như duplicate) — chỉ chủ sở hữu mới toggle được (xem DesignService.toggleFavorite).
    @PostMapping("/jobs/{jobId}/toggle-favorite")
    public ApiResponse<DesignJobResponse> toggleFavorite(@PathVariable UUID jobId) {
        return ApiResponse.success(designService.toggleFavorite(CurrentUser.id(), jobId));
    }

    // TASK-106: Design Naming Assistant — đặt/đổi tên riêng cho thiết kế. Body customName null/rỗng
    // -> xoá tên riêng, quay về tên tự sinh (suggestedName ở DesignJobSummaryResponse). Cùng pattern
    // kiểm tra chủ sở hữu với toggleFavorite (getOwnedJob).
    @PatchMapping("/jobs/{jobId}/name")
    public ApiResponse<DesignJobResponse> renameJob(@PathVariable UUID jobId, @RequestBody RenameDesignJobRequest request) {
        return ApiResponse.success(designService.setCustomName(CurrentUser.id(), jobId, request.customName()));
    }

    // TASK-123: Ghi chú nhanh (Quick Notes) — đặt/xoá ghi chú tự do gắn theo job. Body note null/rỗng
    // -> xoá ghi chú. Cùng pattern kiểm tra chủ sở hữu với renameJob (getOwnedJob).
    @PatchMapping("/jobs/{jobId}/note")
    public ApiResponse<DesignJobResponse> updateNote(@PathVariable UUID jobId, @RequestBody UpdateNoteRequest request) {
        return ApiResponse.success(designService.setNote(CurrentUser.id(), jobId, request.note()));
    }

    // TASK-107: xoá MỀM — job biến mất khỏi mọi listing thường ngay, khôi phục được từ thùng rác.
    // Chỉ chủ sở hữu (getOwnedJob trong DesignService, đúng pattern toggleFavorite/setCustomName).
    @DeleteMapping("/jobs/{jobId}")
    public ApiResponse<DesignJobResponse> softDelete(@PathVariable UUID jobId) {
        return ApiResponse.success(designService.softDeleteJob(CurrentUser.id(), jobId));
    }

    // TASK-107: khôi phục job từ thùng rác — chưa từng xoá mềm thì bị từ chối (400 JOB_NOT_IN_TRASH).
    @PostMapping("/jobs/{jobId}/restore")
    public ApiResponse<DesignJobResponse> restore(@PathVariable UUID jobId) {
        return ApiResponse.success(designService.restoreJob(CurrentUser.id(), jobId));
    }

    // TASK-107: xoá VĨNH VIỄN — CHỈ cho phép khi job đã ở trong thùng rác (chưa xoá mềm trước ->
    // 400 JOB_NOT_IN_TRASH, tránh xoá nhầm trực tiếp). Không thể hoàn tác — FE phải xác nhận trước
    // khi gọi (xem Trash.jsx).
    @DeleteMapping("/jobs/{jobId}/permanent")
    public ApiResponse<Void> permanentDelete(@PathVariable UUID jobId) {
        designService.permanentlyDeleteJob(CurrentUser.id(), jobId);
        return ApiResponse.success(null);
    }

    // TASK-107: danh sách job đã xoá mềm của user hiện tại (thùng rác), phân trang giống listMine,
    // sắp theo thời điểm xoá mềm giảm dần (xem DesignService.listTrash).
    @GetMapping("/trash")
    public ApiResponse<PagedResponse<DesignJobSummaryResponse>> trash(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success(PagedResponse.of(designService.listTrash(CurrentUser.id(), pageable)));
    }

    @GetMapping
    public ApiResponse<PagedResponse<DesignJobSummaryResponse>> listMine(
            @RequestParam(required = false) String status,
            // TASK-103: filter ĐỘC LẬP, kết hợp AND với status khi có (không thay thế) — mặc định false
            // để giữ nguyên hành vi cũ khi frontend/consumer không truyền tham số này.
            @RequestParam(defaultValue = "false") boolean favoriteOnly,
            // TASK-106: sort ĐỘC LẬP, kết hợp cùng status/favoriteOnly/search (search là client-side ở
            // FE) — giá trị không hợp lệ/rỗng thì dùng mặc định "createdAt_desc" (xem DesignService),
            // KHÔNG lỗi 400 để không phá trải nghiệm khi FE/consumer cũ gửi giá trị lạ.
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.success(PagedResponse.of(designService.listJobs(CurrentUser.id(), status, favoriteOnly, sort, pageable)));
    }
}
