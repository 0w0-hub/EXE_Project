package com.homely.api.admin.dto;

import java.time.Instant;
import java.util.List;

/**
 * TASK-111: kết quả GET /api/v1/admin/integrity/orphans — đúng 5 kiểm tra mồ côi liệt kê trong
 * Scope (xem tasks/active/TASK-111-admin-orphan-checker.md), tính LIVE mỗi lần gọi (không cache,
 * cùng convention AdminSystemHealthResponse TASK-094). `anyOrphansFound` để FE quyết định màu tổng
 * quan (xanh nếu false) mà không phải tự cộng lại từ danh sách con.
 */
public record AdminOrphanCheckResponse(List<AdminOrphanCheckItemResponse> checks, boolean anyOrphansFound,
                                        Instant checkedAt) {
}
