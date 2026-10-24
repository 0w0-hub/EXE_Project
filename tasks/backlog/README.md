# Backlog

Chưa breakdown chi tiết thành task file riêng. Đã hoàn thành: scaffold Spring Boot backend, React frontend, SQL Server schema/migration, Docker Compose ([TASK-001](../completed/TASK-001-scaffold-backend-frontend-docker.md)); templates, lịch sử phân trang, giới hạn gói/usage, admin panel ([TASK-002](../completed/TASK-002-templates-billing-admin.md)); ADR-0003 ACCEPTED + `ReplicateAiDesignProvider` implement/unit-test ([TASK-003](../completed/TASK-003-adr0003-replicate-provider.md)); 3D viewer/editor thật (`Room3DViewer`, three.js) thay `Room3DViewerPlaceholder` ([TASK-004](../completed/TASK-004-3d-viewer-editor.md)); ADR-0005 — 2D redesign giữ bố cục thật + sinh mesh 3D cho nội thất hero + kéo-resize phòng ([TASK-005](../completed/TASK-005-2d-controlnet-redesign.md), [TASK-006](../completed/TASK-006-3d-hero-furniture-mesh.md), [TASK-007](../completed/TASK-007-room-resize-3d-viewer.md)).

Nhóm việc còn lại:

1. **Verify E2E thật với `AI_PROVIDER=replicate`** khi user cung cấp `REPLICATE_API_KEY` — set env, rebuild Docker, chạy lại curl + browser E2E; nếu Replicate trả "version not found" thì cập nhật version hash mới (xem `rules/ai/model-integration.md`). Bao gồm cả 2 model mới ở ADR-0005 (`rocketdigitalai/interior-design-sdxl`, `firtoz/trellis`) — field input/output hiện là best-effort, chưa xác thực schema thật, nhiều khả năng cần sửa tên field sau lần chạy thật đầu tiên.
2. ~~Photo inpainting/mask-based editing thật~~ — đã implement qua ADR-0005/TASK-005 (`rocketdigitalai/interior-design-sdxl`, ControlNet giữ bố cục thật thay vì text-to-image thuần); **chưa verify E2E thật** (gộp vào mục #1).
3. Persist bố trí nội thất đã chỉnh trong `Room3DViewer` — hiện kéo-thả nội thất chỉ tồn tại trong phiên xem (client-side); kéo-resize kích thước phòng đã persist (TASK-007), nhưng vị trí từng món nội thất vẫn chưa — cần thêm cột toạ độ + API nếu muốn lưu lại.
4. Sinh mesh 3D thật cho toàn bộ 4 món nội thất (hiện chỉ 1 món "hero") — cần nâng cấp `DesignJobProcessor` sang gọi song song (CompletableFuture/thread pool) trước, vì mỗi món thêm ~2 lệnh gọi Replicate tuần tự (đã bàn với user, chọn giới hạn 1 món cho TASK-006).
5. Refresh token flow đầy đủ ở frontend (hiện chỉ lưu/dùng access token, chưa tự refresh khi hết hạn).
6. CI/CD pipeline (`rules/devops/ci-cd.md` — hiện PLANNED).
7. OpenAPI spec cho `docs/api/openapi/` (hiện trống).
8. Nâng cấp gói (checkout/thanh toán) — hiện chỉ có `GET /plans`, chưa có luồng đổi gói FREE→PRO thật.
9. Admin CRUD cho templates (hiện chỉ seed qua migration, chưa có API quản lý).

Khi bắt đầu, mỗi mục trên tách thành task riêng trong `tasks/backlog/TASK-XXX-*.md` hoặc chuyển thẳng vào `tasks/active/`.
