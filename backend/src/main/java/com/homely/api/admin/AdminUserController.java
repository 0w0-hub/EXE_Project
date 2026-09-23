package com.homely.api.admin;

import com.homely.api.common.ApiResponse;
import com.homely.api.common.PagedResponse;
import com.homely.api.user.UserService;
import com.homely.api.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PagedResponse<UserResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserResponse> result = userService
                .listAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(UserResponse::from);
        return ApiResponse.success(PagedResponse.of(result));
    }
}
