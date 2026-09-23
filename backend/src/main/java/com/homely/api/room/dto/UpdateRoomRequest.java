package com.homely.api.room.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/** Đổi kích thước room sau khi đã tạo — dùng cho kéo-resize tường trong Room3DViewer (TASK-007). */
public record UpdateRoomRequest(
        @NotNull(message = "Chiều rộng không được để trống")
        @DecimalMin(value = "1.0", message = "Chiều rộng tối thiểu 1m") @DecimalMax(value = "20.0", message = "Chiều rộng tối đa 20m") Double widthMeters,
        @NotNull(message = "Chiều dài không được để trống")
        @DecimalMin(value = "1.0", message = "Chiều dài tối thiểu 1m") @DecimalMax(value = "20.0", message = "Chiều dài tối đa 20m") Double lengthMeters
) {
}
