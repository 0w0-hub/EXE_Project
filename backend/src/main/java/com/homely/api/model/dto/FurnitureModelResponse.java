package com.homely.api.model.dto;

import com.homely.api.model.FurnitureModel;

import java.util.Map;

public record FurnitureModelResponse(
        String id,
        String code,
        String name,
        String collectionId,
        String collectionName,
        String category,
        String modelType,
        String mountType,
        String style,
        String tier,
        String requiredPlan,
        long price,
        String modelPath,
        String thumbnailPath,
        double dimensionX,
        double dimensionY,
        double dimensionZ,
        boolean isSurfaceHost,
        boolean canPlaceOnSurface,
        Long fileSizeBytes,
        String status,
        int sortOrder,
        String tags,
        Map<String, Object> metadata
) {
    public static FurnitureModelResponse from(FurnitureModel model) {
        return new FurnitureModelResponse(
                model.getId(),
                model.getCode(),
                model.getName(),
                model.getCollectionId(),
                model.getCollection() != null ? model.getCollection().getName() : null,
                model.getCategory(),
                model.getModelType(),
                model.getMountType(),
                model.getStyle(),
                model.getTier(),
                model.getRequiredPlan(),
                model.getPrice(),
                model.getModelPath(),
                model.getThumbnailPath(),
                model.getDimensionX(),
                model.getDimensionY(),
                model.getDimensionZ(),
                model.isSurfaceHost(),
                model.isCanPlaceOnSurface(),
                model.getFileSizeBytes(),
                model.getStatus(),
                model.getSortOrder(),
                model.getTags(),
                model.getMetadata()
        );
    }
}
