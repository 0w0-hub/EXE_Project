package com.homely.api.model.dto;

import java.util.List;

public record BatchImportResultResponse(
        int totalProcessed,
        int totalImported,
        int totalSkipped,
        List<String> importedCodes,
        List<String> skippedCodes
) {}
