package com.homely.api.template;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Preset phong cách/màu sắc/ngân sách để người dùng áp dụng nhanh vào room mới
 * — xem docs/services/template-service.md.
 */
@Entity
@Table(name = "design_templates")
@Getter
@Setter
@NoArgsConstructor
public class DesignTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "room_type", nullable = false, length = 100)
    private String roomType;

    @Column(length = 255)
    private String style;

    @Column(name = "preferred_colors", length = 255)
    private String preferredColors;

    @Column(name = "desired_furniture", length = 500)
    private String desiredFurniture;

    @Column(name = "suggested_budget")
    private Long suggestedBudget;

    @Column(length = 2000)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
