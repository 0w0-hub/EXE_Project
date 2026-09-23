package com.homely.api.billing;

import com.homely.api.aidesign.DesignService;
import com.homely.api.billing.dto.UsageResponse;
import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Nơi duy nhất gọi cả BillingService và DesignService để ghép usage — xem BillingService javadoc.
 */
@RestController
@RequestMapping("/api/v1/usage")
public class UsageController {

    private final BillingService billingService;
    private final DesignService designService;

    public UsageController(BillingService billingService, DesignService designService) {
        this.billingService = billingService;
        this.designService = designService;
    }

    @GetMapping("/me")
    public ApiResponse<UsageResponse> me() {
        UUID userId = CurrentUser.id();
        long used = designService.countJobsSince(userId, BillingService.startOfCurrentMonth());
        return ApiResponse.success(billingService.buildUsageResponse(userId, used));
    }
}
