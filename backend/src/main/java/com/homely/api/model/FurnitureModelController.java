package com.homely.api.model;

import com.homely.api.common.ApiResponse;
import com.homely.api.model.dto.FurnitureModelResponse;
import com.homely.api.model.dto.ModelCollectionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/models")
@Tag(name = "Models", description = "3D Furniture Models & Collections Catalog")
public class FurnitureModelController {

    private final FurnitureModelService modelService;

    public FurnitureModelController(FurnitureModelService modelService) {
        this.modelService = modelService;
    }

    @GetMapping("/collections")
    @Operation(summary = "Lấy danh sách các bộ sưu tập mô hình active")
    public ApiResponse<List<ModelCollectionResponse>> getCollections() {
        return ApiResponse.success(modelService.getAllCollections());
    }

    @GetMapping
    @Operation(summary = "Lấy danh mục mô hình nội thất 3D hỗ trợ lọc theo style, tier, category, query")
    public ApiResponse<List<FurnitureModelResponse>> getModels(
            @RequestParam(value = "style", required = false) String style,
            @RequestParam(value = "tier", required = false) String tier,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "collectionId", required = false) String collectionId,
            @RequestParam(value = "q", required = false) String query
    ) {
        return ApiResponse.success(modelService.getModels("ACTIVE", style, tier, category, collectionId, query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một mô hình nội thất 3D")
    public ApiResponse<FurnitureModelResponse> getModelById(@PathVariable String id) {
        return ApiResponse.success(modelService.getModelById(id));
    }
}
