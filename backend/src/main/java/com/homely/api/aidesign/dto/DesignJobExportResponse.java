package com.homely.api.aidesign.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * TASK-087: bản ghi gọn cho export dữ liệu cá nhân (GET /api/v1/users/me/export) — không kèm
 * chi tiết furniture/color palette để giữ scope nhỏ như đề xuất gốc, xem
 * tasks/active/TASK-087-personal-data-export.md.
 */
public record DesignJobExportResponse(
        UUID jobId,
        UUID roomId,
        String status,
        Instant createdAt,
        String style,
        Long estimatedCost
) {
}
