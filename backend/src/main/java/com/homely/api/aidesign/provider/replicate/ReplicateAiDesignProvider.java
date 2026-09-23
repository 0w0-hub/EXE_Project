package com.homely.api.aidesign.provider.replicate;

import com.homely.api.aidesign.provider.AiDesignProvider;
import com.homely.api.aidesign.provider.DesignGenerationInput;
import com.homely.api.aidesign.provider.DesignGenerationOutput;
import com.homely.api.asset.Asset;
import com.homely.api.asset.AssetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Provider AI thật, dùng Replicate (https://replicate.com) — xem
 * docs/decisions/ADR-0003-ai-integration-approach.md (ACCEPTED) và
 * rules/ai/model-integration.md.
 *
 * Phạm vi AI thật (đúng những gì đã verify hoạt động ở dự án tham khảo dizaine_deploy):
 * - Phân tích ảnh phòng (vision) bằng model LLaVA-13b — đọc thật nội dung ảnh người dùng upload.
 * - Sinh ảnh visualization bằng model SDXL (text-to-image) — prompt được xây dựng từ kết quả
 *   phân tích ảnh thật + sở thích người dùng, không phải template cố định.
 *
 * Phần KHÔNG dùng LLM (có chủ đích, xem ADR-0003): danh sách nội thất + chi phí + bố trí vẫn là
 * thuật toán xác định (deterministic) — tránh để AI "bịa" số tiền/layout không nhất quán. Đây là
 * lựa chọn kỹ thuật, không phải hạn chế che giấu.
 */
@Component
@ConditionalOnProperty(name = "homely.ai.provider", havingValue = "replicate")
public class ReplicateAiDesignProvider implements AiDesignProvider {

    private static final Logger log = LoggerFactory.getLogger(ReplicateAiDesignProvider.class);

    // Model version đã verify hoạt động thật ở dự án tham khảo (dizaine_deploy) — public model id,
    // không phải secret. Xem rules/ai/model-integration.md.
    private static final String LLAVA_VISION_VERSION = "b5f6212d032508382d61ff00469ddda3e32fd8a0e75dc39d8a4191bb742157fb";
    private static final String SDXL_IMAGE_VERSION = "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc";

    // Model ControlNet giữ bố cục phòng thật khi redesign (ADR-0005) — gọi theo tên model (không có
    // version hash đã verify), field input "image"/"prompt" là BEST-EFFORT, CHƯA VERIFY với API thật
    // (không lấy được OpenAPI schema xác thực — xem ADR-0005 Consequences). Phải test lại khi có
    // REPLICATE_API_KEY thật, trước khi coi là hoạt động đúng.
    private static final String INTERIOR_REDESIGN_OWNER = "rocketdigitalai";
    private static final String INTERIOR_REDESIGN_MODEL = "interior-design-sdxl";

    // Model image-to-3D cho mesh nội thất "hero" (ADR-0005) — cùng lý do gọi theo tên model, field
    // input "images" là BEST-EFFORT, CHƯA VERIFY. Chỉ áp dụng 1 món (category "seating") để tránh
    // job kéo dài (mỗi call Replicate tới ~90s, thêm 2 call tuần tự cho bước này).
    private static final String MESH_OWNER = "firtoz";
    private static final String MESH_MODEL = "trellis";
    private static final String HERO_CATEGORY = "seating";

    private final AssetService assetService;
    private final ReplicateClient client;

    public ReplicateAiDesignProvider(AssetService assetService,
                                      @Value("${homely.ai.replicate.api-key:}") String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            // Fail fast lúc khởi động — không âm thầm rơi về hành vi khác khi user đã chọn provider
            // thật, xem rules/backend/error-handling.md.
            throw new IllegalStateException(
                    "homely.ai.provider=replicate nhưng REPLICATE_API_KEY chưa được cấu hình. " +
                            "Thêm REPLICATE_API_KEY vào .env hoặc đổi AI_PROVIDER=mock.");
        }
        this.assetService = assetService;
        this.client = new ReplicateClient(apiKey);
    }

    @Override
    public DesignGenerationOutput generate(DesignGenerationInput input) {
        byte[] roomPhotoBytes = null;
        String roomPhotoMimeType = null;
        String roomAnalysis = null;
        if (input.roomPhotoAssetId() != null) {
            Asset photoAsset = assetService.get(input.roomPhotoAssetId());
            roomPhotoBytes = assetService.readBytes(photoAsset);
            roomPhotoMimeType = photoAsset.getContentType() != null ? photoAsset.getContentType() : "image/png";
            roomAnalysis = analyzeRoomPhoto(roomPhotoBytes, roomPhotoMimeType);
        }

        long budget = input.budget() != null ? input.budget() : 30_000_000L;
        String style = blankToDefault(input.style(), "Hiện đại tối giản");

        List<DesignGenerationOutput.FurnitureItem> furniture = attachHeroMesh(buildFurniturePlan(budget), input.ownerId(), style);
        long totalCost = furniture.stream().mapToLong(DesignGenerationOutput.FurnitureItem::estimatedCost).sum();
        List<DesignGenerationOutput.ColorSwatch> colors = buildColorPalette(input.preferredColors());

        String imagePrompt = buildImagePrompt(input, style, roomAnalysis);
        // Có ảnh gốc → dùng ControlNet giữ đúng bố cục phòng thật (redesign); không có ảnh → fallback
        // text-to-image thuần như trước (ControlNet cần ảnh input, không áp dụng được).
        byte[] imageBytes = roomPhotoBytes != null
                ? redesignImage(roomPhotoBytes, roomPhotoMimeType, imagePrompt)
                : generateImage(imagePrompt);
        Asset resultAsset = assetService.storeGenerated(
                input.ownerId(), imageBytes, "design-" + UUID.randomUUID() + ".png", "image/png", "DESIGN_RESULT");

        String decorDescription = "Phương án decor phong cách \"%s\" cho %s, tối ưu trong ngân sách khoảng %,d VNĐ."
                .formatted(style, blankToDefault(input.roomType(), "phòng"), budget);

        String layoutDescription = "Bố trí nội thất bám theo tường dài để mở không gian di chuyển trung tâm; "
                + "khu vực chức năng chính đặt đối diện lối vào theo hướng ánh sáng tự nhiên từ ảnh gốc.";

        String aiExplanationTemplate = "Đề xuất dựa trên: loại phòng \"%s\", phong cách \"%s\", màu sắc mong muốn \"%s\", "
                + "nội thất mong muốn \"%s\" và ngân sách %,d VNĐ. Yêu cầu thêm của bạn: \"%s\".%s";
        String analysisNote = roomAnalysis != null
                ? " Phân tích ảnh phòng bạn cung cấp (AI vision): " + roomAnalysis
                : "";
        String aiExplanation = aiExplanationTemplate.formatted(
                blankToDefault(input.roomType(), "không xác định"),
                style,
                blankToDefault(input.preferredColors(), "chưa chỉ định"),
                blankToDefault(input.desiredFurniture(), "không có"),
                budget,
                blankToDefault(input.freeTextRequest(), "không có"),
                analysisNote
        );

        return new DesignGenerationOutput(
                decorDescription, layoutDescription, aiExplanation, totalCost,
                furniture, colors, resultAsset.getId()
        );
    }

    /** Gọi LLaVA-13b trên Replicate để phân tích thật nội dung ảnh phòng người dùng upload. */
    private String analyzeRoomPhoto(byte[] photoBytes, String mimeType) {
        String dataUri = toDataUri(photoBytes, mimeType);

        Map<String, Object> input = Map.of(
                "image", dataUri,
                "prompt", "Describe this room in detail: lighting, existing furniture, wall/floor color, "
                        + "and overall condition. Answer in English, under 50 words.",
                "max_tokens", 100,
                "temperature", 0.2
        );

        ReplicatePrediction prediction = client.runAndWait(LLAVA_VISION_VERSION, input);
        return ReplicateClient.extractTextOutput(prediction.output());
    }

    /** Gọi SDXL trên Replicate để sinh ảnh visualization theo phong cách (text-to-image thuần, không có ảnh gốc). */
    private byte[] generateImage(String prompt) {
        Map<String, Object> input = Map.of(
                "prompt", prompt,
                "width", 1024,
                "height", 1024,
                "num_outputs", 1
        );
        ReplicatePrediction prediction = client.runAndWait(SDXL_IMAGE_VERSION, input);
        String imageUrl = ReplicateClient.extractImageUrl(prediction.output());
        return client.downloadBytes(imageUrl);
    }

    /**
     * Gọi model ControlNet (ADR-0005) để "redesign" đúng ảnh phòng gốc — giữ tường/cửa sổ/bố cục
     * thật, chỉ đổi style/nội thất theo prompt, khác với generateImage() (sinh ảnh mới từ đầu).
     * Field input "image"/"prompt" là best-effort — xem comment hằng số INTERIOR_REDESIGN_MODEL.
     */
    private byte[] redesignImage(byte[] roomPhotoBytes, String mimeType, String prompt) {
        String dataUri = toDataUri(roomPhotoBytes, mimeType);
        Map<String, Object> input = Map.of(
                "image", dataUri,
                "prompt", prompt
        );
        ReplicatePrediction prediction = client.runAndWaitByModel(INTERIOR_REDESIGN_OWNER, INTERIOR_REDESIGN_MODEL, input);
        String imageUrl = ReplicateClient.extractImageUrl(prediction.output());
        return client.downloadBytes(imageUrl);
    }

    private String toDataUri(byte[] bytes, String mimeType) {
        return "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    /**
     * Gắn mesh 3D thật cho món nội thất "hero" (category seating) nếu sinh thành công — các món
     * còn lại giữ nguyên (modelAssetId=null, frontend fallback về khối hộp, xem TASK-006).
     */
    private List<DesignGenerationOutput.FurnitureItem> attachHeroMesh(
            List<DesignGenerationOutput.FurnitureItem> furniture, UUID ownerId, String style) {
        List<DesignGenerationOutput.FurnitureItem> result = new ArrayList<>(furniture);
        for (int i = 0; i < result.size(); i++) {
            DesignGenerationOutput.FurnitureItem item = result.get(i);
            if (HERO_CATEGORY.equals(item.category())) {
                UUID modelAssetId = tryGenerateFurnitureMesh(item, ownerId, style);
                if (modelAssetId != null) {
                    result.set(i, new DesignGenerationOutput.FurnitureItem(
                            item.name(), item.category(), item.position(), item.estimatedCost(), modelAssetId));
                }
                break;
            }
        }
        return result;
    }

    /**
     * Sinh mesh 3D (GLB) cho 1 món nội thất qua model image-to-3D (ADR-0005): sinh thumbnail bằng
     * generateImage() có sẵn (không thêm model 2D mới) → đưa thumbnail vào model mesh → lưu asset.
     * Bọc try/catch riêng có chủ đích: đây là bước thử nghiệm trên field input chưa verify, lỗi ở
     * đây KHÔNG được phép làm fail cả job (luồng chính đã ổn định từ ADR-0003).
     */
    private UUID tryGenerateFurnitureMesh(DesignGenerationOutput.FurnitureItem hero, UUID ownerId, String style) {
        try {
            String thumbnailPrompt = "%s, %s style, product photo, plain background, isolated object, studio lighting"
                    .formatted(hero.name(), style);
            byte[] thumbnailBytes = generateImage(thumbnailPrompt);
            String dataUri = toDataUri(thumbnailBytes, "image/png");

            Map<String, Object> input = Map.of("images", List.of(dataUri));
            ReplicatePrediction prediction = client.runAndWaitByModel(MESH_OWNER, MESH_MODEL, input);
            String meshUrl = ReplicateClient.extractFileUrl(prediction.output());
            byte[] meshBytes = client.downloadBytes(meshUrl);

            Asset meshAsset = assetService.storeGenerated(
                    ownerId, meshBytes, "furniture-" + UUID.randomUUID() + ".glb",
                    "model/gltf-binary", "DESIGN_FURNITURE_MODEL");
            return meshAsset.getId();
        } catch (RuntimeException e) {
            log.warn("Sinh mesh 3D cho nội thất '{}' thất bại — fallback về khối hộp (TASK-006): {}",
                    hero.name(), e.getMessage());
            return null;
        }
    }

    private String buildImagePrompt(DesignGenerationInput input, String style, String roomAnalysis) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Interior design visualization of a ")
                .append(blankToDefault(input.roomType(), "room"))
                .append(", ").append(style).append(" style");
        if (input.preferredColors() != null && !input.preferredColors().isBlank()) {
            prompt.append(", color palette: ").append(input.preferredColors());
        }
        if (input.desiredFurniture() != null && !input.desiredFurniture().isBlank()) {
            prompt.append(", featuring: ").append(input.desiredFurniture());
        }
        if (roomAnalysis != null && !roomAnalysis.isBlank()) {
            prompt.append(". Base room characteristics: ").append(roomAnalysis);
        }
        prompt.append(". Photorealistic, high quality interior design photography, natural lighting, no text, no watermark.");
        return prompt.toString();
    }

    // Thuật toán phân bổ ngân sách/màu sắc — cố ý deterministic, xem javadoc class ở trên.
    // Giữ tách biệt (không tái dùng chung với MockAiDesignProvider) để không rủi ro regression
    // hành vi Mock đã có unit test — xem MockAiDesignProviderTest.
    private List<DesignGenerationOutput.FurnitureItem> buildFurniturePlan(long budget) {
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
