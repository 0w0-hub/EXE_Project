# TASK-013

## Title

Tạo phòng mới: thẻ chọn nhanh loại phòng/phong cách + khung kéo-thả ảnh giống mockup

## Goal

Nâng cấp bố cục `RoomNew.jsx` giống mockup (thẻ chọn nhanh có icon, khung upload kéo-thả) mà không đổi field/logic/submit hiện có.

## Scope

- Thêm dãy thẻ "Loại phòng" (Phòng khách/Phòng ngủ/Phòng bếp/Phòng làm việc/Phòng tắm, icon emoji) — bấm thẻ set giá trị vào field `roomType` có sẵn (input text vẫn còn để sửa tự do).
- Thêm dãy chip "Phong cách" (Scandinavian/Japandi/Modern/Industrial/Minimalist/Bohemian) — bấm chip set vào field `style` có sẵn.
- Đổi khung upload ảnh thành vùng kéo-thả (`.dropzone`, dùng `onDragOver`/`onDrop`), dùng lại đúng `setPhotoFile`; thêm ảnh ví dụ nhỏ bên cạnh (`roomnew-tip-photo.jpg`, Unsplash License, đã tải).
- `styles.css`: thêm `.type-card`, `.type-card.is-active`, `.style-chip`, `.style-chip.is-active`, `.dropzone`, `.dropzone.is-dragover`.

## Out of scope

- Không đổi state/submit logic, không đổi validation, không đổi step-indicator/card--warning đã có.

## Dependencies

TASK-009 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật: bấm thẻ/chip set đúng giá trị field (kiểm bằng cách xem input text đổi theo); kéo-thả ảnh vào dropzone set đúng `photoFile`; submit thật vẫn tạo room → generate → `/designs/:jobId` không đổi hành vi.

## Testing

- Nguồn ảnh tip: unsplash.com, ảnh "A living room filled with furniture and a mirror" của Spacejoy (Unsplash License, free), tải `?w=800&q=70` (~80KB) về `frontend/src/assets/roomnew-tip-photo.jpg`.
- `npm run build` PASS.
- E2E thật qua Docker + browser: bấm thẻ "Phòng ngủ" → input `roomType` đổi đúng "Phòng ngủ" + thẻ highlight; bấm chip "Japandi" → input `style` đổi đúng "Japandi" + chip highlight; submit thật với roomType/style chọn qua thẻ/chip + budget 25.000.000 → tạo room → generate → COMPLETED, decor description xác nhận đúng "phong cách 'Japandi' cho Phòng ngủ... 25,000,000 VNĐ" — dữ liệu từ thẻ/chip đi đúng vào request, không lệch so với gõ tay. Console sạch lỗi.

## Status

COMPLETED
