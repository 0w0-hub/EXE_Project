package com.homely.api.sharing;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Bình luận công khai gắn với 1 liên kết chia sẻ (design_share) — TASK-078. */
@Entity
@Table(name = "design_comment")
@Getter
@Setter
@NoArgsConstructor
public class DesignComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "share_id", nullable = false)
    private UUID shareId;

    @Column(name = "author_name", length = 100)
    private String authorName;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
