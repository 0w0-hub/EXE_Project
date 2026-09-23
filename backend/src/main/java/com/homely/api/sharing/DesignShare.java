package com.homely.api.sharing;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Liên kết chia sẻ công khai (view-only) cho 1 design job — TASK-078.
 * `shareToken` là khoá tra cứu công khai (KHÔNG dùng thẳng job_id) để không lộ liên hệ trực tiếp
 * tới ID nội bộ khi chia sẻ ra ngoài hệ thống.
 */
@Entity
@Table(name = "design_share")
@Getter
@Setter
@NoArgsConstructor
public class DesignShare {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "share_token", nullable = false, unique = true)
    private UUID shareToken = UUID.randomUUID();

    @Column(nullable = false)
    private boolean enabled = true;

    // TASK-097: hậu kiểm — mặc định APPROVED (chia sẻ hoạt động ngay khi user bật, giữ đúng hành vi
    // TASK-078), admin chỉ có thể đổi thành REJECTED để ẩn khỏi endpoint public sau khi đã công khai.
    @Column(name = "moderation_status", nullable = false, length = 20)
    private String moderationStatus = "APPROVED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
