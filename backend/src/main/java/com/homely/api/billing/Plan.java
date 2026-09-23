package com.homely.api.billing;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String code; // FREE | PRO

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "generation_limit")
    private Integer generationLimit; // NULL = không giới hạn

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
