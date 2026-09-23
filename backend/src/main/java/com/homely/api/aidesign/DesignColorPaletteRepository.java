package com.homely.api.aidesign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DesignColorPaletteRepository extends JpaRepository<DesignColorPalette, UUID> {
    List<DesignColorPalette> findByResultId(UUID resultId);
}
