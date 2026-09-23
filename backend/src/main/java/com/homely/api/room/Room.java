package com.homely.api.room;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "room_type", length = 100)
    private String roomType; // ví dụ: Phòng khách, Phòng ngủ, Phòng bếp...

    @Column(name = "width_meters")
    private Double widthMeters;

    @Column(name = "length_meters")
    private Double lengthMeters;

    @Column(name = "photo_asset_id")
    private UUID photoAssetId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
