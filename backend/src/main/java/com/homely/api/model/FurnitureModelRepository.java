package com.homely.api.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FurnitureModelRepository extends JpaRepository<FurnitureModel, String> {
    Optional<FurnitureModel> findByCode(String code);

    List<FurnitureModel> findByStatusOrderBySortOrderAsc(String status);

    List<FurnitureModel> findByCollectionIdAndStatusOrderBySortOrderAsc(String collectionId, String status);

    List<FurnitureModel> findByCategoryAndStatusOrderBySortOrderAsc(String category, String status);

    @Query("SELECT m FROM FurnitureModel m WHERE " +
           "(:status IS NULL OR m.status = :status) AND " +
           "(:style IS NULL OR m.style = :style) AND " +
           "(:tier IS NULL OR m.tier = :tier) AND " +
           "(:category IS NULL OR m.category = :category) AND " +
           "(:collectionId IS NULL OR m.collectionId = :collectionId) AND " +
           "(:query IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.code) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.tags) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY m.sortOrder ASC")
    List<FurnitureModel> findWithFilters(
            @Param("status") String status,
            @Param("style") String style,
            @Param("tier") String tier,
            @Param("category") String category,
            @Param("collectionId") String collectionId,
            @Param("query") String query
    );
}
