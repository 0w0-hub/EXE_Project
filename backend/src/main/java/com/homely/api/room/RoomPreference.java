package com.homely.api.room;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Input sở thích/yêu cầu của user cho 1 lần generate — xem docs/project/requirements.md.
 */
@Entity
@Table(name = "room_preferences")
@Getter
@Setter
@NoArgsConstructor
public class RoomPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(length = 500)
    private String style; // phong cách: Scandinavian, Japandi, Modern...

    @Column(length = 500)
    private String preferredColors; // màu sắc mong muốn, phân tách bằng dấu phẩy

    @Column(name = "desired_furniture", length = 1000)
    private String desiredFurniture; // nội thất mong muốn, text tự do

    @Column
    private Long budget; // ngân sách (VND)

    @Column(name = "free_text_request", length = 2000)
    private String freeTextRequest; // yêu cầu tự do bằng text

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
