package com.homely.api.model;

import com.homely.api.common.ApiException;
import com.homely.api.model.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;

@Service
public class FurnitureModelService {

    private static final Logger log = LoggerFactory.getLogger(FurnitureModelService.class);

    private final FurnitureModelRepository modelRepository;
    private final ModelCollectionRepository collectionRepository;
    private final Path modelsUploadDir;

    public FurnitureModelService(
            FurnitureModelRepository modelRepository,
            ModelCollectionRepository collectionRepository,
            @Value("${homely.storage.upload-dir}") String uploadDir
    ) {
        this.modelRepository = modelRepository;
        this.collectionRepository = collectionRepository;
        this.modelsUploadDir = Paths.get(uploadDir).resolve("models");
        try {
            Files.createDirectories(this.modelsUploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public List<ModelCollectionResponse> getAllCollections() {
        return collectionRepository.findByStatusOrderBySortOrderAsc("ACTIVE").stream()
                .map(ModelCollectionResponse::from)
                .toList();
    }

    public List<FurnitureModelResponse> getModels(String status, String style, String tier, String category, String collectionId, String query) {
        return modelRepository.findWithFilters(status, style, tier, category, collectionId, query).stream()
                .map(FurnitureModelResponse::from)
                .toList();
    }

    public FurnitureModelResponse getModelById(String id) {
        FurnitureModel model = modelRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MODEL_NOT_FOUND", "Không tìm thấy mô hình: " + id));
        return FurnitureModelResponse.from(model);
    }

    @Transactional
    public FurnitureModelResponse createModel(CreateFurnitureModelRequest req) {
        if (modelRepository.findByCode(req.code()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "MODEL_CODE_EXISTS", "Mã mô hình đã tồn tại: " + req.code());
        }

        ModelCollection col = collectionRepository.findById(req.collectionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COLLECTION_NOT_FOUND", "Không tìm thấy bộ sưu tập: " + req.collectionId()));

        FurnitureModel model = new FurnitureModel();
        model.setId(UUID.randomUUID().toString());
        model.setCode(req.code());
        model.setName(req.name());
        model.setCollectionId(col.getId());
        model.setCategory(req.category());
        model.setModelType(req.modelType());
        model.setMountType(req.mountType() != null ? req.mountType() : "floor");
        model.setStyle(req.style() != null ? req.style() : col.getStyle().toLowerCase());
        model.setTier(req.tier() != null ? req.tier() : "free");
        model.setRequiredPlan(req.requiredPlan() != null ? req.requiredPlan() : "FREE");
        model.setPrice(req.price() != null ? req.price() : 0);
        model.setModelPath(req.modelPath());
        model.setThumbnailPath(req.thumbnailPath());
        model.setDimensionX(req.dimensionX() != null ? req.dimensionX() : 1.0);
        model.setDimensionY(req.dimensionY() != null ? req.dimensionY() : 1.0);
        model.setDimensionZ(req.dimensionZ() != null ? req.dimensionZ() : 1.0);
        model.setSurfaceHost(Boolean.TRUE.equals(req.isSurfaceHost()));
        model.setCanPlaceOnSurface(Boolean.TRUE.equals(req.canPlaceOnSurface()));
        model.setFileSizeBytes(req.fileSizeBytes());
        model.setStatus("ACTIVE");
        model.setTags(req.tags());
        model.setMetadata(req.metadata());
        model.setCreatedAt(Instant.now());
        model.setUpdatedAt(Instant.now());

        FurnitureModel saved = modelRepository.save(model);
        return FurnitureModelResponse.from(saved);
    }

    @Transactional
    public FurnitureModelResponse updateModel(String id, UpdateFurnitureModelRequest req) {
        FurnitureModel model = modelRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MODEL_NOT_FOUND", "Không tìm thấy mô hình: " + id));

        if (req.name() != null) model.setName(req.name());
        if (req.category() != null) model.setCategory(req.category());
        if (req.modelType() != null) model.setModelType(req.modelType());
        if (req.mountType() != null) model.setMountType(req.mountType());
        if (req.style() != null) model.setStyle(req.style());
        if (req.tier() != null) model.setTier(req.tier());
        if (req.requiredPlan() != null) model.setRequiredPlan(req.requiredPlan());
        if (req.price() != null) model.setPrice(req.price());
        if (req.thumbnailPath() != null) model.setThumbnailPath(req.thumbnailPath());
        if (req.dimensionX() != null) model.setDimensionX(req.dimensionX());
        if (req.dimensionY() != null) model.setDimensionY(req.dimensionY());
        if (req.dimensionZ() != null) model.setDimensionZ(req.dimensionZ());
        if (req.isSurfaceHost() != null) model.setSurfaceHost(req.isSurfaceHost());
        if (req.canPlaceOnSurface() != null) model.setCanPlaceOnSurface(req.canPlaceOnSurface());
        if (req.status() != null) model.setStatus(req.status());
        if (req.sortOrder() != null) model.setSortOrder(req.sortOrder());
        if (req.tags() != null) model.setTags(req.tags());
        if (req.metadata() != null) model.setMetadata(req.metadata());
        model.setUpdatedAt(Instant.now());

        FurnitureModel saved = modelRepository.save(model);
        return FurnitureModelResponse.from(saved);
    }

    @Transactional
    public void deleteModel(String id) {
        FurnitureModel model = modelRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MODEL_NOT_FOUND", "Không tìm thấy mô hình: " + id));
        // Soft delete bằng cách chuyển status thành ARCHIVED
        model.setStatus("ARCHIVED");
        model.setUpdatedAt(Instant.now());
        modelRepository.save(model);
    }

    @Transactional
    public BatchImportResultResponse batchImport(BatchImportRequest req) {
        ModelCollection col = collectionRepository.findById(req.collectionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COLLECTION_NOT_FOUND", "Không tìm thấy bộ sưu tập: " + req.collectionId()));

        List<String> imported = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (BatchImportModelItemRequest item : req.items()) {
            if (item.code() == null || item.code().trim().isEmpty()) {
                continue;
            }
            String code = item.code().trim();
            if (modelRepository.findByCode(code).isPresent()) {
                skipped.add(code);
                continue;
            }

            FurnitureModel model = new FurnitureModel();
            model.setId(UUID.randomUUID().toString());
            model.setCode(code);
            model.setName(item.name() != null ? item.name() : code);
            model.setCollectionId(col.getId());
            model.setCategory(item.category() != null ? item.category() : "living-room");
            model.setModelType(item.modelType() != null ? item.modelType() : "decor");
            model.setMountType(item.mountType() != null ? item.mountType() : "floor");
            model.setStyle(item.style() != null ? item.style() : col.getStyle().toLowerCase());
            model.setTier(item.tier() != null ? item.tier() : "free");
            model.setRequiredPlan(item.requiredPlan() != null ? item.requiredPlan() : "FREE");
            model.setPrice(item.price() != null ? item.price() : 0);
            model.setModelPath(item.modelPath());
            model.setThumbnailPath(item.thumbnailPath());
            model.setDimensionX(item.dimensionX() != null ? item.dimensionX() : 1.0);
            model.setDimensionY(item.dimensionY() != null ? item.dimensionY() : 1.0);
            model.setDimensionZ(item.dimensionZ() != null ? item.dimensionZ() : 1.0);
            model.setSurfaceHost(Boolean.TRUE.equals(item.isSurfaceHost()));
            model.setCanPlaceOnSurface(Boolean.TRUE.equals(item.canPlaceOnSurface()));
            model.setFileSizeBytes(item.fileSizeBytes());
            model.setStatus("ACTIVE");
            model.setTags(item.tags());
            model.setMetadata(item.metadata());
            model.setCreatedAt(Instant.now());
            model.setUpdatedAt(Instant.now());

            modelRepository.save(model);
            imported.add(code);
        }

        return new BatchImportResultResponse(
                req.items().size(),
                imported.size(),
                skipped.size(),
                imported,
                skipped
        );
    }

    public String storeFile(String subDir, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "File rỗng");
        }
        Path targetDir = modelsUploadDir.resolve(subDir != null ? subDir : "");
        try {
            Files.createDirectories(targetDir);
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.lastIndexOf('.') > 0
                    ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                    : "";
            String storedName = UUID.randomUUID() + extension;
            Path targetPath = targetDir.resolve(storedName);
            file.transferTo(targetPath);
            return "/uploads/models/" + (subDir != null ? subDir + "/" : "") + storedName;
        } catch (IOException e) {
            log.error("Failed to store file: ", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORE_FAILED", "Không thể lưu tệp: " + e.getMessage());
        }
    }
}
