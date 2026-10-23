package com.homely.api.aidesign.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Bản tóm tắt cho danh sách (Projects/History, Admin) — nhẹ hơn DesignJobResponse đầy đủ
 * (dùng cho trang chi tiết). ownerId có mặt để trang admin (xem tất cả user) hiển thị được
 * mà không cần join thêm — trang lịch sử của chính user thì bỏ qua field này.
 */
public record DesignJobSummaryResponse(
        UUID jobId,
        UUID roomId,
        UUID ownerId,
        String roomType,
        String status,
        Instant createdAt,
        // TASK-100: cần cho "Recently Edited / Continue Designing" trên Dashboard — sắp xếp/hiển thị
        // thời gian tương đối phải tính từ updatedAt THẬT (không bịa). Field thêm ở cuối nên không
        // ảnh hưởng các nơi gọi hiện có (Projects/Admin) — JSON object, không phải positional array.
        Instant updatedAt,
        // TASK-103: đánh dấu thiết kế yêu thích — field thêm ở CUỐI cùng lý do như updatedAt ở trên.
        boolean isFavorite,
        // TASK-106: tên riêng user đã đặt (null nếu chưa đặt) — field thêm ở CUỐI cùng lý do như
        // updatedAt/isFavorite ở trên (JSON object, không phá vỡ các nơi gọi hiện có).
        String customName,
        // TASK-106: tên tự sinh THUẦN CÔNG THỨC từ roomType/style/kích thước phòng THẬT (không gọi
        // LLM, không bịa) — dùng làm tên hiển thị mặc định khi customName null (xem
        // DesignService.buildSuggestedName).
        String suggestedName,
        // TASK-107: null nếu job chưa bị xoá mềm; có giá trị = thời điểm xoá mềm — dùng ở trang
        // Trash.jsx để hiển thị "Đã xoá lúc...". Field thêm ở CUỐI cùng lý do như các field trên.
        java.time.Instant deletedAt,
        // TASK-123: ghi chú nhanh (Quick Notes) user tự nhập (null nếu chưa ghi chú) — field thêm ở
        // CUỐI cùng lý do như các field trên.
        String note
) {
}
