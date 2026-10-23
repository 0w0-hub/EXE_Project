package com.homely.api.aidesign;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "design_furniture_items")
@Getter
@Setter
@NoArgsConstructor
public class DesignFurnitureItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "result_id", nullable = false)
    private UUID resultId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(length = 255)
    private String position;

    @Column(name = "estimated_cost")
    private Long estimatedCost;

    // Mesh 3D thật (GLB) — chỉ item "hero" (ADR-0005/TASK-006) có giá trị, còn lại null.
    @Column(name = "model_asset_id")
    private UUID modelAssetId;
}
