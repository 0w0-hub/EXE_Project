package com.homely.api.aidesign.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GenerateDesignRequest(
        @NotNull(message = "roomId không được để trống") UUID roomId,
        UUID preferenceId
) {
}
