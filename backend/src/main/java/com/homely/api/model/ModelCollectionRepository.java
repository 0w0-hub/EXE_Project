package com.homely.api.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ModelCollectionRepository extends JpaRepository<ModelCollection, String> {
    Optional<ModelCollection> findByCode(String code);
    List<ModelCollection> findByStatusOrderBySortOrderAsc(String status);
}
