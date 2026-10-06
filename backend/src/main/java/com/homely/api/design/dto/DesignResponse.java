package com.homely.api.design.dto;

import com.homely.api.design.Design;

import java.time.Instant;
import java.util.UUID;

public record DesignResponse(
        UUID id,
        UUID userId,
        String name,
        String data,
        Instant createdAt,
        Instant updatedAt
) {
    public static DesignResponse from(Design design) {
        return new DesignResponse(
                design.getId(),
                design.getUserId(),
                design.getName(),
                design.getData(),
                design.getCreatedAt(),
                design.getUpdatedAt()
        );
    }
}
