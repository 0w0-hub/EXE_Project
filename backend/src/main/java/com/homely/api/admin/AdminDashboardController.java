package com.homely.api.admin;

import com.homely.api.admin.dto.AdminDashboardResponse;
import com.homely.api.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private final AdminService adminService;

    public AdminDashboardController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminDashboardResponse> dashboard() {
        return ApiResponse.success(adminService.getDashboard());
    }
}
