package com.homely.api.billing;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    @EntityGraph(attributePaths = {"plan"})
    Optional<Subscription> findByUserId(UUID userId);

    /** Phân bố user theo plan code — trả về [plan_code, plan_name, count]. */
    @Query("SELECT p.code, p.name, COUNT(s) FROM Subscription s JOIN s.plan p " +
           "WHERE s.status = 'ACTIVE' GROUP BY p.code, p.name ORDER BY COUNT(s) DESC")
    List<Object[]> countActiveUsersByPlanCode();
}
