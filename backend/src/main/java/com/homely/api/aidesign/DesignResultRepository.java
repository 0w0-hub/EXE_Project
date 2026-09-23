package com.homely.api.aidesign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DesignResultRepository extends JpaRepository<DesignResult, UUID> {
    Optional<DesignResult> findByJobId(UUID jobId);
}
