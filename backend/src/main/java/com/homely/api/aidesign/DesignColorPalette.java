package com.homely.api.aidesign;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "design_color_palettes")
@Getter
@Setter
@NoArgsConstructor
public class DesignColorPalette {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "result_id", nullable = false)
    private UUID resultId;

    @Column(name = "color_hex", nullable = false, length = 7)
    private String colorHex;

    @Column(length = 20)
    private String role; // PRIMARY | SECONDARY | ACCENT
}
