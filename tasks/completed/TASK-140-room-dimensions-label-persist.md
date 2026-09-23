# TASK-140

## Title

Hiện kích thước phòng thường trực + nhớ trạng thái "Ẩn nhãn"

## Goal

2 ý tưởng từ ChatGPT round 23 (round hỏi ý tưởng lần 23). Đã vét trước 4 ý tưởng khác cùng batch — loại cả 4 TRƯỚC KHI giao việc:
- "Tên phòng trên viewport" — giá trị thấp/dư thừa 1 phần: tên thiết kế đã hiện RÕ ở tiêu đề `<h2>` đầu trang `DesignResult.jsx` (TASK-134, click để đổi tên) VÀ ở tiêu đề tab trình duyệt (TASK-120, "Dynamic Browser Title") — 2 nơi đã phủ đúng nhu cầu "biết đang xem thiết kế nào". Thêm nhãn thứ 3 nhỏ ở góc khung 3D giá trị gia tăng thấp so với công sức.
- "Nút Copy tên Design" — XUNG ĐỘT trực tiếp: đọc lại code xác nhận click vào tên design ĐÃ dùng để vào chế độ SỬA TÊN inline (TASK-134, round 28) — không thể vừa "click để sửa" vừa "click để copy" trên cùng 1 phần tử mà không phá vỡ 1 trong 2 hành vi.
- "Loading progress cho 3D assets" — premise sai: đọc code xác nhận khung hình 3D KHÔNG BAO GIỜ trống lúc tải — khối hộp proxy (`mesh`) được thêm vào scene NGAY LẬP TỨC (đồng bộ) trước khi bắt đầu tải model GLTF bất đồng bộ, luôn có placeholder hiển thị. Model CC0 nhỏ cũng tải gần như tức thời trong thực tế (chưa từng thấy trạng thái tải chậm qua rất nhiều lần verify trong suốt dự án).
- "Confirmation khi xoá Design/Project từ danh sách" — ĐÃ CÓ ĐÚNG theo điều kiện ChatGPT tự đặt ra ("chỉ nên làm nếu hiện tại behavior tương ứng chưa có"): đọc code xác nhận đây là QUYẾT ĐỊNH THIẾT KẾ CÓ CHỦ ĐÍCH — xoá từ `Projects.jsx` là xoá MỀM (vào thùng rác, khôi phục được) nên CỐ TÌNH không xác nhận (comment code ghi rõ lý do); xoá VĨNH VIỄN ở `Trash.jsx` đã có `window.confirm` từ TASK-107. Thêm xác nhận cho thao tác mềm/khôi phục được sẽ tạo ma sát thừa, đi ngược quyết định đã có.

- **Hiện kích thước phòng thường trực**: hiện "Rộng × Dài" (và diện tích) ngay trên khung 3D — hiện tại CHỈ hiện tạm thời lúc đang kéo-resize phòng (`previewDims`), không có gì hiển thị khi không resize.
- **Nhớ trạng thái "Ẩn nhãn"**: `showLabels` (TASK-063) hiện không persist qua `localStorage` — mỗi lần tải lại trang luôn về mặc định "hiện nhãn", dù user đã chủ động tắt trước đó.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Trong khối text hiện trạng thái dưới toolbar (`previewDims ? ... : selectedFurnitureIndex != null ? ... : ...`, đọc lại toàn bộ chuỗi `? :` hiện có TRƯỚC khi sửa): thêm 1 nhánh MỚI hiện "📐 Kích thước phòng: {width}m × {length}m (diện tích {width×length} m²)" khi KHÔNG đang resize (`!previewDims`) VÀ KHÔNG có món nào đang chọn (giữ nguyên toàn bộ các nhánh ưu tiên hiện có — resize > món đang chọn > preview mode > mặc định — chỉ thêm nhánh mới vào đúng vị trí "mặc định" cuối chuỗi, không đổi thứ tự ưu tiên).
  - `showLabels`: đổi `useState(true)` thành lazy-init đọc `localStorage` (key `homely_show_labels`), ĐÚNG PATTERN `furniturePanelOpen` (TASK-126)/`viewMode` (TASK-119) — try/catch an toàn. Hàm `toggleLabels()` mới thay cho `setShowLabels((prev) => !prev)` trực tiếp trong `onClick` — ghi lại `localStorage` mỗi lần đổi.

## Out of scope

- 4 ý tưởng đã loại ở mục Goal.
- Không đổi các toggle khác đang cố tình KHÔNG persist (`showRoomSurfaces`, `wireframeMode`, `cameraSpeed`, `shadowsEnabled`, `brightnessLevel`, `decorOnlyMode`) — quyết định giữ nguyên "phiên xem hiện tại" cho các tính năng đó vẫn đúng, chỉ `showLabels` được nâng lên persist vì đây là preference lâu dài hợp lý hơn (giống tinh thần `ThemeToggle`/`FontSizeControl`).

## Dependencies

TASK-007 (`previewDims`, chuỗi trạng thái hiện có), TASK-063 (`showLabels` gốc), TASK-126/119 (mẫu lazy-init localStorage).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Mở tab 3D, KHÔNG resize/KHÔNG chọn món → hiện đúng "📐 Kích thước phòng: Xm × Ym (diện tích Z m²)".
- Bắt đầu kéo-resize → dòng trên đổi đúng sang "Đang chỉnh kích thước phòng..." như cũ (không hồi quy).
- Chọn 1 món → dòng trên đổi đúng sang thông tin món đã chọn như cũ (không hồi quy).
- Bấm "🏷️ Ẩn nhãn" → tải lại trang → vẫn ở trạng thái đã ẩn (persist đúng qua `localStorage`).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- **Phát hiện + sửa 1 rủi ro lúc code (trước khi build)**: bản nháp đầu tiên viết thẳng `width.toFixed(1)`/`length.toFixed(1)` trong nhánh mới, giả định 2 biến này có sẵn ở JSX — đọc lại code xác nhận `width`/`length` CHỈ tồn tại cục bộ bên trong effect dựng scene (và trong 1 component KHÁC, `Room2DPlan`, không liên quan), KHÔNG có ở scope JSX của nhánh text trạng thái (sẽ lỗi `ReferenceError: width is not defined` lúc chạy). Sửa bằng cách tính lại `roomWidth`/`roomLength` tại chỗ trong 1 IIFE, dùng đúng công thức `room?.widthMeters > 0 ? ... : DEFAULT_SIZE_METERS` đã dùng xuyên suốt file.
- `npm run build` PASS (`✓ built in 2.55s`).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome trên job đã tạo trước đó (đăng nhập lại do session hết hạn sau rebuild):
  - **Kích thước phòng**: mở tab 3D, không resize/không chọn món → đọc DOM xác nhận đúng "📐 Kích thước phòng: 4.0m × 5.0m (diện tích 20.0 m²) — ..." khớp đúng phòng 4×5m đã tạo, phần hướng dẫn thao tác cũ vẫn còn nguyên phía sau.
  - **Nhớ "Ẩn nhãn"**: xoá `localStorage` liên quan → xác nhận nút hiện "🏷️ Ẩn nhãn" (mặc định hiện nhãn). Bấm → `localStorage.getItem('homely_show_labels')` đúng `"false"`. Tải lại trang THẬT (navigate lại) → nút hiện đúng "🏷️ Hiện nhãn", screenshot xác nhận KHÔNG có nhãn tên/giá nổi trên bất kỳ món nào — persist đúng qua backend/localStorage thật, không phải chỉ state React tạm.
  - **Không hồi quy**: chọn 1 món → dòng trạng thái đổi đúng sang "Đã chọn ... phím mũi tên để di chuyển..." như cũ.
- Console sạch lỗi trong toàn bộ quá trình verify.
- Không phát hiện lỗi app mới.

## Status

COMPLETED
