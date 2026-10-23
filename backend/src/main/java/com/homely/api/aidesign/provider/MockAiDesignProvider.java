package com.homely.api.aidesign.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Provider mặc định khi homely.ai.provider=mock (mặc định, xem application.yml).
 * Sinh phương án thiết kế "giả" nhưng đúng cấu trúc output đầy đủ, để test end-to-end
 * luồng generate mà chưa cần chốt AI provider thật (ADR-0003 vẫn PROPOSED).
 *
 * Placeholder cho ảnh 3D: dùng lại ảnh phòng gốc do người dùng upload (roomPhotoAssetId),
 * vì chưa có model sinh ảnh 3D thật được tích hợp.
 */
@Component
@ConditionalOnProperty(name = "homely.ai.provider", havingValue = "mock", matchIfMissing = true)
public class MockAiDesignProvider implements AiDesignProvider {

    @Override
    public DesignGenerationOutput generate(DesignGenerationInput input) {
        String style = blankToDefault(input.style(), "Hiện đại tối giản");
        long budget = input.budget() != null ? input.budget() : 30_000_000L;

        List<DesignGenerationOutput.FurnitureItem> furniture = buildFurniturePlan(input.roomType(), budget);
        long totalCost = furniture.stream().mapToLong(DesignGenerationOutput.FurnitureItem::estimatedCost).sum();

        List<DesignGenerationOutput.ColorSwatch> colors = buildColorPalette(input.preferredColors());

        String decorDescription = "Phương án decor phong cách \"%s\" cho %s, tối ưu trong ngân sách khoảng %,d VNĐ."
                .formatted(style, blankToDefault(input.roomType(), "phòng"), budget);

        String layoutDescription = "Bố trí nội thất bám theo tường dài để mở không gian di chuyển trung tâm; "
                + "khu vực chức năng chính đặt đối diện lối vào theo hướng ánh sáng tự nhiên từ ảnh gốc.";

        String aiExplanationTemplate = "Đề xuất dựa trên: loại phòng \"%s\", phong cách \"%s\", màu sắc mong muốn \"%s\", "
                + "nội thất mong muốn \"%s\" và ngân sách %,d VNĐ. Yêu cầu thêm của bạn: \"%s\".";
        String aiExplanation = aiExplanationTemplate.formatted(
                blankToDefault(input.roomType(), "không xác định"),
                style,
                blankToDefault(input.preferredColors(), "chưa chỉ định"),
                blankToDefault(input.desiredFurniture(), "không có"),
                budget,
                blankToDefault(input.freeTextRequest(), "không có")
        );

        return new DesignGenerationOutput(
                decorDescription,
                layoutDescription,
                aiExplanation,
                totalCost,
                furniture,
                colors,
                input.roomPhotoAssetId() // placeholder: chưa có ảnh 3D thật, xem docs/decisions/ADR-0003
        );
    }

    private List<DesignGenerationOutput.FurnitureItem> buildFurniturePlan(String roomType, long budget) {
        // Phân bổ ngân sách mock theo tỷ lệ cố định cho 4 nhóm nội thất chính.
        long sofaCost = (long) (budget * 0.35);
        long tableCost = (long) (budget * 0.15);
        long lightingCost = (long) (budget * 0.10);
        long storageCost = (long) (budget * 0.20);

        return List.of(
                new DesignGenerationOutput.FurnitureItem("Sofa/giường chính", "seating", "Sát tường dài đối diện lối vào", sofaCost),
                new DesignGenerationOutput.FurnitureItem("Bàn trung tâm", "table", "Trung tâm phòng, trước khu vực ngồi chính", tableCost),
                new DesignGenerationOutput.FurnitureItem("Đèn sàn/đèn trang trí", "lighting", "Góc phòng, gần cửa sổ", lightingCost),
                new DesignGenerationOutput.FurnitureItem("Kệ/tủ lưu trữ", "storage", "Tường đối diện khu vực ngồi chính", storageCost)
        );
    }

    private List<DesignGenerationOutput.ColorSwatch> buildColorPalette(String preferredColors) {
        if (preferredColors != null && !preferredColors.isBlank()) {
            String first = preferredColors.split(",")[0].trim();
            return List.of(
                    new DesignGenerationOutput.ColorSwatch(toHexPlaceholder(first), "PRIMARY"),
                    new DesignGenerationOutput.ColorSwatch("#F5F1EA", "SECONDARY"),
                    new DesignGenerationOutput.ColorSwatch("#C9A87C", "ACCENT")
            );
        }
        return List.of(
                new DesignGenerationOutput.ColorSwatch("#E8E2D8", "PRIMARY"),
                new DesignGenerationOutput.ColorSwatch("#FFFFFF", "SECONDARY"),
                new DesignGenerationOutput.ColorSwatch("#8C6A4F", "ACCENT")
        );
    }

    /** Mock: map tên màu tiếng Việt phổ biến sang hex; fallback về be trung tính nếu không nhận diện được. */
    private String toHexPlaceholder(String colorName) {
        String normalized = colorName.toLowerCase();
        if (normalized.contains("trắng")) return "#FFFFFF";
        if (normalized.contains("xanh")) return "#5B7B7A";
        if (normalized.contains("vàng")) return "#D9B44A";
        if (normalized.contains("nâu")) return "#8C6A4F";
        if (normalized.contains("xám")) return "#9B9B93";
        if (normalized.contains("đen")) return "#2B2B2B";
        return "#E8E2D8";
    }

    private String blankToDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }
}
