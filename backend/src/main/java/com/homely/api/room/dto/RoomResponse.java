package com.homely.api.room.dto;

import com.homely.api.room.Room;

import java.time.Instant;
import java.util.UUID;

public record RoomResponse(UUID id, String roomType, Double widthMeters, Double lengthMeters,
                            UUID photoAssetId, Instant createdAt) {

    public static RoomResponse from(Room room) {
        return new RoomResponse(room.getId(), room.getRoomType(), room.getWidthMeters(),
                room.getLengthMeters(), room.getPhotoAssetId(), room.getCreatedAt());
    }
}
