package com.homely.api.admin;

import com.homely.api.admin.dto.AdminAnalyticsResponse;
import com.homely.api.admin.dto.AdminAnalyticsResponse.*;
import com.homely.api.aidesign.DesignJobRepository;
import com.homely.api.billing.SubscriptionRepository;
import com.homely.api.room.RoomPreferenceRepository;
import com.homely.api.room.RoomRepository;
import com.homely.api.user.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsService {

    private static final String BEHAVIOR_NOTE =
            "Dữ liệu hành vi dựa trên lượt tạo thiết kế AI (proxy) — " +
            "ứng dụng chưa có bảng session tracking riêng.";

    private final UserRepository userRepository;
    private final DesignJobRepository designJobRepository;
    private final RoomRepository roomRepository;
    private final RoomPreferenceRepository preferenceRepository;
    private final SubscriptionRepository subscriptionRepository;

    public AdminAnalyticsService(UserRepository userRepository,
                                  DesignJobRepository designJobRepository,
                                  RoomRepository roomRepository,
                                  RoomPreferenceRepository preferenceRepository,
                                  SubscriptionRepository subscriptionRepository) {
        this.userRepository = userRepository;
        this.designJobRepository = designJobRepository;
        this.roomRepository = roomRepository;
        this.preferenceRepository = preferenceRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    public AdminAnalyticsResponse buildReport() {
        Instant now = Instant.now();
        return new AdminAnalyticsResponse(
                now,
                buildUserGrowth(now),
                buildBehavior(now),
                buildAiEfficiency(now),
                buildRetention()
        );
    }

    // ── A ────────────────────────────────────────────────────────────────────

    private UserGrowthStats buildUserGrowth(Instant now) {
        Instant since30 = now.minus(30, ChronoUnit.DAYS);
        Instant since60 = now.minus(60, ChronoUnit.DAYS);
        Instant sinceWeeks = now.minus(84, ChronoUnit.DAYS);   // 12 tuần
        Instant sinceMonths = now.minus(365, ChronoUnit.DAYS); // 12 tháng

        long totalUsers = userRepository.count();
        long usersNoDesign = userRepository.countUsersWithNoDesigns();
        long usersUsedAI = userRepository.countUsersWhoUsedAI();
        double aiRate = totalUsers > 0 ? (double) usersUsedAI / totalUsers * 100 : 0;

        // Tỷ lệ tăng trưởng so với 30 ngày trước
        long newLast30 = toPoints(userRepository.countNewUsersByDay(since30)).stream()
                .mapToLong(TimeSeriesPoint::value).sum();
        long newPrev30 = toPoints(userRepository.countNewUsersByDay(since60)).stream()
                .mapToLong(TimeSeriesPoint::value).sum() - newLast30;
        double growthRate = newPrev30 > 0 ? (double)(newLast30 - newPrev30) / newPrev30 * 100 : 0;

        return new UserGrowthStats(
                totalUsers, usersNoDesign, usersUsedAI,
                round2(aiRate), round2(growthRate),
                toPoints(userRepository.countNewUsersByDay(since30)),
                toPoints(userRepository.countNewUsersByWeek(sinceWeeks)),
                toPoints(userRepository.countNewUsersByMonth(sinceMonths))
        );
    }

    // ── B ────────────────────────────────────────────────────────────────────

    private BehaviorStats buildBehavior(Instant now) {
        Instant since30 = now.minus(30, ChronoUnit.DAYS);
        Instant since84 = now.minus(84, ChronoUnit.DAYS);

        long totalJobs = designJobRepository.count();
        long totalUsers = userRepository.count();
        double avgJobsPerUser = totalUsers > 0 ? (double) totalJobs / totalUsers : 0;

        List<TimeSeriesPoint> byDay = toPoints(designJobRepository.countJobsByDay(since30));
        TimeSeriesPoint busiest = byDay.stream()
                .max((a, b) -> Long.compare(a.value(), b.value()))
                .orElse(new TimeSeriesPoint("-", 0));

        return new BehaviorStats(
                totalJobs,
                round2(avgJobsPerUser),
                busiest.label(),
                busiest.value(),
                byDay,
                toPoints(designJobRepository.countJobsByWeek(since84)),
                toPoints(designJobRepository.countJobsByHourOfDay()),
                BEHAVIOR_NOTE
        );
    }

    // ── C ────────────────────────────────────────────────────────────────────

    private AiEfficiencyStats buildAiEfficiency(Instant now) {
        Instant sinceMonths = now.minus(365, ChronoUnit.DAYS);

        long completed  = designJobRepository.countByStatus("COMPLETED");
        long failed     = designJobRepository.countByStatus("FAILED");
        long pending    = designJobRepository.countByStatus("PENDING");
        long processing = designJobRepository.countByStatus("PROCESSING");
        long totalJobs  = completed + failed + pending + processing;

        double successRate = (completed + failed) > 0
                ? (double) completed / (completed + failed) * 100 : 0;

        Double avgSec = designJobRepository.avgProcessingSecondsForCompleted();
        double avgJobsPerUser = userRepository.count() > 0
                ? (double) totalJobs / userRepository.count() : 0;

        List<NameValuePoint> styles = toNameValue(preferenceRepository.countByStyleGrouped());

        List<NameValuePoint> byStatus = List.of(
                new NameValuePoint("COMPLETED", completed),
                new NameValuePoint("FAILED", failed),
                new NameValuePoint("PENDING", pending),
                new NameValuePoint("PROCESSING", processing)
        );

        return new AiEfficiencyStats(
                totalJobs, completed, failed, pending, processing,
                round2(successRate), avgSec != null ? round2(avgSec) : null,
                round2(avgJobsPerUser),
                styles, byStatus,
                toNameValue(designJobRepository.processingTimeDistribution()),
                toPoints(designJobRepository.countCompletedJobsByMonth(sinceMonths))
        );
    }

    // ── D ────────────────────────────────────────────────────────────────────

    private RetentionStats buildRetention() {
        long totalUsers     = userRepository.count();
        long usersWithRoom  = roomRepository.countDistinctOwners();
        long usersWithJob   = designJobRepository.countDistinctOwners();
        long usersCompleted = designJobRepository.countDistinctOwnersWithCompleted();

        long retD1  = designJobRepository.countUsersRetainedWithinSeconds(86_400L);
        long retD7  = designJobRepository.countUsersRetainedWithinSeconds(604_800L);
        long retD30 = designJobRepository.countUsersRetainedWithinSeconds(2_592_000L);

        double rateD1  = totalUsers > 0 ? (double) retD1  / totalUsers * 100 : 0;
        double rateD7  = totalUsers > 0 ? (double) retD7  / totalUsers * 100 : 0;
        double rateD30 = totalUsers > 0 ? (double) retD30 / totalUsers * 100 : 0;

        // [code, name, count] — use name (index 1) as label, count (index 2) as value
        List<NameValuePoint> byPlan = subscriptionRepository.countActiveUsersByPlanCode().stream()
                .map(r -> new NameValuePoint(r[1] != null ? r[1].toString() : "?", toLong(r[2])))
                .collect(java.util.stream.Collectors.toList());

        return new RetentionStats(
                totalUsers, usersWithRoom, usersWithJob, usersCompleted,
                retD1, retD7, retD30,
                round2(rateD1), round2(rateD7), round2(rateD30),
                byPlan
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static long toLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(o.toString().trim()); } catch (NumberFormatException e) { return 0L; }
    }

    private List<TimeSeriesPoint> toPoints(List<Object[]> rows) {
        return rows.stream()
                .map(r -> new TimeSeriesPoint(
                        r[0] != null ? r[0].toString() : "?",
                        toLong(r[1])))
                .collect(Collectors.toList());
    }

    private List<NameValuePoint> toNameValue(List<Object[]> rows) {
        return rows.stream()
                .map(r -> new NameValuePoint(
                        r[0] != null ? r[0].toString() : "?",
                        toLong(r[1])))
                .collect(Collectors.toList());
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
