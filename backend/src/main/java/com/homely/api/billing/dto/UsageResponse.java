package com.homely.api.billing.dto;

/**
 * xem docs/project/requirements.md — giới hạn lượt tạo thiết kế theo gói, tính theo tháng hiện tại.
 */
public record UsageResponse(long used, Integer limit, Integer remaining, int periodMonth, int periodYear) {
}
