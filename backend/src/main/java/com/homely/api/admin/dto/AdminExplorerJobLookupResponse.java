package com.homely.api.admin.dto;

import com.homely.api.room.dto.RoomResponse;

import java.util.UUID;

/**
 * TASK-104: kết quả GET /api/v1/admin/explorer/job?jobId=... — tra ngược "job này của ai": job +
 * room liên kết + id/email chủ sở hữu.
 */
public record AdminExplorerJobLookupResponse(AdminExplorerJobItemResponse job, RoomResponse room,
                                              UUID ownerId, String ownerEmail) {
}
