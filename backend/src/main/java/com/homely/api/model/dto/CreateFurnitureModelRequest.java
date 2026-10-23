package com.homely.api.model.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record CreateFurnitureModelRequest(
        @NotBlank String code,
        @NotBlank String name,
        @NotBlank String collectionId,
        @NotBlank String category,
        @NotBlank String modelType,
        String mountType,
        String style,
        String tier,
        String requiredPlan,
        Long price,
        String modelPath,
        String thumbnailPath,
        Double dimensionX,
        Double dimensionY,
        Double dimensionZ,
        Boolean isSurfaceHost,
        Boolean canPlaceOnSurface,
        Long fileSizeBytes,
        String tags,
        Map<String, Object> metadata
) {}
