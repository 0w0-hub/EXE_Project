package com.homely.api.template.dto;

import com.homely.api.template.DesignTemplate;

import java.util.UUID;

public record TemplateResponse(
        UUID id,
        String category,
        String roomType,
        String style,
        String preferredColors,
        String desiredFurniture,
        Long suggestedBudget,
        String description
) {
    public static TemplateResponse from(DesignTemplate t) {
        return new TemplateResponse(t.getId(), t.getCategory(), t.getRoomType(), t.getStyle(),
                t.getPreferredColors(), t.getDesiredFurniture(), t.getSuggestedBudget(), t.getDescription());
    }
}
