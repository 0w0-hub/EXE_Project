package com.homely.api.admin;

import com.homely.api.admin.dto.AdminExplorerJobLookupResponse;
import com.homely.api.admin.dto.AdminExplorerUserResponse;
import com.homely.api.common.ApiException;
import com.homely.api.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * TASK-104: "Admin Data Explorer" — tra cứu nhanh xuyên bảng (user -> room -> job, job -> owner)
 * để admin không phải tự đối chiếu ID bằng tay giữa /admin/users và /admin/designs. THUẦN
 * READ-ONLY — không có endpoint sửa/xoá nào ở đây (đã có /admin/moderation, /admin/users cho việc
 * đó, xem Out of scope trong tasks/active/TASK-104-admin-data-explorer.md).
 * Tách controller riêng vì path khác /admin/dashboard — cùng lý do
 * AdminSystemHealthController/AdminModerationController đã tách trước đó (Spring không gộp được
 * absolute path khác nhau vào chung 1 @RequestMapping lớp).
 */
@RestController
@RequestMapping("/api/v1/admin/explorer")
public class AdminDataExplorerController {

    private final AdminService adminService;

    public AdminDataExplorerController(AdminService adminService) {
        this.adminService = adminService;
    }

    /** Tìm CHÍNH XÁC 1 user theo email (không search mờ/like — dữ liệu nhạy cảm). */
    @GetMapping("/user")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminExplorerUserResponse> findUser(@RequestParam String email) {
        return ApiResponse.success(adminService.findUserByEmailWithDetails(email));
    }

    /** Tìm 1 job theo UUID, trả về job + room liên kết + email chủ sở hữu ("job này của ai"). */
    @GetMapping("/job")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminExplorerJobLookupResponse> findJob(@RequestParam String jobId) {
        UUID id;
        try {
            id = UUID.fromString(jobId);
        } catch (IllegalArgumentException ex) {
            // jobId sai định dạng UUID -> 400 rõ ràng, không để Spring ném lỗi convert thành 500.
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_JOB_ID", "jobId không hợp lệ");
        }
        return ApiResponse.success(adminService.findJobById(id));
    }
}
