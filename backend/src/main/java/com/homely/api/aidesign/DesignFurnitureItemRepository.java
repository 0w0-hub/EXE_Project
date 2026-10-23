package com.homely.api.aidesign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DesignFurnitureItemRepository extends JpaRepository<DesignFurnitureItem, UUID> {
    List<DesignFurnitureItem> findByResultId(UUID resultId);
}
