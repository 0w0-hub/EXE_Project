package com.homely.api.admin;

import com.homely.api.admin.dto.AdminSystemHealthResponse;
import com.homely.api.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** TASK-094: "sức khoẻ hệ thống" cho admin — tách controller riêng vì path khác `/admin/dashboard`
 *  (giống cách AdminUserController/AdminDesignController đã tách theo path/resource). */
@RestController
@RequestMapping("/api/v1/admin/system-health")
public class AdminSystemHealthController {

    private final AdminService adminService;

    public AdminSystemHealthController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminSystemHealthResponse> systemHealth() {
        return ApiResponse.success(adminService.getSystemHealth());
    }
}
