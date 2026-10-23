package com.homely.api.aidesign.provider;

import java.util.UUID;

/**
 * Input đầy đủ đưa vào AI provider — tổng hợp từ Room + RoomPreference.
 * Xem docs/project/requirements.md (mục Input).
 */
public record DesignGenerationInput(
        UUID ownerId,
        String roomType,
        Double widthMeters,
        Double lengthMeters,
        UUID roomPhotoAssetId,
        String style,
        String preferredColors,
        String desiredFurniture,
        Long budget,
        String freeTextRequest
) {
}
