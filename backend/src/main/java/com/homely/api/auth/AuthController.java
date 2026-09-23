package com.homely.api.auth;

import com.homely.api.auth.dto.AuthResponse;
import com.homely.api.auth.dto.ChangePasswordRequest;
import com.homely.api.auth.dto.LoginRequest;
import com.homely.api.auth.dto.RegisterRequest;
import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    // TASK-083: đổi mật khẩu — yêu cầu đăng nhập, xem SecurityConfig cho rule authenticated() riêng của endpoint này.
    @PatchMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(CurrentUser.id(), request);
        return ApiResponse.success(null);
    }
}
