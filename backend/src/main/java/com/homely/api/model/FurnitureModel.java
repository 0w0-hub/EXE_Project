package com.homely.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "furniture_models")
@Getter
@Setter
@NoArgsConstructor
public class FurnitureModel {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 150)
    private String code;

    @Column(nullable = false, length = 250)
    private String name;

    @Column(name = "collection_id", nullable = false, length = 36)
    private String collectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id", insertable = false, updatable = false)
    private ModelCollection collection;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "model_type", nullable = false, length = 50)
    private String modelType;

    @Column(name = "mount_type", nullable = false, length = 20)
    private String mountType = "floor";

    @Column(nullable = false, length = 30)
    private String style;

    @Column(nullable = false, length = 20)
    private String tier = "free";

    @Column(name = "required_plan", nullable = false, length = 20)
    private String requiredPlan = "FREE";

    @Column(nullable = false)
    private long price = 0;

    @Column(name = "model_path", length = 500)
    private String modelPath;

    @Column(name = "thumbnail_path", length = 500)
    private String thumbnailPath;

    @Column(name = "dimension_x", nullable = false)
    private double dimensionX = 1.0;

    @Column(name = "dimension_y", nullable = false)
    private double dimensionY = 1.0;

    @Column(name = "dimension_z", nullable = false)
    private double dimensionZ = 1.0;

    @Column(name = "is_surface_host", nullable = false)
    private boolean isSurfaceHost = false;

    @Column(name = "can_place_on_surface", nullable = false)
    private boolean canPlaceOnSurface = false;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(length = 500)
    private String tags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
