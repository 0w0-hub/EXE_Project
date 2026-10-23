package com.homely.api.model.dto;

import com.homely.api.model.ModelCollection;

public record ModelCollectionResponse(
        String id,
        String code,
        String name,
        String description,
        String style,
        String defaultTier,
        String thumbnailUrl,
        String authorOrSource,
        String license,
        String status,
        int sortOrder,
        int modelCount
) {
    public static ModelCollectionResponse from(ModelCollection col) {
        return new ModelCollectionResponse(
                col.getId(),
                col.getCode(),
                col.getName(),
                col.getDescription(),
                col.getStyle(),
                col.getDefaultTier(),
                col.getThumbnailUrl(),
                col.getAuthorOrSource(),
                col.getLicense(),
                col.getStatus(),
                col.getSortOrder(),
                col.getModels() != null ? col.getModels().size() : 0
        );
    }
}
