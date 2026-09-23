package com.homely.api.insights;

import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.insights.dto.InsightsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * TASK-099: thống kê thiết kế cá nhân toàn tài khoản — chỉ tính cho user hiện tại (JWT required,
 * route khớp pattern "/api/v1/**" đã bảo vệ mặc định trong SecurityConfig, không cần sửa file đó).
 */
@RestController
@RequestMapping("/api/v1/insights")
public class InsightsController {

    private final InsightsService insightsService;

    public InsightsController(InsightsService insightsService) {
        this.insightsService = insightsService;
    }

    @GetMapping("/me")
    public ApiResponse<InsightsResponse> me() {
        UUID userId = CurrentUser.id();
        return ApiResponse.success(insightsService.getInsights(userId));
    }
}
