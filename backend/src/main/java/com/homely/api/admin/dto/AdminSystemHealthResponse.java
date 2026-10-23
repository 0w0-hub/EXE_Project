package com.homely.api.admin.dto;

import java.time.Instant;

/** TASK-094: chỉ dữ liệu thật đo được ngay lúc gọi — không cache, không bịa số liệu. */
public record AdminSystemHealthResponse(String databaseStatus, long pendingJobsCount, long failedJobsLast24h,
                                         long stuckJobsCount, Instant checkedAt) {
}
