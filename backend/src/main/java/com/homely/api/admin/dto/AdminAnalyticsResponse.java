package com.homely.api.admin.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record AdminAnalyticsResponse(
        Instant generatedAt,
        UserGrowthStats userGrowth,
        BehaviorStats behavior,
        AiEfficiencyStats aiEfficiency,
        RetentionStats retention
) {

    // ── A. Tăng trưởng người dùng ─────────────────────────────────────────────
    public record UserGrowthStats(
            long totalUsers,
            long usersWithNoDesigns,
            long usersWhoUsedAI,
            double aiActivationRate,        // % users đã dùng AI / tổng users
            double growthRateLast30Days,    // % tăng so với 30 ngày trước đó
            List<TimeSeriesPoint> newUsersByDay,
            List<TimeSeriesPoint> newUsersByWeek,
            List<TimeSeriesPoint> newUsersByMonth
    ) {}

    // ── B. Hành vi (proxy từ design_jobs vì không có session table) ───────────
    public record BehaviorStats(
            long totalJobsAsActivityProxy,  // tổng jobs = proxy "phiên làm việc"
            double avgJobsPerActiveUser,
            String busiestDayLabel,
            long busiestDayCount,
            List<TimeSeriesPoint> activityByDay,
            List<TimeSeriesPoint> activityByWeek,
            List<TimeSeriesPoint> activityByHourOfDay,
            String dataNote                 // ghi chú proxy cho FE hiển thị
    ) {}

    // ── C. Hiệu quả sử dụng AI ────────────────────────────────────────────────
    public record AiEfficiencyStats(
            long totalJobs,
            long completedJobs,
            long failedJobs,
            long pendingJobs,
            long processingJobs,
            double successRate,             // % COMPLETED / (COMPLETED + FAILED)
            Double avgProcessingSeconds,    // null nếu chưa có COMPLETED job
            double avgJobsPerUser,
            List<NameValuePoint> popularStyles,
            List<NameValuePoint> jobsByStatus,
            List<NameValuePoint> processingTimeDistribution,
            List<TimeSeriesPoint> completedJobsByMonth
    ) {}

    // ── D. Giữ chân & chuyển đổi ─────────────────────────────────────────────
    public record RetentionStats(
            // Funnel
            long funnelRegistered,
            long funnelCreatedRoom,
            long funnelCreatedDesign,
            long funnelCompletedDesign,
            // Retention proxy (job trong N ngày sau đăng ký)
            long retentionD1,
            long retentionD7,
            long retentionD30,
            double retentionD1Rate,
            double retentionD7Rate,
            double retentionD30Rate,
            // Plan distribution
            List<NameValuePoint> usersByPlan
    ) {}

    // ── Shared value types ────────────────────────────────────────────────────
    public record TimeSeriesPoint(String label, long value) {}
    public record NameValuePoint(String name, long value) {}
}
