package com.homely.api.admin;

import com.homely.api.aidesign.DesignService;
import com.homely.api.aidesign.dto.DesignJobSummaryResponse;
import com.homely.api.common.ApiResponse;
import com.homely.api.common.PagedResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/designs")
public class AdminDesignController {

    private final DesignService designService;

    public AdminDesignController(DesignService designService) {
        this.designService = designService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PagedResponse<DesignJobSummaryResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // ownerId = null -> tất cả user, tái dùng logic paging/filter chung với GET /designs
        return ApiResponse.success(PagedResponse.of(designService.listJobs(null, status, pageable)));
    }
}
