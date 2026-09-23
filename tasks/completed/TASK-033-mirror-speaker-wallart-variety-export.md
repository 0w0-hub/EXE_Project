# TASK-033

## Title

Thêm Gương/Loa, đa dạng tranh tường, tải ảnh chụp 3D, phóng to ảnh AI 2D

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Round này: thêm 2 loại đồ mới, đa dạng hoá tranh treo tường tự động, và 2 tiện ích xuất/xem ảnh (1 cho 3D, 1 cho 2D).

## Scope

- **2 loại đồ mới**: Gương (`bathroomMirror.glb`), Loa (`speaker.glb` + `speakerSmall.glb`, 2 biến thể) — thêm vào `CATEGORY_LABELS_VI`/`CUSTOM_FURNITURE_PRESETS`/`STATIC_FURNITURE_MODELS`/`PLAN_CATEGORY_COLORS` + `furnitureSize()` (furnitureLayout.js), dùng chung pipeline thêm/xoá đã có (TASK-028), không cần code UI mới.
- **Đa dạng tranh treo tường**: `makeWallArtTexture` nhận thêm tham số `pattern` (0/1/2 — vòng tròn lồng nhau / sọc ngang / vòng tròn đồng tâm lệch góc), chọn theo hash `roomId` (nhất quán với cách chọn biến thể model/decor đã có).
- **Tải ảnh chụp 3D**: nút "📷 Tải ảnh" cạnh nút toàn màn hình — chụp đúng góc nhìn/màu/nội thất hiện tại của canvas 3D (`canvas.toDataURL('image/png')`), cần bật `preserveDrawingBuffer: true` trên renderer để hoạt động ổn định.
- **Phóng to ảnh AI 2D**: click vào ảnh ở tab "Ảnh AI (2D)" mở lightbox toàn màn hình (overlay tối, click để đóng).

## Out of scope

- Không thêm "Rèm cửa"/"Cửa sổ" — model trong kit là dạng gắn liền tường (`wallWindow.glb`), không phù hợp hệ thống box-proxy đứng tự do hiện có; cần thiết kế riêng (out of scope round này).
- Không lưu ảnh chụp 3D lên server — chỉ tải về máy user (client-side, giống "In/Xuất PDF" TASK-024).

## Dependencies

TASK-032 (COMPLETED, cùng đợt tự động nâng cấp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS, đủ 3 model mới (`decor-mirror.glb`, `decor-speaker.glb`, `decor-speaker-2.glb`) trong `dist/furniture/`.
- 2 nút "+ Gương"/"+ Loa" hoạt động đúng qua panel có sẵn.
- `canvas.toDataURL('image/png')` trả về ảnh PNG hợp lệ, không rỗng/đen (xác nhận gián tiếp, không thực hiện hành động tải file thật trong phiên test tự động).
- Click ảnh AI 2D mở đúng lightbox, click lại đóng đúng.
- Console sạch lỗi.

## Testing

- Đọc JSON chunk 3 file `.glb` mới — xác nhận material name vẫn khớp quy ước chung (`wood/metal/glass/metalMedium`).
- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`):
  - Thêm Gương + Loa qua panel → zoom xác nhận cả 2 hiển thị đúng hình dạng, tách biệt (nhờ fix TASK-032, không bị đè bởi món khác).
  - **Không click thật nút "Tải ảnh"** (tránh kích hoạt hành động tải file thật trong phiên tự động mà không có yêu cầu rõ ràng của user cho từng lần) — verify gián tiếp bằng cách gọi `canvas.toDataURL('image/png')` trực tiếp qua JS, xác nhận độ dài data URL ~66KB (không rỗng/không phải canvas trắng).
  - Click ảnh AI 2D → lightbox mở đúng (overlay tối, ảnh phóng to) → click lại → đóng đúng.
  - Test "Đặt lại bố trí" sau khi thêm nhiều món (Gương/Loa) — về đúng 4 món gốc.
  - `read_console_messages(onlyErrors=true)` sạch lỗi xuyên suốt.

## Status

COMPLETED
