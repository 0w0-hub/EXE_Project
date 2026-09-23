package com.homely.api.billing;

import com.homely.api.billing.dto.SubscriptionResponse;
import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final BillingService billingService;

    public SubscriptionController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/me")
    public ApiResponse<SubscriptionResponse> me() {
        return ApiResponse.success(billingService.getSubscriptionResponse(CurrentUser.id()));
    }
}
