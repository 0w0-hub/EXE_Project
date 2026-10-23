package com.homely.api.sharing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DesignShareRepository extends JpaRepository<DesignShare, UUID> {

    Optional<DesignShare> findByJobId(UUID jobId);

    Optional<DesignShare> findByShareToken(UUID shareToken);
}
