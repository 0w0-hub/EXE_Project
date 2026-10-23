package com.homely.api.aidesign.dto;

/**
 * TASK-106: body cho PATCH /api/v1/designs/jobs/{jobId}/name — customName cho phép null/rỗng để
 * XOÁ tên riêng (quay về tên tự sinh, xem DesignService.setCustomName). Không dùng @NotBlank vì
 * null/rỗng là giá trị HỢP LỆ (khác các request khác yêu cầu bắt buộc có giá trị).
 */
public record RenameDesignJobRequest(String customName) {
}
