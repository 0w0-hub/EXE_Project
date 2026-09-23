package com.homely.api.admin.dto;

import com.homely.api.aidesign.DesignJob;

import java.time.Instant;
import java.util.UUID;

/**
 * TASK-104: Admin Data Explorer — chỉ field cần cho hiển thị cây User → Room → Job. Kèm
 * `isFavorite` vì field này ĐÃ CÓ THẬT trong DesignJob.java tại thời điểm code (TASK-103 đã merge
 * xong, migration V8__design_job_favorite.sql) — xem Scope trong tasks/active/TASK-104-admin-data-explorer.md.
 */
public record AdminExplorerJobItemResponse(UUID id, String status, Instant createdAt, boolean isFavorite) {

    public static AdminExplorerJobItemResponse from(DesignJob job) {
        return new AdminExplorerJobItemResponse(job.getId(), job.getStatus(), job.getCreatedAt(), job.isFavorite());
    }
}
