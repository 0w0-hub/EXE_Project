package com.homely.api.billing.dto;

import com.homely.api.billing.Plan;

import java.util.UUID;

public record PlanResponse(UUID id, String code, String name, Integer generationLimit) {

    public static PlanResponse from(Plan plan) {
        return new PlanResponse(plan.getId(), plan.getCode(), plan.getName(), plan.getGenerationLimit());
    }
}
