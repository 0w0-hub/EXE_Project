package com.homely.api.auth.dto;

import com.homely.api.user.dto.UserResponse;

public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {
}
