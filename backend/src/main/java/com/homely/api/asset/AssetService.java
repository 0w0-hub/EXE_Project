package com.homely.api.asset;

import com.homely.api.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Lưu file trên local disk/volume — xem docs/services/asset-service.md.
 * Có thể thay bằng object storage (S3-compatible) sau này qua interface này.
 */
@Service
public class AssetService {

    private final AssetRepository assetRepository;
    private final Path uploadDir;

    public AssetService(AssetRepository assetRepository, @Value("${homely.storage.upload-dir}") String uploadDir) {
        this.assetRepository = assetRepository;
        this.uploadDir = Paths.get(uploadDir);
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public Asset store(UUID ownerId, MultipartFile file, String assetType) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "File rỗng");
        }
        String extension = getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + extension;
        Path target = uploadDir.resolve(storedName);
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORE_FAILED", "Không lưu được file");
        }

        Asset asset = new Asset();
        asset.setOwnerId(ownerId);
        asset.setFileName(file.getOriginalFilename());
        asset.setContentType(file.getContentType());
        asset.setStoragePath(storedName);
        asset.setAssetType(assetType);
        return assetRepository.save(asset);
    }

    /**
     * Lưu ảnh sinh ra bởi AI provider (bytes trong bộ nhớ, không phải file upload từ HTTP request)
     * — dùng bởi ReplicateAiDesignProvider để lưu ảnh 3D/2D visualization vừa generate xong.
     */
    public Asset storeGenerated(UUID ownerId, byte[] content, String fileName, String contentType, String assetType) {
        if (content == null || content.length == 0) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EMPTY_GENERATED_FILE", "AI provider trả về file rỗng");
        }
        String extension = getExtension(fileName);
        String storedName = UUID.randomUUID() + extension;
        Path target = uploadDir.resolve(storedName);
        try {
            Files.write(target, content);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORE_FAILED", "Không lưu được file sinh ra");
        }

        Asset asset = new Asset();
        asset.setOwnerId(ownerId);
        asset.setFileName(fileName);
        asset.setContentType(contentType);
        asset.setStoragePath(storedName);
        asset.setAssetType(assetType);
        return assetRepository.save(asset);
    }

    /** Đọc raw bytes của 1 asset đã lưu — dùng để gửi ảnh phòng gốc cho AI provider phân tích. */
    public byte[] readBytes(Asset asset) {
        try {
            return Files.readAllBytes(resolvePath(asset));
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_READ_FAILED", "Không đọc được file ảnh phòng");
        }
    }

    public Asset get(UUID id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ASSET_NOT_FOUND", "Asset not found"));
    }

    public Path resolvePath(Asset asset) {
        return uploadDir.resolve(asset.getStoragePath());
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}
