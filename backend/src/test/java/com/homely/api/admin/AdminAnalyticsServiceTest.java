package com.homely.api.admin;

import com.homely.api.aidesign.DesignJobRepository;
import com.homely.api.billing.SubscriptionRepository;
import com.homely.api.room.RoomPreferenceRepository;
import com.homely.api.room.RoomRepository;
import com.homely.api.user.UserRepository;
import org.junit.jupiter.api.Test;
import java.math.BigInteger;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminAnalyticsServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final DesignJobRepository jobs = mock(DesignJobRepository.class);
    private final RoomRepository rooms = mock(RoomRepository.class);
    private final RoomPreferenceRepository preferences = mock(RoomPreferenceRepository.class);
    private final SubscriptionRepository subscriptions = mock(SubscriptionRepository.class);
    private final AdminAnalyticsService service = new AdminAnalyticsService(users, jobs, rooms, preferences, subscriptions);

    @Test
    void emptyDatabaseProducesFiniteRatesAndEmptySeries() {
        when(jobs.avgProcessingSecondsForCompleted()).thenReturn(null);
        var report = service.buildReport();
        assertThat(report.userGrowth().aiActivationRate()).isZero();
        assertThat(report.userGrowth().growthRateLast30Days()).isZero();
        assertThat(report.behavior().avgJobsPerActiveUser()).isZero();
        assertThat(report.behavior().busiestDayLabel()).isEqualTo("-");
        assertThat(report.aiEfficiency().successRate()).isZero();
        assertThat(report.aiEfficiency().avgProcessingSeconds()).isNull();
        assertThat(report.retention().retentionD30Rate()).isZero();
        assertThat(report.retention().usersByPlan()).isEmpty();
    }

    @Test
    void reportHandlesNativeCountTypesAndThreeColumnPlanRows() {
        when(users.count()).thenReturn(10L);
        when(users.countUsersWhoUsedAI()).thenReturn(4L);
        when(users.countNewUsersByDay(any())).thenReturn(List.<Object[]>of(new Object[]{"2026-10-24", "3"}));
        when(preferences.countByStyleGrouped()).thenReturn(List.<Object[]>of(new Object[]{"Modern", BigInteger.valueOf(4)}));
        when(subscriptions.countActiveUsersByPlanCode()).thenReturn(List.<Object[]>of(new Object[]{"PLUS", "Plus", BigInteger.valueOf(7)}));
        when(jobs.countByStatus("COMPLETED")).thenReturn(3L);
        when(jobs.countByStatus("FAILED")).thenReturn(1L);
        var report = service.buildReport();
        assertThat(report.userGrowth().aiActivationRate()).isEqualTo(40.0);
        assertThat(report.userGrowth().newUsersByDay().get(0).value()).isEqualTo(3L);
        assertThat(report.aiEfficiency().successRate()).isEqualTo(75.0);
        assertThat(report.aiEfficiency().popularStyles().get(0).value()).isEqualTo(4L);
        assertThat(report.retention().usersByPlan().get(0).name()).isEqualTo("Plus");
        assertThat(report.retention().usersByPlan().get(0).value()).isEqualTo(7L);
    }
}
