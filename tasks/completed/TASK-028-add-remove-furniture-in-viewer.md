# TASK-028

## Title

Cho phép thêm/xoá nội thất trong lúc xem `Room3DViewer`

## Goal

Theo lựa chọn thứ 3 của user khi được hỏi hướng nâng cấp mô hình 3D — hiện tại chỉ kéo đổi vị trí được 4 món cố định (`seating/table/lighting/storage`), thêm khả năng tự thêm/bớt món nội thất trong lúc xem.

## Scope

`frontend/src/components/Room3DViewer.jsx`:

- State `localFurniture` — bản sao cục bộ của `furniture` prop (dữ liệu AI thật), đồng bộ lại qua `useEffect` khi prop đổi (job khác). Toàn bộ scene 3D (vị trí, model, nhãn, chi phí) chuyển sang đọc từ `localFurniture` thay vì `furniture` prop trực tiếp.
- `addFurniture(category)` — thêm 1 item mới vào `localFurniture` theo preset cố định (`CUSTOM_FURNITURE_PRESETS`, chi phí ước tính riêng, tên luôn có hậu tố "(mới thêm)" để không nhầm với dữ liệu AI thật).
- `removeFurniture(index)` — xoá theo index.
- UI: khối "Nội thất trong phòng" (danh sách + nút "✕" xoá từng món, 4 nút "+ <loại>" để thêm) đặt dưới bảng chọn màu, trên dòng hướng dẫn kéo-thả.
- Nút "Đặt lại bố trí" cập nhật thêm: reset cả `localFurniture` về đúng `furniture` prop gốc (huỷ mọi thêm/xoá tạm thời), không chỉ rebuild vị trí như trước.
- CSS mới: `.room3d-furniture-panel`, `.room3d-furniture-list`, `.room3d-furniture-remove`, `.is-custom` (nền nhạt khác cho món mới thêm, phân biệt với dữ liệu AI thật).

## Out of scope

- **Không đồng bộ lên trang cha** — bảng "Danh sách nội thất", "Chi phí dự kiến", "Phân bổ ngân sách" ở `DesignResult.jsx` vẫn đọc `job.result.furniture` gốc, không phản ánh thêm/xoá trong `Room3DViewer`. Nhất quán với hành vi đã có từ trước (kéo-thả đổi vị trí cũng không đồng bộ lên các bảng đó) — toàn bộ đều là "chỉ trong phiên xem, chưa lưu lại" đúng như thông báo hiện có.
- Không giới hạn số lượng món/category (cho phép nhiều món cùng category) — không thêm validate.
- Không đổi backend/API — hoàn toàn client-side, ephemeral.

## Dependencies

TASK-027 (COMPLETED, cùng đợt nâng cấp mô hình 3D).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Thêm 1 món qua nút "+ <loại>" → xuất hiện đúng trong danh sách (có hậu tố "(mới thêm)", nền phân biệt) và trong scene 3D (đúng model/vị trí/nhãn giá).
- Xoá 1 món qua nút "✕" → biến mất đúng khỏi danh sách và scene.
- Xoá hết toàn bộ (danh sách rỗng) → không crash, scene render phòng trống (còn đồ trang trí TASK-027) bình thường.
- "Đặt lại bố trí" sau khi thêm/xoá → khôi phục đúng về 4 món gốc từ AI.
- Không hồi quy: chuyển tab 2D/3D, kéo-thả, kéo-resize, bảng chọn màu.
- Console sạch lỗi ở mọi bước (thêm, xoá, xoá hết, reset).

## Testing

- Docker rebuild `frontend`, verify qua browser thật (job `1cb66743-...`):
  - Click "+ Ghế/sofa" → xác nhận "Ghế/sofa (mới thêm)" xuất hiện trong danh sách (nền xanh nhạt phân biệt) và 1 sofa thứ 2 xuất hiện đúng trong scene 3D (kèm nhãn giá).
  - Xoá đúng món vừa thêm qua nút "✕" → danh sách + scene về lại 4 món gốc.
  - Thêm "+ Bàn", sau đó bấm "Đặt lại bố trí" → xác nhận huỷ đúng món vừa thêm, về lại 4 món gốc (test riêng biệt cho hành vi reset mới).
  - Xoá lần lượt (qua `document.querySelector('.room3d-furniture-remove').click()` từng lần, tránh lỗi stale-DOM-ref khi dùng `querySelectorAll(...).forEach()` cùng lúc — đã tự phát hiện lỗi test methodology này khi 1 lần thử `forEach` chỉ xoá được 2/4 món do React re-render giữa các lần click) đến khi danh sách rỗng — xác nhận không crash, scene vẫn render đúng phòng trống + đồ trang trí.
  - `read_console_messages(onlyErrors=true)` sạch lỗi xuyên suốt toàn bộ chuỗi test trên.

## Status

COMPLETED
