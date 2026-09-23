# TASK-005

## Title

2D: đổi sang model ControlNet giữ bố cục phòng thật (`rocketdigitalai/interior-design-sdxl`)

## Goal

Thay bước sinh ảnh 2D trong `ReplicateAiDesignProvider` từ text-to-image thuần (SDXL, bỏ qua ảnh gốc) sang model ControlNet giữ đúng tường/cửa sổ/bố cục phòng thật rồi chỉ đổi style — giải quyết hạn chế đã ghi trong ADR-0003 (Consequences) và `tasks/backlog/README.md` mục #2.

## Scope

- `ReplicateClient`: thêm `runAndWaitByModel(owner, name, input)` (gọi theo tên model, không cần version hash — vì không lấy được version hash đã verify của model mới); đổi `downloadImage` → `downloadBytes` (dùng chung cho ảnh/GLB sau này).
- `ReplicateAiDesignProvider`: thêm `redesignImage(roomPhotoBytes, prompt)` gọi `rocketdigitalai/interior-design-sdxl`; `generate()` dùng `redesignImage` khi có ảnh gốc, fallback `generateImage()` (text-to-image cũ) khi không có ảnh.
- ADR-0005 mới (`docs/decisions/`), cập nhật README ADR, `docs/services/ai-design-service.md`, `rules/ai/model-integration.md`, `tasks/backlog/README.md`.

## Giới hạn đã biết (ghi trước khi code)

- Tên field input (`image`, `prompt`) là **best-effort**, không lấy được OpenAPI schema xác thực từ Replicate (trang là SPA, không có API key để gọi `GET /v1/models/...`). Phải verify lại khi có `REPLICATE_API_KEY` thật.
- Không verify E2E network thật được trong task này.

## Dependencies

TASK-004 (COMPLETED).

## Affected Services

`aidesign` (provider + client).

## Acceptance Criteria

- `mvn test` PASS, không hồi quy Mock provider.
- Regression E2E Docker + `AI_PROVIDER=mock`: luồng cũ không đổi.
- ADR-0005 tạo mới, trạng thái ACCEPTED, ghi rõ giới hạn chưa verify.

## Testing

- `mvn test`: 12/12 PASS (không đổi hành vi Mock/test hiện có).
- Docker rebuild backend + `AI_PROVIDER=mock` (default): container start healthy, `GET /plans` 200 — xác nhận Spring context không lỗi sau khi đổi `ReplicateClient`/`ReplicateAiDesignProvider` (bean `ReplicateAiDesignProvider` không được load ở mock mode nên không ảnh hưởng runtime, chỉ cần đảm bảo compile đúng + context khởi động được).
- **Không verify được nhánh replicate thật** (redesignImage/runAndWaitByModel) — không có `REPLICATE_API_KEY`. Field input best-effort, xem ADR-0005.

## Status

COMPLETED
