package com.homely.api.model.dto;

import java.util.Map;

public record UpdateFurnitureModelRequest(
        String name,
        String category,
        String modelType,
        String mountType,
        String style,
        String tier,
        String requiredPlan,
        Long price,
        String thumbnailPath,
        Double dimensionX,
        Double dimensionY,
        Double dimensionZ,
        Boolean isSurfaceHost,
        Boolean canPlaceOnSurface,
        String status,
        Integer sortOrder,
        String tags,
        Map<String, Object> metadata
) {}
