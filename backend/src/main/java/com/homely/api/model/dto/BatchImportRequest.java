package com.homely.api.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BatchImportRequest(
        @NotBlank String collectionId,
        @NotEmpty List<BatchImportModelItemRequest> items
) {}
