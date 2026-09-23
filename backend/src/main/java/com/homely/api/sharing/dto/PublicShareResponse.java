package com.homely.api.sharing.dto;

import com.homely.api.aidesign.dto.DesignJobResponse;

import java.util.UUID;

/**
 * Dữ liệu công khai cho trang xem chia sẻ (TASK-078) — CỐ Ý không có ownerId/email, chỉ đủ để
 * hiển thị (ảnh AI 2D, phong cách/màu sắc/nội thất/chi phí, kích thước phòng).
 */
public record PublicShareResponse(
        UUID jobId,
        String roomType,
        Double widthMeters,
        Double lengthMeters,
        String status,
        DesignJobResponse.DesignResultResponse result
) {
}
