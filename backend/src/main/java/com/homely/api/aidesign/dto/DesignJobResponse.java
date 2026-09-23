package com.homely.api.aidesign.dto;

import com.homely.api.aidesign.DesignJob;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DesignJobResponse(
        UUID jobId,
        UUID roomId,
        UUID preferenceId,
        String status,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt,
        DesignResultResponse result,
        // TASK-103: field thêm ở CUỐI để không phá JSON các nơi đang dùng (JSON object, không phải
        // positional array) — đánh dấu thiết kế yêu thích.
        boolean isFavorite,
        // TASK-106: tên riêng user đã đặt (null nếu chưa đặt, dùng tên tự sinh làm mặc định ở FE/
        // DesignJobSummaryResponse.suggestedName) — field thêm ở CUỐI cùng lý do như isFavorite.
        String customName,
        // TASK-123: ghi chú nhanh (Quick Notes) user tự nhập (null nếu chưa ghi chú) — field thêm ở
        // CUỐI cùng lý do như customName/isFavorite.
        String note
) {
    public static DesignJobResponse pending(DesignJob job) {
        return new DesignJobResponse(job.getId(), job.getRoomId(), job.getPreferenceId(), job.getStatus(),
                job.getErrorMessage(), job.getCreatedAt(), job.getUpdatedAt(), null, job.isFavorite(), job.getCustomName(), job.getNote());
    }

    public static DesignJobResponse withResult(DesignJob job, DesignResultResponse result) {
        return new DesignJobResponse(job.getId(), job.getRoomId(), job.getPreferenceId(), job.getStatus(),
                job.getErrorMessage(), job.getCreatedAt(), job.getUpdatedAt(), result, job.isFavorite(), job.getCustomName(), job.getNote());
    }

    public record DesignResultResponse(
            String decorDescription,
            String layoutDescription,
            String aiExplanation,
            Long estimatedCost,
            UUID resultAssetId,
            List<FurnitureItemResponse> furniture,
            List<ColorResponse> colors
    ) {
    }

    public record FurnitureItemResponse(String name, String category, String position, Long estimatedCost,
                                         UUID modelAssetId) {
    }

    public record ColorResponse(String colorHex, String role) {
    }
}
