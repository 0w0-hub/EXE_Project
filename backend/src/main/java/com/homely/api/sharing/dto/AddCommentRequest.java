package com.homely.api.sharing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddCommentRequest(
        String authorName,
        @NotBlank(message = "Nội dung bình luận không được để trống")
        @Size(max = 500, message = "Nội dung bình luận tối đa 500 ký tự")
        String message
) {
}
