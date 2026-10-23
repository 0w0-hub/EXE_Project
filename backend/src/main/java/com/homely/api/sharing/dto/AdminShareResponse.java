package com.homely.api.sharing.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * TASK-097: 1 dòng trong hàng đợi kiểm duyệt admin — khác {@link PublicShareResponse} (dữ liệu
 * public) và {@link ShareResponse} (owner bật/tắt), DTO này CHỈ dùng cho admin nên có thể lộ
 * shareId/jobId nội bộ thoải mái.
 */
public record AdminShareResponse(
        UUID shareId,
        UUID jobId,
        String roomType,
        UUID shareToken,
        boolean enabled,
        String moderationStatus,
        Instant createdAt,
        long commentCount
) {
}
