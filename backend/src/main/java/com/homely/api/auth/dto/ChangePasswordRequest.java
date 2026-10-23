package com.homely.api.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// TASK-083: đổi mật khẩu — rule tối thiểu newPassword lấy LẠI từ RegisterRequest (không đặt rule khác).
public record ChangePasswordRequest(
        @NotBlank(message = "Mật khẩu hiện tại không được để trống") String currentPassword,
        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 6, message = "Mật khẩu mới tối thiểu 6 ký tự") String newPassword
) {
}
