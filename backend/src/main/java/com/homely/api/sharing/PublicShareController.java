package com.homely.api.sharing;

import com.homely.api.asset.Asset;
import com.homely.api.asset.AssetService;
import com.homely.api.common.ApiResponse;
import com.homely.api.sharing.dto.AddCommentRequest;
import com.homely.api.sharing.dto.CommentResponse;
import com.homely.api.sharing.dto.PublicShareResponse;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoint PUBLIC — không yêu cầu đăng nhập (TASK-078, xem SecurityConfig.permitAll cho pattern
 * "/api/v1/public/**"). Không trả userId/email — xem PublicShareResponse.
 */
@RestController
@RequestMapping("/api/v1/public/shares")
public class PublicShareController {

    private final ShareService shareService;
    private final AssetService assetService;

    public PublicShareController(ShareService shareService, AssetService assetService) {
        this.shareService = shareService;
        this.assetService = assetService;
    }

    @GetMapping("/{shareToken}")
    public ApiResponse<PublicShareResponse> get(@PathVariable UUID shareToken) {
        return ApiResponse.success(shareService.getPublicShare(shareToken));
    }

    @GetMapping("/{shareToken}/asset")
    public ResponseEntity<FileSystemResource> asset(@PathVariable UUID shareToken) {
        Asset asset = shareService.getPublicResultAsset(shareToken);
        FileSystemResource resource = new FileSystemResource(assetService.resolvePath(asset));
        MediaType mediaType = asset.getContentType() != null
                ? MediaType.parseMediaType(asset.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }

    @GetMapping("/{shareToken}/comments")
    public ApiResponse<List<CommentResponse>> comments(@PathVariable UUID shareToken) {
        return ApiResponse.success(shareService.listComments(shareToken));
    }

    @PostMapping("/{shareToken}/comments")
    public ApiResponse<CommentResponse> addComment(@PathVariable UUID shareToken,
                                                     @Valid @RequestBody AddCommentRequest request) {
        return ApiResponse.success(shareService.addComment(shareToken, request));
    }
}
