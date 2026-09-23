# Module: ai-design

**Status:** IMPLEMENTED — đây là module lõi của toàn sản phẩm. Xử lý bất đồng bộ qua `@Async` (không dùng message queue) đã verify chạy đúng: PENDING → PROCESSING → COMPLETED. 2 provider: `mock` (default, không tốn phí, verify E2E đầy đủ) và `replicate` (thật, ACCEPTED theo [ADR-0003](../decisions/ADR-0003-ai-integration-approach.md) + mở rộng theo [ADR-0005](../decisions/ADR-0005-2d-3d-upgrade.md) — đã unit test + fail-fast khi thiếu key, **chưa verify E2E với API key thật** vì user chưa cung cấp key, bao gồm cả 2 model mới ở ADR-0005).

- **Responsibility:** nhận yêu cầu generation từ `room` (ảnh + preference), điều phối gọi AI để tạo ra một phương án thiết kế đầy đủ, quản lý trạng thái job.
- **Owned Data:** bảng `design_jobs` (status: PENDING/PROCESSING/COMPLETED/FAILED), `design_results`, `design_furniture_items`, `design_color_palettes` (xem [../architecture/data-architecture.md](../architecture/data-architecture.md)).
- **Output đầy đủ của 1 job hoàn thành** (chi tiết input/output tại [../project/requirements.md](../project/requirements.md)):
  - Phương án decor (mô tả tổng thể)
  - Danh sách nội thất đề xuất (tên, loại, vị trí)
  - Bảng màu sắc áp dụng
  - Bố trí (layout) nội thất trong không gian
  - Chi phí dự kiến (tổng + breakdown theo item, đối chiếu ngân sách input)
  - Không gian 3D (scene/ảnh toàn cảnh xem & chỉnh sửa được)
  - Giải thích của AI (vì sao chọn phương án này dựa trên ảnh gốc + preference)
- **API:**
  - `POST /api/v1/designs/generate` — nhận `roomId` + `preferenceId`, kiểm tra giới hạn gói (qua `billing`) trước khi tạo job, tạo job, trả `jobId`. Vượt giới hạn → `403 USAGE_LIMIT_EXCEEDED`.
  - `GET /api/v1/designs/jobs/{jobId}` — trạng thái; khi `COMPLETED` trả đầy đủ output ở trên.
  - `GET /api/v1/designs?status=&page=&size=` — lịch sử job của chính user, phân trang (`PagedResponse<DesignJobSummaryResponse>`), dùng cho trang "Dự án của tôi". Cùng logic (`DesignService.listJobs`) được `admin` tái sử dụng với `ownerId=null` để lấy job của tất cả user.
- **Events Produced/Consumed:** none ở MVP (xử lý bất đồng bộ bằng job status trong DB; nâng cấp lên queue thật nếu cần — xem [../../rules/architecture/scalability.md](../../rules/architecture/scalability.md)).
- **Dependencies:** `room` (input + resolve roomType cho danh sách), `asset` (lưu kết quả), `billing` (kiểm tra giới hạn — `aidesign` tự đếm `countJobsSince` rồi truyền vào `billingService.checkUsageLimit`, không để `billing` đọc `design_jobs` — xem [../../rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md)), AI provider bên ngoài (xem [ADR-0003](../decisions/ADR-0003-ai-integration-approach.md)).
- **Scaling:** tác vụ nặng, cần worker riêng nếu tải tăng (tham khảo mô hình `ai-worker` ở dự án tham khảo).
- **Failure Modes:** provider AI timeout/lỗi → job `FAILED` với lý do; không để job "pending" vô hạn (bài học từ dự án tham khảo). `ReplicateAiDesignProvider` fail fast lúc app khởi động (không lúc generate) nếu thiếu `REPLICATE_API_KEY`.
- **Security:** không cho user xem job của người khác.
- **Observability:** log thời gian xử lý mỗi job, tỷ lệ lỗi theo provider.

## Provider thật: Replicate (`ReplicateAiDesignProvider`)

- Vision (LLaVA-13b) phân tích thật ảnh phòng người dùng upload (nếu có) → mô tả ánh sáng/nội thất hiện có.
- Image generation: nếu có ảnh phòng gốc → `redesignImage()` (model `rocketdigitalai/interior-design-sdxl`, ControlNet, **giữ đúng bố cục/tường/cửa sổ thật**, chỉ đổi style/nội thất — ADR-0005); nếu không có ảnh gốc → `generateImage()` (SDXL text-to-image thuần, ADR-0003, fallback).
- Furniture/cost/layout vẫn deterministic (không phải LLM) — xem lý do trong [ADR-0003](../decisions/ADR-0003-ai-integration-approach.md).
- Model 2D/3D mới (ADR-0005) gọi theo tên model (`ReplicateClient.runAndWaitByModel`), field input/output **best-effort, chưa verify** — xem ADR-0005 Consequences.
- Kích hoạt: `AI_PROVIDER=replicate` + `REPLICATE_API_KEY` trong `.env`. Chi tiết setup: xem `README.md` gốc.
- Chi phí thật mỗi lượt generate (~$0.02–0.05/ảnh cũ hoặc ~$0.14/ảnh redesign ControlNet + phí LLaVA, cộng thêm mesh 3D nếu áp dụng — xem module 3D bên dưới) — module `billing` (giới hạn lượt/tháng) áp dụng như bình thường, không phân biệt provider.

## Mesh 3D cho nội thất "hero" (ADR-0005, TASK-006)

- Chỉ 1 món nội thất (category `seating`) được sinh mesh 3D thật (GLB) qua model `firtoz/trellis` — không phải cả 4 món, để tránh job kéo dài quá lâu (pipeline hiện chạy tuần tự trong 1 `@Async` call).
- Bước này bọc try/catch riêng — lỗi không làm fail job, `modelAssetId` của item đó là `null` (frontend fallback về khối hộp).
- Asset GLB lưu qua `AssetService` như asset thường (`assetType=DESIGN_FURNITURE_MODEL`), phục vụ qua `GET /api/v1/assets/{id}` (không cần đổi `AssetService`/`AssetController`).
