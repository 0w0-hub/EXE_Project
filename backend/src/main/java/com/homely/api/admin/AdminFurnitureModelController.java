package com.homely.api.admin;

import com.homely.api.common.ApiResponse;
import com.homely.api.model.FurnitureModelService;
import com.homely.api.model.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/models")
@Tag(name = "Admin Models", description = "Quản trị danh mục và nhập mô hình 3D cho Admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFurnitureModelController {

    private final FurnitureModelService modelService;

    public AdminFurnitureModelController(FurnitureModelService modelService) {
        this.modelService = modelService;
    }

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách mô hình cho Admin (kèm cả Draft/Archived)")
    public ApiResponse<List<FurnitureModelResponse>> list(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "style", required = false) String style,
            @RequestParam(value = "tier", required = false) String tier,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "collectionId", required = false) String collectionId,
            @RequestParam(value = "q", required = false) String query
    ) {
        return ApiResponse.success(modelService.getModels(status, style, tier, category, collectionId, query));
    }

    @PostMapping
    @Operation(summary = "Thêm một mô hình mới")
    public ApiResponse<FurnitureModelResponse> create(@Valid @RequestBody CreateFurnitureModelRequest request) {
        return ApiResponse.success(modelService.createModel(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin/metadata của mô hình")
    public ApiResponse<FurnitureModelResponse> update(
            @PathVariable String id,
            @RequestBody UpdateFurnitureModelRequest request
    ) {
        return ApiResponse.success(modelService.updateModel(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Lưu trữ / Xóa mềm mô hình (chuyển sang ARCHIVED)")
    public ApiResponse<Void> delete(@PathVariable String id) {
        modelService.deleteModel(id);
        return ApiResponse.success(null);
    }

    @PostMapping(value = "/upload-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tệp 3D (.glb) hoặc ảnh thumbnail lên server")
    public ApiResponse<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subDir", required = false, defaultValue = "misc") String subDir
    ) {
        String storedPath = modelService.storeFile(subDir, file);
        return ApiResponse.success(Map.of("path", storedPath, "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : ""));
    }

    @PostMapping("/batch-import")
    @Operation(summary = "Nhập hàng loạt mô hình từ một bộ thư mục")
    public ApiResponse<BatchImportResultResponse> batchImport(@Valid @RequestBody BatchImportRequest request) {
        return ApiResponse.success(modelService.batchImport(request));
    }
}
