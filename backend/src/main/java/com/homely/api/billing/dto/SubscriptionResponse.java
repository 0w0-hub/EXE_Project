package com.homely.api.billing.dto;

import java.time.Instant;
import java.util.UUID;

public record SubscriptionResponse(UUID id, String planCode, String planName, String status, Instant createdAt) {
}
