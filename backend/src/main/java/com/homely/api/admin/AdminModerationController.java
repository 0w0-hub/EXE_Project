package com.homely.api.admin;

import com.homely.api.common.ApiResponse;
import com.homely.api.sharing.ShareService;
import com.homely.api.sharing.dto.AdminShareResponse;
import com.homely.api.sharing.dto.ModerateShareRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * TASK-097: hàng đợi kiểm duyệt hậu kiểm cho design_share (Admin Content Moderation Queue) — tách
 * controller riêng vì path khác `/admin/dashboard` (giống cách AdminSystemHealthController TASK-094
 * đã tách theo path/resource — folding endpoint khác path vào 1 controller class không hoạt động
 * trong Spring, xem comment AdminSystemHealthController). Gọi thẳng ShareService (module sharing)
 * thay vì qua AdminService — cùng pattern AdminDesignController gọi thẳng DesignService.
 */
@RestController
@RequestMapping("/api/v1/admin/shares")
public class AdminModerationController {

    private final ShareService shareService;

    public AdminModerationController(ShareService shareService) {
        this.shareService = shareService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<AdminShareResponse>> list(@RequestParam(required = false) String status) {
        return ApiResponse.success(shareService.listSharesForAdmin(status));
    }

    @PatchMapping("/{shareId}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminShareResponse> moderate(@PathVariable UUID shareId,
                                                      @Valid @RequestBody ModerateShareRequest request) {
        return ApiResponse.success(shareService.moderate(shareId, request.status()));
    }
}
