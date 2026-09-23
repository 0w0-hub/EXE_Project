# ADR-0005: Nâng cấp AI pipeline — giữ bố cục thật khi redesign 2D + sinh mesh 3D cho nội thất

## Status

ACCEPTED (2026-09-16)

## Context

ADR-0003 (ACCEPTED) đã chọn Replicate cho vision (LLaVA) + sinh ảnh (SDXL), nhưng tự ghi nhận 2 hạn chế trong mục Consequences:

1. Ảnh 2D sinh ra là **text-to-image thuần** — "AI truyền cảm hứng từ ảnh gốc", không giữ đúng tường/cửa sổ/bố cục thật của ảnh người dùng upload (cần model segmentation/inpaint để nâng cấp — để trong backlog).
2. Không gian 3D (`Room3DViewer`, TASK-004) chỉ là khối hộp hình học (`BoxGeometry`), không phải model 3D thật.

Người dùng yêu cầu nâng cấp toàn diện hơn cho cả 2D và 3D, và hỏi model AI nào phù hợp. Sau khi khảo sát các model có trên Replicate (nền tảng đã dùng theo ADR-0003) và xác nhận với user qua 2 câu hỏi làm rõ phạm vi, quyết định như dưới đây.

**Ràng buộc khi ra quyết định:** không có `REPLICATE_API_KEY` thật để test, và không lấy được chính xác OpenAPI schema của các model mới (trang Replicate là SPA không fetch tĩnh được, không có key để gọi API lấy schema) — chấp nhận rủi ro này có chủ đích, xem Consequences.

## Decision

**2D — giữ bố cục thật khi redesign:** thêm model `rocketdigitalai/interior-design-sdxl` (SDXL + ControlNet depth/line) — nhận ảnh phòng gốc + prompt, giữ đúng tường/cửa sổ/góc nhìn, chỉ đổi style/nội thất theo prompt. `ReplicateAiDesignProvider.generate()` dùng model này (`redesignImage()`) khi có ảnh gốc; giữ nguyên `generateImage()` (SDXL text-to-image cũ, ADR-0003) làm fallback khi không có ảnh gốc.

**3D — sinh mesh thật cho 1 món nội thất "hero":** thêm model image-to-3D `firtoz/trellis` — nhận 1 ảnh, trả về mesh 3D (GLB). Do pipeline hiện chạy tuần tự trong 1 `@Async` call (mỗi Replicate call tới ~90s), **chỉ áp dụng cho 1 món nội thất "hero"** (item category `seating` — luôn có trong furniture plan) thay vì cả 4 món, để job không kéo dài quá 10-15 phút. Quyết định phạm vi này do user chọn trực tiếp khi được hỏi (phương án khác: cả 4 món, hoặc làm song song trước — không chọn).

**Gọi theo tên model, không theo version hash:** 2 model mới gọi qua `POST /v1/models/{owner}/{name}/predictions` (`ReplicateClient.runAndWaitByModel`) thay vì pin version hash như LLaVA/SDXL (ADR-0003). Lý do: không lấy được version hash đã verify của 2 model mới; pin nhầm 1 hash không tồn tại sẽ luôn lỗi 100%, trong khi gọi theo tên model để Replicate tự dùng version mới nhất tránh rủi ro đó — đánh đổi là output có thể đổi nếu owner cập nhật model (chấp nhận được vì đây là model cộng đồng, không tự kiểm soát version dù có pin hay không).

**Field input/output của 2 model mới là best-effort, CHƯA VERIFY:** tên field (`image`, `prompt` cho interior-design-sdxl; `images` cho trellis) dựa trên mô tả công khai (trang model, blog), không phải OpenAPI schema xác thực. Đánh dấu rõ trong code (comment tại hằng số model + method gọi).

**Bước sinh mesh 3D không được làm fail cả job:** bọc riêng trong try/catch, lỗi thì `modelAssetId=null` (frontend fallback về khối hộp như TASK-004) — đây là bước thử nghiệm trên nền tảng đã hoạt động ổn định, không đánh đổi độ tin cậy của luồng chính.

**Không đổi 2 model đã verify ở ADR-0003** (LLaVA vision, SDXL text-to-image fallback) — giữ nguyên version hash pin cứng.

## Consequences

- **Được:** giải quyết đúng 2 hạn chế đã ghi trong ADR-0003; kiến trúc mở rộng đúng pattern cũ (qua `AiDesignProvider`, `ReplicateClient`), không phá luồng mock/test hiện có; lỗi ở bước mesh 3D không lan ra job chính.
- **Đánh đổi:** field input/output 2 model mới chưa verify — **rủi ro thực tế là lần chạy Replicate thật đầu tiên (khi có key) có thể lỗi do sai tên field**, cần sửa lại dựa trên response lỗi thật (giống cách xử lý "version not found" ở ADR-0003, mở rộng thêm case "input schema không khớp"). Gọi theo tên model (không pin version) nghĩa là hành vi có thể đổi ngoài tầm kiểm soát nếu owner cập nhật model.
- **Đánh đổi UX:** thêm 1 món nội thất có mesh thật sẽ làm job xử lý lâu hơn đáng kể (thêm 2 lệnh gọi Replicate tuần tự, tới ~3 phút) so với trước — chấp nhận được vì chỉ 1 món, không phải cả 4.
- **Chưa verify E2E thật** cho cả 2 model mới — gộp chung với việc verify ADR-0003 khi user cung cấp `REPLICATE_API_KEY` (xem `tasks/backlog/README.md`).
- Không đổi chi phí/logic billing — giới hạn gói Free/Pro vẫn áp dụng như cũ, chỉ chi phí Replicate thật/lượt tăng lên (ước tính thêm cho 2D: ~$0.14/lượt; 3D hero item: ~$0.02 ảnh + ~$0.04 mesh/lượt — chưa tính vào billing, giống cách ADR-0003 đã xử lý).
