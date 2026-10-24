# TASK-006

## Title

3D: sinh mesh thật (GLB) cho 1 món nội thất "hero" qua `firtoz/trellis`, load vào `Room3DViewer`

## Goal

Thay khối hộp placeholder của món nội thất chính (category `seating`) bằng model 3D thật khi có Replicate — theo ADR-0005. Các món còn lại vẫn là khối hộp (TASK-004).

## Scope

- Migration `V3__design_furniture_model_asset.sql`: thêm `model_asset_id` (nullable) vào `design_furniture_items`.
- `DesignFurnitureItem`, `DesignGenerationOutput.FurnitureItem`, `DesignResultWriter`, `DesignJobResponse.FurnitureItemResponse`, `DesignService` mapping: thêm field `modelAssetId` xuyên suốt.
- `MockAiDesignProvider`: truyền `null`.
- `ReplicateClient`: thêm `extractFileUrl(Object)`.
- `ReplicateAiDesignProvider`: `generateFurnitureMesh()` cho item `seating` đầu tiên — sinh thumbnail qua `generateImage()` có sẵn, gọi `firtoz/trellis` qua `runAndWaitByModel`, lưu GLB qua `assetService.storeGenerated(...)`. Bọc try/catch riêng, lỗi → `modelAssetId=null`, không fail job.
- Frontend `Room3DViewer.jsx`: thêm `GLTFLoader`, load GLB khi có `modelAssetId`, fallback box khi không có.

## Giới hạn đã biết

- Field input/output của `firtoz/trellis` là best-effort, chưa verify (ADR-0005).
- Không thể test nhánh Replicate thật (không có key) — chỉ verify được nhánh `modelAssetId=null` (mock, hoặc lỗi) không vỡ `Room3DViewer`.

## Dependencies

TASK-005 (COMPLETED).

## Affected Services

`aidesign` (entity/DTO/provider), `frontend` (Room3DViewer).

## Acceptance Criteria

- `mvn test` PASS (cập nhật test nếu constructor `FurnitureItem` đổi).
- Migration chạy được (Docker Flyway).
- E2E Docker + `AI_PROVIDER=mock` qua browser thật: `Room3DViewer` vẫn hiển thị đúng (box, không vỡ) khi `modelAssetId=null`.

## Testing

- `mvn test`: 12/12 PASS. Không cần sửa `MockAiDesignProviderTest`/`MockAiDesignProvider` nhờ overload constructor 4-arg cho `FurnitureItem` (modelAssetId mặc định null).
- Docker: migration `V3__design_furniture_model_asset.sql` áp dụng thành công (log Flyway xác nhận "now at version v3").
- E2E qua browser thật: mở lại job cũ (tạo từ trước migration) — `Room3DViewer` render đúng như TASK-004, không vỡ; console sạch (không lỗi khi reload trang từ đầu).
- Verify trực tiếp response API (`GET /designs/jobs/{id}`): field `modelAssetId: null` xuất hiện đúng trong từng furniture item — xác nhận chuỗi entity → DTO → JSON hoạt động đúng.
- **Không verify được nhánh có mesh thật** (cần `REPLICATE_API_KEY` + field input `firtoz/trellis` chưa xác thực — xem ADR-0005).

## Status

COMPLETED
