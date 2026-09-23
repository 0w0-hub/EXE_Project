package com.homely.api.asset;

import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.asset.dto.AssetResponse;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @PostMapping("/upload")
    public ApiResponse<AssetResponse> upload(@RequestParam("file") MultipartFile file,
                                              @RequestParam(value = "type", defaultValue = "ROOM_PHOTO") String type) {
        Asset asset = assetService.store(CurrentUser.id(), file, type);
        return ApiResponse.success(AssetResponse.from(asset));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileSystemResource> download(@PathVariable UUID id) {
        Asset asset = assetService.get(id);
        FileSystemResource resource = new FileSystemResource(assetService.resolvePath(asset));
        MediaType mediaType = asset.getContentType() != null
                ? MediaType.parseMediaType(asset.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }
}
