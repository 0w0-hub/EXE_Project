package com.homely.api.notification;

import com.homely.api.aidesign.DesignJob;
import com.homely.api.common.ApiException;
import com.homely.api.notification.dto.NotificationResponse;
import com.homely.api.notification.dto.UnreadCountResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * TASK-082: notification chỉ phát sinh từ 1 nguồn duy nhất — DesignJobProcessor khi job chuyển
 * COMPLETED/FAILED (server-side, xác định rõ ràng). Package riêng ngoài `aidesign` theo ADR-0002,
 * cùng pattern với module `sharing` (TASK-078).
 */
@Service
public class NotificationService {

    private static final int LIST_LIMIT = 20;

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /** Gọi từ DesignJobProcessor ngay sau khi set status COMPLETED/FAILED — CHỈ đọc dữ liệu đã có
     *  sẵn trên job, không tự suy diễn/bịa thêm thông tin (đúng phạm vi đã thu hẹp ở TASK-082). */
    public void notifyJobStatus(DesignJob job) {
        String status = job.getStatus();
        if (!"COMPLETED".equals(status) && !"FAILED".equals(status)) {
            return;
        }

        Notification notification = new Notification();
        notification.setUserId(job.getOwnerId());
        notification.setJobId(job.getId());
        if ("COMPLETED".equals(status)) {
            notification.setType("DESIGN_COMPLETED");
            notification.setMessage("Thiết kế AI của bạn đã hoàn thành.");
        } else {
            notification.setType("DESIGN_FAILED");
            notification.setMessage("Thiết kế AI của bạn đã xử lý thất bại.");
        }
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> listMine(UUID userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, LIST_LIMIT))
                .map(NotificationResponse::from)
                .toList();
    }

    public UnreadCountResponse unreadCount(UUID userId) {
        return new UnreadCountResponse(notificationRepository.countByUserIdAndReadFalse(userId));
    }

    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        Notification notification = getOwned(userId, notificationId);
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return NotificationResponse.from(notification);
    }

    public void markAllRead(UUID userId) {
        // TASK-082: quy mô hiện tại nhỏ (MVP) — đọc hết theo 1 trang lớn thay vì bulk update query
        // riêng để tái dùng đúng cách check thuộc về user qua repository sẵn có, không viết thêm
        // native query chỉ cho 1 thao tác đơn giản này.
        List<Notification> unread = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 1000))
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private Notification getOwned(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "Thông báo không tồn tại"));
        if (!notification.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOTIFICATION_ACCESS_DENIED", "Bạn không có quyền xem thông báo này");
        }
        return notification;
    }
}
