package com.homely.api.user;

import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.user.dto.AchievementResponse;
import com.homely.api.user.dto.ActivityItemResponse;
import com.homely.api.user.dto.UserExportResponse;
import com.homely.api.user.dto.UserResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        User user = userService.getById(CurrentUser.id());
        return ApiResponse.success(UserResponse.from(user));
    }

    /** TASK-087: xuất dữ liệu cá nhân của CHÍNH user đang đăng nhập (profile + room + design job). */
    @GetMapping("/me/export")
    public ApiResponse<UserExportResponse> exportMyData() {
        return ApiResponse.success(userService.buildExport(CurrentUser.id()));
    }

    /** TASK-084: lịch sử hoạt động của CHÍNH user đang đăng nhập, mới nhất trước. */
    @GetMapping("/me/activity")
    public ApiResponse<List<ActivityItemResponse>> myActivity() {
        return ApiResponse.success(userService.getActivity(CurrentUser.id()));
    }

    /** TASK-091: huy hiệu thành tựu của CHÍNH user đang đăng nhập, tính từ dữ liệu thật (room/design
     *  job COMPLETED/share) mỗi lần gọi — KHÔNG có bảng lưu trạng thái "đã đạt" riêng. */
    @GetMapping("/me/achievements")
    public ApiResponse<List<AchievementResponse>> myAchievements() {
        return ApiResponse.success(userService.getAchievements(CurrentUser.id()));
    }
}
