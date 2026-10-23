package com.homely.api.template;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface DesignTemplateRepository extends JpaRepository<DesignTemplate, UUID> {

    List<DesignTemplate> findByCategory(String category);

    @Query("select distinct t.category from DesignTemplate t order by t.category")
    List<String> findDistinctCategories();
}
