package com.homely.api.admin.dto;

import java.util.List;
import java.util.UUID;

/**
 * TASK-111: kết quả 1 loại kiểm tra mồ côi (vd "design_jobs.room_id -> rooms.id"). `orphanIds`
 * giới hạn tối đa 50 id đầu tiên (xem AdminService.ORPHAN_ID_LIMIT) — `totalOrphanCount`/`truncated`
 * cho FE hiển thị "và N id khác" khi bị cắt bớt, cùng convention với Admin Data Explorer (TASK-104,
 * giới hạn 20).
 */
public record AdminOrphanCheckItemResponse(String checkName, String table, long totalOrphanCount,
                                            List<UUID> orphanIds, boolean truncated) {
}
