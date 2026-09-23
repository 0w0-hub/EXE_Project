package com.homely.api.room.dto;

import com.homely.api.room.RoomPreference;

import java.util.UUID;

public record PreferenceResponse(UUID id, UUID roomId, String style, String preferredColors,
                                  String desiredFurniture, Long budget, String freeTextRequest) {

    public static PreferenceResponse from(RoomPreference p) {
        return new PreferenceResponse(p.getId(), p.getRoomId(), p.getStyle(), p.getPreferredColors(),
                p.getDesiredFurniture(), p.getBudget(), p.getFreeTextRequest());
    }
}
