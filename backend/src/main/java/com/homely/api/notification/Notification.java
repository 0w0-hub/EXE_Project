package com.homely.api.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Thông báo trong app cho user — TASK-082. Hiện chỉ phát sinh khi 1 design job của user chuyển
 * COMPLETED/FAILED (xem lý do thu hẹp phạm vi ở tasks/completed hoặc lịch sử TASK-082).
 */
@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(nullable = false, length = 30)
    private String type; // DESIGN_COMPLETED | DESIGN_FAILED

    @Column(nullable = false, length = 255)
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
