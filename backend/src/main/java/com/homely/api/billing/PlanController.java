package com.homely.api.billing;

import com.homely.api.billing.dto.PlanResponse;
import com.homely.api.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plans")
public class PlanController {

    private final BillingService billingService;

    public PlanController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping
    public ApiResponse<List<PlanResponse>> list() {
        return ApiResponse.success(billingService.listPlans());
    }
}
