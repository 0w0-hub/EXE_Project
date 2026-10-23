package com.homely.api.insights.dto;

/**
 * TASK-099: thống kê thiết kế cá nhân ở mức TOÀN BỘ tài khoản (khác Achievements TASK-091 là huy
 * hiệu mốc, khác budget breakdown TASK-026 là theo TỪNG thiết kế) — xem
 * tasks/active/TASK-099-design-insights.md mục Scope cho định nghĩa từng field.
 *
 * Mọi field được TÍNH LẠI mỗi lần gọi API từ dữ liệu thật (room/design job COMPLETED không nhân
 * bản/preference/furniture item) — không lưu trạng thái riêng, không bịa số liệu.
 *
 * Khi user chưa có dữ liệu tương ứng: totalDesigns/totalFurnitureItems = 0, mostCommonRoomType/
 * mostCommonStyle/averageBudget = null (KHÔNG lỗi 404/500 — xem Acceptance Criteria).
 */
public record InsightsResponse(
        long totalDesigns,
        String mostCommonRoomType,
        String mostCommonStyle,
        long totalFurnitureItems,
        Double averageBudget
) {
}
