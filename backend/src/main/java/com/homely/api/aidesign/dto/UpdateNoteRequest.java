package com.homely.api.aidesign.dto;

/**
 * TASK-123: body cho PATCH /api/v1/designs/jobs/{jobId}/note — note cho phép null/rỗng để XOÁ ghi
 * chú (xem DesignService.setNote). Không dùng @NotBlank vì null/rỗng là giá trị HỢP LỆ — đúng cách
 * RenameDesignJobRequest (TASK-106) đã làm cho customName.
 */
public record UpdateNoteRequest(String note) {
}
