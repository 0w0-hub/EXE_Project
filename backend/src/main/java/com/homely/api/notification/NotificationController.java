package com.homely.api.notification;

import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.notification.dto.NotificationResponse;
import com.homely.api.notification.dto.UnreadCountResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * TASK-082: danh sách/đánh dấu đã đọc thông báo của chính user đang đăng nhập — yêu cầu auth
 * (không cần whitelist riêng ở SecurityConfig, khớp mặc định `.anyRequest().authenticated()`).
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<NotificationResponse>> list() {
        return ApiResponse.success(notificationService.listMine(CurrentUser.id()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> unreadCount() {
        return ApiResponse.success(notificationService.unreadCount(CurrentUser.id()));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable UUID id) {
        return ApiResponse.success(notificationService.markRead(CurrentUser.id(), id));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead() {
        notificationService.markAllRead(CurrentUser.id());
        return ApiResponse.success(null);
    }
}
