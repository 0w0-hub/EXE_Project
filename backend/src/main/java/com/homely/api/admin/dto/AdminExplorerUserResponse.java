package com.homely.api.admin.dto;

import com.homely.api.user.dto.UserResponse;

import java.util.List;

/**
 * TASK-104: kết quả GET /api/v1/admin/explorer/user?email=... — user + tối đa 20 room đầu tiên
 * (Out of scope: không phân trang đầy đủ) kèm tổng số room THẬT để FE hiển thị "và N room khác".
 */
public record AdminExplorerUserResponse(UserResponse user, List<AdminExplorerRoomResponse> rooms,
                                         long totalRoomCount) {
}
