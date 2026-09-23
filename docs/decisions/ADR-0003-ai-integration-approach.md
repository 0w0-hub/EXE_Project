# ADR-0003: Cách tích hợp AI provider cho phân tích phòng & sinh thiết kế 3D

## Status

ACCEPTED (2026-09-16)

## Context

Chức năng chính của Homely cần 2 khả năng AI:

1. Phân tích ảnh phòng thực tế (không gian, ánh sáng, vật thể hiện có).
2. Sinh ảnh/scene 3D toàn cảnh phòng theo phương án thiết kế mới, kèm danh sách nội thất/màu sắc/layout/chi phí/giải thích.

Các lựa chọn: dùng API AI bên thứ ba (nhanh triển khai, chi phí theo usage), hoặc self-host model (kiểm soát tốt hơn, chi phí hạ tầng cao hơn, cần GPU). Dự án tham khảo `dizaine_deploy` đã có Replicate/HuggingFace API key thật và đã chứng minh hoạt động được (có ảnh test thật trong repo) cho cả 2 khả năng: vision (LLaVA phân tích ảnh) và text-to-image (SDXL).

## Decision

**Chọn Replicate** (https://replicate.com) làm AI provider thật, tái dùng đúng 2 model version đã verify hoạt động ở `dizaine_deploy`:

- **Vision (phân tích ảnh phòng):** model LLaVA-13b (version `b5f6212d...`) — đọc thật nội dung ảnh người dùng upload, trả về mô tả ánh sáng/nội thất hiện có/tình trạng phòng.
- **Image generation (sinh không gian visualization):** model SDXL text-to-image (version `7762fd07...`) — prompt được xây dựng từ kết quả phân tích ảnh thật + phong cách/màu sắc/nội thất mong muốn của người dùng, không phải template cố định.

**Không dùng LLM để sinh danh sách nội thất/chi phí/bố trí.** Phần này (furniture list, cost breakdown, layout description) vẫn là **thuật toán xác định** (deterministic, phân bổ ngân sách theo tỷ lệ cố định) — quyết định có chủ đích, không phải hạn chế che giấu: một LLM có thể "bịa" ra số tiền/bố trí không nhất quán hoặc không cộng đúng tổng, trong khi thuật toán xác định luôn đúng và giải thích được. `decorDescription`/`aiExplanation` (text) được ghép từ input người dùng + kết quả phân tích ảnh thật — không phải LLM tự do sinh văn bản.

**Provider switch qua `homely.ai.provider`** (`mock` | `replicate`), giữ đúng pattern đã dùng ở `dizaine_deploy` (`AI_PROVIDER` env var). `MockAiDesignProvider` vẫn là default (`matchIfMissing = true`) — an toàn cho dev/test không cần key, không tốn phí. `ReplicateAiDesignProvider` chỉ activate khi `AI_PROVIDER=replicate`, và **fail fast lúc khởi động** (throw `IllegalStateException`) nếu thiếu `REPLICATE_API_KEY` — không âm thầm rơi về hành vi khác khi user đã chủ động chọn provider thật (khác với cách `dizaine_deploy` tự động fallback về mock khi thiếu key — Homely chọn cách minh bạch hơn, tránh user tưởng đang dùng AI thật nhưng thực ra là mock).

**Chưa cấu hình key thật trong `.env`** — người dùng sẽ tự cung cấp `REPLICATE_API_KEY` sau (mỗi lần generate tốn phí thật, ~$0.02–0.05/ảnh + phí LLaVA). Đã verify bằng unit test (fail-fast khi thiếu key, parse response Replicate) và regression test E2E với `AI_PROVIDER=mock` — **chưa verify E2E với API key thật** (cần key thật từ user để test).

## Consequences

- Được: tái dùng đúng model đã chứng minh hoạt động, không cần nghiên cứu/đoán model version mới; chi phí/lượt AI provider thật minh bạch (giới hạn gói Free/Pro ở module `billing` đã có sẵn từ trước sẽ tự động chặn lượt tạo vượt mức, kể cả khi dùng provider thật).
- Đánh đổi: ảnh sinh ra là "visualization được AI truyền cảm hứng từ ảnh gốc" (text-to-image, có phân tích ảnh thật đưa vào prompt), **không phải chỉnh sửa/inpaint trực tiếp lên ảnh gốc** (cần thêm model segmentation để tạo mask tự động — để trong backlog nếu cần nâng cấp).
- Rủi ro: Replicate model version có thể bị deprecate theo thời gian — nếu prediction trả lỗi "version not found", cần cập nhật version hash mới (xem `rules/ai/model-integration.md`).
- Chưa verify với key thật — task tiếp theo khi user cung cấp `REPLICATE_API_KEY` là chạy lại bộ test E2E với `AI_PROVIDER=replicate` thật.
