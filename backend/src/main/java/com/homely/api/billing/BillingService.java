package com.homely.api.billing;

import com.homely.api.billing.dto.PlanResponse;
import com.homely.api.billing.dto.SubscriptionResponse;
import com.homely.api.billing.dto.UsageResponse;
import com.homely.api.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * Quản lý plan/subscription + kiểm tra giới hạn sử dụng — xem docs/services/billing-service.md.
 *
 * Quan trọng: BillingService KHÔNG bao giờ đọc bảng design_jobs (thuộc module aidesign) —
 * số lượt đã dùng ("used") luôn được module gọi (aidesign) tính trước rồi truyền vào, để
 * tránh circular dependency (aidesign -> billing -> aidesign) và tôn trọng ranh giới module
 * — xem rules/architecture/service-boundaries.md.
 */
@Service
public class BillingService {

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;

    public BillingService(PlanRepository planRepository, SubscriptionRepository subscriptionRepository) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    public static Instant startOfCurrentMonth() {
        return LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    @Transactional
    public void assignFreePlanToNewUser(UUID userId) {
        Plan freePlan = planRepository.findByCode("FREE")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PLAN_NOT_FOUND", "Gói FREE chưa được seed"));
        Subscription subscription = new Subscription();
        subscription.setUserId(userId);
        subscription.setPlanId(freePlan.getId());
        subscriptionRepository.save(subscription);
    }

    public List<PlanResponse> listPlans() {
        return planRepository.findAll().stream().map(PlanResponse::from).toList();
    }

    private Subscription getSubscription(UUID userId) {
        return subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SUBSCRIPTION_NOT_FOUND", "Không tìm thấy gói của user"));
    }

    private Plan getPlan(UUID planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PLAN_NOT_FOUND", "Plan không tồn tại"));
    }

    public SubscriptionResponse getSubscriptionResponse(UUID userId) {
        Subscription sub = getSubscription(userId);
        Plan plan = getPlan(sub.getPlanId());
        return new SubscriptionResponse(sub.getId(), plan.getCode(), plan.getName(), sub.getStatus(), sub.getCreatedAt());
    }

    /** used: số design job của user trong tháng hiện tại, do module aidesign tính và truyền vào. */
    public void checkUsageLimit(UUID ownerId, long used) {
        Subscription sub = getSubscription(ownerId);
        Plan plan = getPlan(sub.getPlanId());
        Integer limit = plan.getGenerationLimit();
        if (limit != null && used >= limit) {
            throw new ApiException(HttpStatus.FORBIDDEN, "USAGE_LIMIT_EXCEEDED",
                    "Bạn đã dùng hết " + limit + " lượt tạo thiết kế trong gói " + plan.getName() + " tháng này");
        }
    }

    public UsageResponse buildUsageResponse(UUID ownerId, long used) {
        Subscription sub = getSubscription(ownerId);
        Plan plan = getPlan(sub.getPlanId());
        Integer limit = plan.getGenerationLimit();
        Integer remaining = limit != null ? Math.max(0, limit - (int) used) : null;
        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        return new UsageResponse(used, limit, remaining, now.getMonthValue(), now.getYear());
    }
}
