package com.homely.api.design;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DesignStudioRepository extends JpaRepository<Design, UUID> {

    List<Design> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<Design> findByIdAndUserId(UUID id, UUID userId);
}
