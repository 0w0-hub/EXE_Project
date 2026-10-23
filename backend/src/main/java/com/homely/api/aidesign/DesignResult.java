package com.homely.api.aidesign;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Output đầy đủ của 1 DesignJob — xem docs/project/requirements.md (mục Input/Output).
 */
@Entity
@Table(name = "design_results")
@Getter
@Setter
@NoArgsConstructor
public class DesignResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "job_id", nullable = false, unique = true)
    private UUID jobId;

    @Column(name = "decor_description", length = 2000)
    private String decorDescription;

    @Column(name = "ai_explanation", length = 2000)
    private String aiExplanation;

    @Column(name = "estimated_cost")
    private Long estimatedCost;

    @Column(name = "layout_description", length = 2000)
    private String layoutDescription;

    @Column(name = "result_asset_id")
    private UUID resultAssetId; // ảnh/scene 3D toàn cảnh

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
