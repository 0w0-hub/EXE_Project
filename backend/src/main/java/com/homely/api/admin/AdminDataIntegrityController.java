package com.homely.api.admin;

import com.homely.api.admin.dto.AdminOrphanCheckResponse;
import com.homely.api.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * TASK-111: "Admin Data Integrity Checker" — quét dữ liệu mồ côi (khoá ngoại LOGIC trỏ tới id
 * không còn tồn tại, tích luỹ qua nhiều migration V1->V10). THUẦN READ-ONLY — không có endpoint
 * sửa/xoá nào ở đây (xem Out of scope trong tasks/active/TASK-111-admin-orphan-checker.md). Khác
 * "Admin Data Explorer" (TASK-104, tra cứu theo 1 entity cụ thể) — đây là quét toàn bộ tìm lỗi.
 * Tách controller riêng vì path khác /admin/dashboard, cùng lý do
 * AdminSystemHealthController/AdminDataExplorerController đã tách trước đó (Spring không gộp được
 * absolute path khác nhau vào chung 1 @RequestMapping lớp).
 */
@RestController
@RequestMapping("/api/v1/admin/integrity")
public class AdminDataIntegrityController {

    private final AdminService adminService;

    public AdminDataIntegrityController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/orphans")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminOrphanCheckResponse> orphans() {
        return ApiResponse.success(adminService.checkOrphans());
    }
}
