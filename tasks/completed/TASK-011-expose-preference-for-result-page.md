# TASK-011

## Title

Backend: expose `preferenceId` + endpoint lấy lại preference thật cho trang Kết quả thiết kế

## Goal

Cho phép frontend (trang `DesignResult`) lấy lại đúng sở thích/yêu cầu thật (`RoomPreference`) đã lưu khi tạo phòng, để hiển thị checklist "yêu cầu đặc thù" bằng dữ liệu thật (TASK-015), không bịa.

## Scope

- `DesignJobResponse` (record): thêm field `preferenceId` (UUID, nullable), truyền qua từ `job.getPreferenceId()` ở cả `pending()` và `withResult()`.
- `RoomController`: thêm `GET /api/v1/rooms/{roomId}/preferences/{preferenceId}` — check quyền sở hữu room qua `roomService.getOwned()`, lấy preference qua `roomService.getPreference()` (đã có sẵn), validate `preference.getRoomId().equals(roomId)` (404 nếu lệch).
- `frontend/src/services/api.js`: thêm `roomApi.getPreference(roomId, preferenceId)`.

## Out of scope

- Không đổi `DesignJobSummaryResponse` (list Projects/Admin không cần preference).
- Không đổi UI (TASK-015 dùng field/endpoint này).

## Dependencies

TASK-010 (COMPLETED).

## Affected Services

Backend (`aidesign`, `room`), frontend `services/api.js`.

## Acceptance Criteria

- `mvn test` PASS.
- `curl` thật: lấy đúng preference của 1 job/room thuộc chính user; user khác gọi vào room không phải của mình → 403; preferenceId không khớp roomId → 404.

## Testing

- `mvn -o clean test`: 12/12 PASS (compile sạch, không có test nào giả định số field cũ của `DesignJobResponse`).
- E2E thật qua Docker (`docker compose up -d --build backend`) + `curl` với JWT thật:
  - `GET /api/v1/designs/jobs/{id}` nay trả đúng `preferenceId` (trước đây không có field này).
  - `GET /api/v1/rooms/{roomId}/preferences/{preferenceId}` đúng chủ sở hữu → 200, đúng dữ liệu preference thật (job test cụ thể có preference toàn field null vì lúc tạo không điền — xác nhận đúng hành vi trả về null, không giả lập).
  - `preferenceId` sai (random UUID) trên đúng room của mình → 404.
  - Tài khoản khác (đăng ký mới `second-tester@homely.dev`) gọi vào room không phải của mình → 403.

## Status

COMPLETED
