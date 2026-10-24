# TASK-003

## Title

Chốt ADR-0003 (AI provider thật) + implement `ReplicateAiDesignProvider`

## Goal

Finalize ADR-0003 from PROPOSED to ACCEPTED (chọn Replicate) và implement provider AI thật (`ReplicateAiDesignProvider`) song song với `MockAiDesignProvider` đã có, theo pattern `homely.ai.provider` (`mock` | `replicate`) — không thay thế mock, chỉ thêm lựa chọn.

## Scope

- New: `aidesign/provider/replicate/` — `ReplicateClient` (HTTP client thuần `java.net.http.HttpClient`, không thêm dependency mới), `ReplicatePrediction`, `ReplicateException`, `ReplicateAiDesignProvider` (`@ConditionalOnProperty(homely.ai.provider=replicate)`).
- Modified: `DesignGenerationInput` (thêm `ownerId` để gắn asset kết quả cho đúng user), `DesignJobProcessor` (truyền `ownerId`), `AssetService` (thêm `storeGenerated`/`readBytes` cho luồng bytes thô, không qua `MultipartFile`).
- Config: `application.yml` (`homely.ai.provider`, `homely.ai.replicate.api-key`), `docker-compose.yml` (`REPLICATE_API_KEY`), `.env`/`.env.example` (placeholder rỗng — **không** set key thật, theo yêu cầu user).
- Docs: ADR-0003 (PROPOSED → ACCEPTED), `docs/decisions/README.md`, `docs/services/ai-design-service.md`, `rules/ai/model-integration.md`, `README.md` (mục "Bật AI provider thật" + cây thư mục).
- Model version tái dùng từ `dizaine_deploy` (đã verify hoạt động ở đó): LLaVA-13b (vision) cho phân tích ảnh phòng, SDXL (text-to-image) cho sinh ảnh visualization.
- Quyết định có chủ đích: furniture list/cost breakdown/layout description **không** dùng LLM — vẫn thuật toán xác định (lý do đầy đủ ở ADR-0003).

## Dependencies

- TASK-002 (billing/template/admin) — COMPLETED. Dùng `AssetService`/`DesignJobProcessor` đã có từ TASK-001/002.

## Affected Services

`aidesign` (provider mới), `asset` (thêm 2 method).

## Acceptance Criteria

- `mvn test` PASS toàn bộ (bao gồm test mới cho `ReplicateClient`/`ReplicateAiDesignProvider`, và test cũ `MockAiDesignProviderTest` cập nhật theo field mới).
- `AI_PROVIDER=replicate` mà thiếu `REPLICATE_API_KEY` → app fail fast lúc khởi động (`IllegalStateException`), không start im lặng ở mock.
- `AI_PROVIDER=mock` (default) — toàn bộ luồng cũ (register → tạo room → generate → poll) không bị ảnh hưởng bởi các thay đổi cấu trúc (`ownerId` field, `AssetService` mới).
- ADR-0003 status = ACCEPTED, ghi rõ lý do chọn Replicate + lý do không dùng LLM cho số liệu.

## Testing

- Unit test: `mvn test` — 12/12 PASS (2 Mock, 3 `ReplicateAiDesignProviderTest`, 7 `ReplicateClientTest`).
- Regression E2E qua Docker + curl với `AI_PROVIDER=mock` (không đổi): register → tạo room → generate → poll → COMPLETED, output đầy đủ như trước — xác nhận thay đổi cấu trúc không phá luồng cũ.
- **Chưa verify E2E với `AI_PROVIDER=replicate` + key thật** — user chủ động chọn tự cung cấp `REPLICATE_API_KEY` sau (xem lý do ở mục Ghi chú), nên phần gọi Replicate thật (network, parse response thật, download ảnh thật) mới chỉ được test bằng unit test (mock `AssetService`, không gọi network thật).

## Ghi chú quan trọng (quyết định của user)

Khi được hỏi có nên tái dùng API key Replicate/HuggingFace thật đã có sẵn trong `dizaine_deploy` để có thể test E2E ngay không, user chọn **"Tôi sẽ cung cấp key khác"** — tự cung cấp key riêng sau. Vì vậy:
- Không có giá trị API key thật nào được ghi vào `.env`/`.env.example`/`docker-compose.yml` của Homely.
- `AI_PROVIDER` giữ default `mock` trong mọi file config.
- Task này dừng ở mức "implement + unit test + fail-fast verify", **không** claim đã verify E2E live với Replicate — việc đó chuyển thành backlog item, chạy khi user cung cấp key.

## Status

COMPLETED (phần implement/docs/ADR) — phần verify E2E live với Replicate thật chuyển sang backlog, chờ user cung cấp `REPLICATE_API_KEY`.
