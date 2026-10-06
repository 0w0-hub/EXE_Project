package com.homely.api.design.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record SaveDesignRequest(
        UUID id,
        String name,
        @NotBlank(message = "Scene data is required")
        String data
) {
}
