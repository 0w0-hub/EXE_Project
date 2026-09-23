package com.homely.api.sharing;

import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.sharing.dto.ShareResponse;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Bật/tắt chia sẻ liên kết xem công khai cho 1 design job — yêu cầu đăng nhập + là chủ sở hữu
 * job (TASK-078). Xem PublicShareController cho các endpoint PUBLIC tương ứng.
 */
@RestController
@RequestMapping("/api/v1/designs/jobs/{jobId}/share")
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    @PostMapping
    public ApiResponse<ShareResponse> enable(@PathVariable UUID jobId) {
        return ApiResponse.success(shareService.enableShare(CurrentUser.id(), jobId));
    }

    @DeleteMapping
    public ApiResponse<ShareResponse> disable(@PathVariable UUID jobId) {
        return ApiResponse.success(shareService.disableShare(CurrentUser.id(), jobId));
    }
}
