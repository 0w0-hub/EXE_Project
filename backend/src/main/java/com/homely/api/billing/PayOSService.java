package com.homely.api.billing;

import com.homely.api.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Dịch vụ tích hợp PayOS (SDK 2.0.1) — tạo link thanh toán và xử lý webhook.
 */
@Service
public class PayOSService {

    private static final Logger log = LoggerFactory.getLogger(PayOSService.class);

    private final PayOS payOS;
    private final PaymentOrderRepository paymentOrderRepository;
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Value("${homely.payos.return-url}")
    private String returnUrl;

    @Value("${homely.payos.cancel-url}")
    private String cancelUrl;

    public PayOSService(
            @Value("${homely.payos.client-id}") String clientId,
            @Value("${homely.payos.api-key}") String apiKey,
            @Value("${homely.payos.checksum-key}") String checksumKey,
            PaymentOrderRepository paymentOrderRepository,
            PlanRepository planRepository,
            SubscriptionRepository subscriptionRepository) {
        this.payOS = new PayOS(clientId, apiKey, checksumKey);
        this.paymentOrderRepository = paymentOrderRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * Tạo link thanh toán PayOS cho một gói subscription.
     */
    @Transactional
    public Map<String, String> createPaymentLink(String userId, String planCode, String billing) {
        Plan plan = planRepository.findByCode(planCode.toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PLAN_NOT_FOUND",
                        "Không tìm thấy gói: " + planCode));

        long amount = "yearly".equalsIgnoreCase(billing)
                ? (plan.getYearlyPrice() != null ? plan.getYearlyPrice() : plan.getMonthlyPrice() * 12)
                : plan.getMonthlyPrice();

        if (amount <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AMOUNT", "Gói miễn phí không cần thanh toán");
        }

        // orderCode số nguyên dương unique
        long orderCode = Long.parseLong(
                String.valueOf(Instant.now().toEpochMilli()).substring(4) +
                        String.valueOf(ThreadLocalRandom.current().nextInt(100, 999)));

        String description = "Homely " + plan.getName() + " " + billing;
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }
        String paymentId = UUID.randomUUID().toString();

        try {
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Homely " + plan.getName())
                    .quantity(1)
                    .price(amount)
                    .build();

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description(description)
                    .items(List.of(item))
                    .returnUrl(returnUrl + "?orderId=" + paymentId)
                    .cancelUrl(cancelUrl + "?orderId=" + paymentId)
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);

            PaymentOrder order = new PaymentOrder();
            order.setId(paymentId);
            order.setUserId(userId);
            order.setPlanCode(planCode.toUpperCase());
            order.setBilling(billing.toLowerCase());
            order.setOrderCode(orderCode);
            order.setAmount((int) amount);
            order.setStatus("PENDING");
            order.setCheckoutUrl(response.getCheckoutUrl());
            paymentOrderRepository.save(order);

            log.info("PayOS: Tạo link thanh toán thành công — user={} plan={} amount={} orderCode={}",
                    userId, planCode, amount, orderCode);

            return Map.of(
                    "checkoutUrl", response.getCheckoutUrl(),
                    "orderId", paymentId,
                    "orderCode", String.valueOf(orderCode));

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("PayOS: Lỗi tạo link thanh toán — {}", e.getMessage(), e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PAYOS_ERROR",
                    "Không thể tạo link thanh toán: " + e.getMessage());
        }
    }

    /**
     * Xử lý webhook từ PayOS khi giao dịch thành công.
     */
    @Transactional
    public void handleWebhook(Object webhookPayload) {
        try {
            WebhookData data = payOS.webhooks().verify(webhookPayload);

            Long orderCode = data.getOrderCode();
            String code = data.getCode();

            paymentOrderRepository.findByOrderCode(orderCode).ifPresentOrElse(order -> {
                if ("PAID".equals(order.getStatus())) {
                    log.info("PayOS webhook: orderCode={} đã xử lý rồi, bỏ qua", orderCode);
                    return;
                }

                if ("00".equals(code)) {
                    order.setStatus("PAID");
                    order.setPaidAt(Instant.now().toEpochMilli());
                    paymentOrderRepository.save(order);

                    upgradeSubscription(order.getUserId(), order.getPlanCode());
                    log.info("PayOS webhook: PAID — user={} plan={} orderCode={}", order.getUserId(),
                            order.getPlanCode(), orderCode);
                } else {
                    order.setStatus("CANCELLED");
                    paymentOrderRepository.save(order);
                    log.info("PayOS webhook: CANCELLED — orderCode={} code={}", orderCode, code);
                }
            }, () -> log.warn("PayOS webhook: Không tìm thấy PaymentOrder với orderCode={}", orderCode));

        } catch (Exception e) {
            log.error("PayOS webhook: Lỗi xử lý — {}", e.getMessage(), e);
            throw new ApiException(HttpStatus.BAD_REQUEST, "WEBHOOK_ERROR", "Lỗi xử lý webhook: " + e.getMessage());
        }
    }

    public Map<String, Object> getOrderStatus(String orderId) {
        PaymentOrder order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng"));
        return Map.of(
                "orderId", order.getId(),
                "status", order.getStatus(),
                "planCode", order.getPlanCode(),
                "amount", order.getAmount());
    }

    private void upgradeSubscription(String userId, String planCode) {
        Plan plan = planRepository.findByCode(planCode).orElse(null);
        if (plan == null) {
            log.error("PayOS upgradeSubscription: không tìm thấy plan={}", planCode);
            return;
        }
        subscriptionRepository.findByUserId(java.util.UUID.fromString(userId)).ifPresentOrElse(sub -> {
            sub.setPlan(plan);
            sub.setStatus("ACTIVE");
            subscriptionRepository.save(sub);
            log.info("Subscription upgraded: user={} → plan={}", userId, planCode);
        }, () -> log.error("PayOS upgradeSubscription: không tìm thấy subscription của user={}", userId));
    }
}
