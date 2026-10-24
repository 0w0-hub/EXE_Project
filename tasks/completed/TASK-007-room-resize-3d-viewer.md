# TASK-007

## Title

Room resize: kéo tường trong `Room3DViewer` để đổi kích thước phòng, persist qua API

## Goal

Cho phép user kéo tường phải/tường trước trong scene 3D để đổi `widthMeters`/`lengthMeters`, lưu lại vào `Room` qua endpoint mới (`PATCH /api/v1/rooms/{id}`).

## Scope

- Backend: `UpdateRoomRequest` DTO (validation `@DecimalMin/@DecimalMax` 1.0–20.0), thêm validation tương tự vào `CreateRoomRequest` (hiện thiếu hoàn toàn); `RoomService.updateDimensions()`; `RoomController` `@PatchMapping("/{id}")`.
- Frontend: `roomApi.update()`; `Room3DViewer` thêm 2 handle kéo (tường phải/trước) + wireframe preview khi kéo, commit khi thả (gọi API + callback `onRoomResized`); `DesignResult.jsx` truyền callback cập nhật state `room`.

## Out of scope

- Không tự sinh lại nội dung AI (ảnh/furniture/mô tả) khi đổi kích thước — chỉ Room record + scene 3D.
- Không hỗ trợ phòng không phải hình chữ nhật.

## Dependencies

TASK-006 (COMPLETED).

## Affected Services

`room` (endpoint mới), frontend (`Room3DViewer`, `DesignResult`).

## Acceptance Criteria

- `mvn test` PASS.
- E2E Docker + browser thật: kéo tường đổi kích thước → reload trang → kích thước mới vẫn giữ (persist đúng).

## Testing

- `mvn test`: 12/12 PASS.
- E2E thật qua Docker + browser (Claude in Chrome): kéo tường phải trong `Room3DViewer` (dispatch pointer event chính xác qua toạ độ chiếu camera tính bằng three.js thật — pixel-pick bằng ảnh chụp không đủ chính xác cho quả cầu nhỏ 0.15m) — hint hiển thị đúng "Đang chỉnh kích thước phòng: 6.3m × 3.0m" khi kéo; sau khi thả, `PATCH /api/v1/rooms/{id}` lưu đúng `widthMeters=6.3`; **reload trang xác nhận kích thước mới vẫn giữ** (fetch lại room, scene 3D render đúng tỉ lệ mới).
- Trong lúc debug, một lần kéo thử nghiệm sớm đã vô tình lưu kích thước phòng test về giá trị lạ (width=1.5 — đúng bằng MIN_ROOM_METERS, xác nhận clamp hoạt động đúng); đã dùng chính `PATCH` mới để reset về 5×3 — thêm một lần xác nhận độc lập rằng endpoint hoạt động đúng.
- Console sạch lỗi sau khi gỡ log debug.
- **Không cần** verify thêm gì liên quan Replicate — tính năng này không phụ thuộc AI provider.

## Status

COMPLETED
