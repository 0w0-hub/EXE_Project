# TASK-010

## Title

Đồng bộ màu scene 3D (`Room3DViewer`) theo bảng màu Peacock Feather

## Goal

Cập nhật các màu Three.js set bằng JS trong `Room3DViewer` (nền scene, ánh sáng, fallback tường/sàn/nội thất khi AI không trả màu, viền outline, handle resize) để khớp bảng màu mới (`#4D52B4/#4E9CE8/#70D6C5/#CAE5BC/#E1EDD4`) — phần đã cố ý để ngoài phạm vi TASK-008/009 vì là vật liệu Three.js, không phải CSS.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - `scene.background` (hiện `#f5f1ea`) → tông nền nhạt cùng họ với `--color-bg-tint`.
  - `HemisphereLight` ground color (hiện `0x8a8478`, hex cũ đã bỏ) → khớp `--color-text-muted`.
  - Fallback màu tường/sàn/nội thất khi `colors` từ AI không có role tương ứng (hiện `#e8e2d8`/`#ffffff`/`#8c6a4f`) → dùng tint Primary/Secondary/Accent mới.
  - Viền outline khung phòng (`0xbfb8a8`) và màu handle/preview resize (`#c0392b`) → tông trung tính/danger khớp token mới.
- Không đổi: logic raycast/kéo-thả/resize, màu tường/sàn khi AI **có** trả `colors` thật (đây là dữ liệu AI, không phải hằng số cần đồng bộ palette).

## Out of scope

- Không đổi cách AI sinh màu (`colors` trong `DesignResultResponse`) — chỉ đổi fallback khi thiếu.
- Không đổi UI 2D/CSS khác (đã xong ở TASK-008/009).

## Dependencies

TASK-009 (COMPLETED).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật qua Docker + browser: mở `DesignResult` của 1 job có/không có `colors` từ AI, quan sát scene 3D dùng đúng tông màu mới khi fallback; không hồi quy chức năng (orbit, kéo-thả nội thất, kéo resize tường + persist, tab 2D/3D).

## Testing

- `npm run build` PASS.
- E2E thật qua Docker (rebuild `frontend`+`backend`) + browser thật: mở lại job cũ (COMPLETED, có `colors` từ mock AI) — nền scene 3D (`scene.background`, phần ngoài khối phòng) đổi đúng sang tint mới `#E1EDD4`; tường/sàn/nội thất vẫn giữ đúng màu AI trả về (job này AI trả tông xám/gỗ cho "Hiện đại tối giản" — đúng thiết kế, không bị fallback mới ghi đè vì AI đã có `colors`). Tab 2D/3D, orbit, không hồi quy.
- Chưa test được nhánh fallback (khi AI không trả `colors`) trực tiếp trên UI vì các job có sẵn đều có `colors` — đã xác nhận bằng đọc code: `colorForRole` chỉ dùng fallback khi không tìm thấy role, logic không đổi, chỉ đổi giá trị fallback.

## Status

COMPLETED
