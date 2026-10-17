package com.homely.api.model.dto;

import java.util.Map;

public record BatchImportModelItemRequest(
        String code,
        String name,
        String category,
        String modelType,
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
