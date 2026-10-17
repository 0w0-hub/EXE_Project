package com.homely.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "model_collections")
@Getter
@Setter
@NoArgsConstructor
public class ModelCollection {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    private String style; // STYLIZED | REALISTIC

    @Column(name = "default_tier", nullable = false, length = 20)
    private String defaultTier = "FREE"; // FREE | PREMIUM

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "author_or_source", length = 200)
    private String authorOrSource;

    @Column(length = 100)
    private String license;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE | INACTIVE | DRAFT

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FurnitureModel> models = new ArrayList<>();
}
