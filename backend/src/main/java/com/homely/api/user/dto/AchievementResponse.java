package com.homely.api.user.dto;

/**
 * TASK-091: 1 huy hiệu thành tựu — danh sách huy hiệu cố định trong code (KHÔNG có bảng DB riêng).
 * `achieved` được TÍNH LẠI mỗi lần gọi API từ dữ liệu thật (room/design job/share), xem
 * tasks/active/TASK-091-achievements.md mục "QUAN TRỌNG — không bịa dữ liệu/nghiệp vụ mới".
 * `achievedRequirement` mô tả điều kiện cần đạt, hiển thị ở FE khi huy hiệu chưa đạt.
 */
public record AchievementResponse(String code, String name, String description, boolean achieved,
                                   String achievedRequirement) {
}
