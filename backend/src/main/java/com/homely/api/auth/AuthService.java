package com.homely.api.auth;

import com.homely.api.auth.dto.AuthResponse;
import com.homely.api.auth.dto.ChangePasswordRequest;
import com.homely.api.auth.dto.LoginRequest;
import com.homely.api.auth.dto.RegisterRequest;
import com.homely.api.billing.BillingService;
import com.homely.api.common.ApiException;
import com.homely.api.user.User;
import com.homely.api.user.UserRepository;
import com.homely.api.user.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BillingService billingService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                        JwtService jwtService, BillingService billingService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.billingService = billingService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email đã được sử dụng");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);
        billingService.assignFreePlanToNewUser(user.getId()); // gán gói FREE mặc định — xem docs/services/billing-service.md
        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return issueTokens(user);
    }

    // TASK-083: đổi mật khẩu — KHÔNG vô hiệu hoá JWT hiện tại (ngoài phạm vi, xem tasks/active/TASK-083-change-password.md).
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CURRENT_PASSWORD_INCORRECT", "Mật khẩu hiện tại không đúng");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getRole());
        return new AuthResponse(accessToken, refreshToken, UserResponse.from(user));
    }
}
