package com.homely.api.template;

import com.homely.api.common.ApiResponse;
import com.homely.api.template.dto.TemplateResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Danh sách mẫu thiết kế công khai — xem docs/services/template-service.md.
 */
@RestController
@RequestMapping("/api/v1/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ApiResponse<List<TemplateResponse>> list(@RequestParam(required = false) String category) {
        return ApiResponse.success(templateService.list(category));
    }

    @GetMapping("/categories")
    public ApiResponse<List<String>> categories() {
        return ApiResponse.success(templateService.listCategories());
    }

    @GetMapping("/{id}")
    public ApiResponse<TemplateResponse> getOne(@PathVariable UUID id) {
        return ApiResponse.success(templateService.getById(id));
    }
}
