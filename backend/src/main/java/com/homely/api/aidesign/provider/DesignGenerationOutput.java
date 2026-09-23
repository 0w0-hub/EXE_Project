package com.homely.api.aidesign.provider;

import java.util.List;
import java.util.UUID;

/**
 * Output đầy đủ trả về từ AI provider — 7 phần theo docs/project/requirements.md (mục Output).
 */
public record DesignGenerationOutput(
        String decorDescription,
        String layoutDescription,
        String aiExplanation,
        long estimatedCost,
        List<FurnitureItem> furniture,
        List<ColorSwatch> colors,
        UUID resultAssetId
) {
    public record FurnitureItem(String name, String category, String position, long estimatedCost, UUID modelAssetId) {
        // Overload tiện cho provider không sinh mesh 3D (Mock) — modelAssetId mặc định null,
        // không cần sửa MockAiDesignProvider khi thêm field này (ADR-0005/TASK-006).
        public FurnitureItem(String name, String category, String position, long estimatedCost) {
            this(name, category, position, estimatedCost, null);
        }
    }

    public record ColorSwatch(String colorHex, String role) {
    }
}
