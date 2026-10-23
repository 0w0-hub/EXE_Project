package com.homely.api.room.dto;

/**
 * Input sở thích/yêu cầu người dùng — xem docs/project/requirements.md (mục Input/Output).
 */
public record SavePreferenceRequest(
        String style,
        String preferredColors,
        String desiredFurniture,
        Long budget,
        String freeTextRequest
) {
}
