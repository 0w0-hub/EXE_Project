package com.homely.api.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // ── Analytics queries ─────────────────────────────────────────────────────

    /** Số users mới theo ngày — trả về [date_str, count]. */
    @Query(value = "SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) " +
                   "FROM users WHERE created_at >= :since GROUP BY day ORDER BY day",
           nativeQuery = true)
    List<Object[]> countNewUsersByDay(@Param("since") Instant since);

    /** Số users mới theo tuần — trả về [year_week, count]. */
    @Query(value = "SELECT TO_CHAR(DATE_TRUNC('week', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS week, COUNT(*) " +
                   "FROM users WHERE created_at >= :since GROUP BY week ORDER BY week",
           nativeQuery = true)
    List<Object[]> countNewUsersByWeek(@Param("since") Instant since);

    /** Số users mới theo tháng — trả về [year_month, count]. */
    @Query(value = "SELECT TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month, COUNT(*) " +
                   "FROM users WHERE created_at >= :since GROUP BY month ORDER BY month",
           nativeQuery = true)
    List<Object[]> countNewUsersByMonth(@Param("since") Instant since);

    /** Số users chưa từng tạo design job nào. */
    @Query(value = "SELECT COUNT(*) FROM users u WHERE u.id NOT IN (SELECT DISTINCT owner_id FROM design_jobs)",
           nativeQuery = true)
    long countUsersWithNoDesigns();

    /** Số users đã dùng AI ít nhất 1 lần (job không phải nhân bản). */
    @Query(value = "SELECT COUNT(DISTINCT owner_id) FROM design_jobs WHERE duplicated_from_job_id IS NULL",
           nativeQuery = true)
    long countUsersWhoUsedAI();
}
