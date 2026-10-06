package com.homely.api.design;

import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.design.dto.DesignResponse;
import com.homely.api.design.dto.DesignSummaryResponse;
import com.homely.api.design.dto.SaveDesignRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/designs/studio")
public class DesignStudioController {

    private final DesignStudioService service;

    public DesignStudioController(DesignStudioService service) {
        this.service = service;
    }

    @PostMapping("/save")
    public ApiResponse<DesignResponse> saveDesign(@Valid @RequestBody SaveDesignRequest request) {
        return ApiResponse.success(service.saveOrUpdate(CurrentUser.id(), request));
    }

    @GetMapping("/{id}")
    public ApiResponse<DesignResponse> getDesign(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(CurrentUser.id(), id));
    }

    @GetMapping("/mine")
    public ApiResponse<List<DesignSummaryResponse>> listMyDesigns() {
        return ApiResponse.success(service.listMine(CurrentUser.id()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDesign(@PathVariable UUID id) {
        service.delete(CurrentUser.id(), id);
        return ApiResponse.success(null);
    }
}
