package com.homely.api.user.dto;

import java.time.Instant;

/**
 * TASK-084: 1 sự kiện trong lịch sử hoạt động tài khoản. KHÔNG có bảng audit log riêng — mỗi item
 * được ghép từ dữ liệu thật đã có `createdAt` sẵn (Room/DesignJob/DesignShare), xem
 * tasks/active/TASK-084-activity-history.md phần "QUAN TRỌNG — không bịa dữ liệu".
 */
public record ActivityItemResponse(String type, String description, Instant createdAt) {
}
