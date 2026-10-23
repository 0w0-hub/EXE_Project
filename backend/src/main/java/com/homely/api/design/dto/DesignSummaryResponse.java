package com.homely.api.design.dto;

import com.homely.api.design.Design;

import java.time.Instant;
import java.util.UUID;

public record DesignSummaryResponse(
        UUID id,
        String name,
        Instant createdAt,
        Instant updatedAt
) {
    public static DesignSummaryResponse from(Design design) {
        return new DesignSummaryResponse(
                design.getId(),
                design.getName(),
                design.getCreatedAt(),
                design.getUpdatedAt()
        );
    }
}
