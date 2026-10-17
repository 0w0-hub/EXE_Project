package com.homely.api.billing;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    @EntityGraph(attributePaths = {"plan"})
    Optional<Subscription> findByUserId(UUID userId);
}
