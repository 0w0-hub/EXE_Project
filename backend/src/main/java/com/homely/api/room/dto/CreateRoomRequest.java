package com.homely.api.room.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public record CreateRoomRequest(
        @NotBlank(message = "Loại phòng không được để trống") String roomType,
        // Không bắt buộc (room có thể tạo trước, đo sau) nhưng nếu có giá trị thì phải hợp lý —
        // giới hạn cùng khoảng với UpdateRoomRequest (TASK-007) để nhất quán khi kéo-resize sau này.
        @DecimalMin(value = "1.0", message = "Chiều rộng tối thiểu 1m") @DecimalMax(value = "20.0", message = "Chiều rộng tối đa 20m") Double widthMeters,
        @DecimalMin(value = "1.0", message = "Chiều dài tối thiểu 1m") @DecimalMax(value = "20.0", message = "Chiều dài tối đa 20m") Double lengthMeters
) {
}
