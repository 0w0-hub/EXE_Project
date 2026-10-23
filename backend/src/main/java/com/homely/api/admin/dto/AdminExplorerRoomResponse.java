package com.homely.api.admin.dto;

import com.homely.api.room.dto.RoomResponse;

import java.util.List;

/**
 * TASK-104: room của user tra cứu + tối đa 20 job đầu tiên (Out of scope: không phân trang đầy đủ)
 * kèm tổng số job THẬT để FE hiển thị "và N job khác" khi bị cắt bớt.
 */
public record AdminExplorerRoomResponse(RoomResponse room, List<AdminExplorerJobItemResponse> jobs,
                                         long totalJobCount) {
}
