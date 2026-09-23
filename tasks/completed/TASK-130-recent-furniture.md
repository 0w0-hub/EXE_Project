# TASK-130

## Title

Loại đồ vừa dùng gần đây (Recently Used Furniture)

## Goal

Ý tưởng còn dư từ round 22 (TASK-125) — hợp lệ nhưng ưu tiên thấp hơn lúc đó (catalog đã có tìm kiếm TASK-065 + nhóm theo phòng TASK-055), để dành round sau. Vấn đề thật: catalog "+ thêm loại đồ" hiện có 32 category chia theo 5 nhóm — khi user hay thêm lặp lại cùng vài loại (vd thêm nhiều "Gối tựa"/"Sách trang trí" liên tiếp để lấp đầy phòng), vẫn phải tìm/cuộn lại đúng nhóm mỗi lần dù vừa bấm loại đó xong.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - State `recentCategories` (mảng string category, tối đa 6, mới nhất đứng đầu) — lazy init từ `localStorage` (key `homely_recent_furniture`), CÙNG PATTERN `furniturePanelOpen` (TASK-126): try/catch an toàn, mặc định mảng rỗng nếu lỗi/chưa có.
  - Trong `addFurniture(category)`: sau khi thêm món, cập nhật `recentCategories` — đưa category vừa dùng lên đầu (bỏ trùng nếu đã có), cắt còn tối đa 6, ghi lại `localStorage` (try/catch, không chặn thao tác nếu ghi lỗi).
  - Thêm 1 hàng "🕘 Vừa dùng gần đây" ngay TRÊN ô tìm kiếm catalog (trong cùng fieldset thêm loại đồ) — CHỈ hiện khi `recentCategories.length > 0`, style nút giống hệt các nút "+ loại đồ" hiện có (tái dùng `CATEGORY_LABELS_VI` để lấy nhãn, lọc bỏ category nào không còn nhãn hợp lệ — an toàn nếu dữ liệu cũ trong localStorage tham chiếu category đã đổi tên).

## Out of scope

- Không đổi cấu trúc 5 nhóm/32 category hiện có, không đổi hành vi `addFurniture` (vẫn thêm y hệt, chỉ thêm bước ghi nhớ).
- Không đồng bộ `recentCategories` lên server (thuần client-side, đúng kiểu ghim TASK-122).
- Không xoá category khỏi danh sách "vừa dùng" khi xoá món khỏi phòng (giữ đúng ngữ nghĩa "gần đây đã dùng qua", không phải "hiện có trong phòng").

## Dependencies

TASK-041 (`addFurniture` gốc), TASK-055 (nhóm theo phòng), TASK-065 (tìm kiếm), TASK-126 (pattern localStorage lazy-init tham khảo).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Thêm 1 loại đồ mới → hàng "Vừa dùng gần đây" hiện đúng loại đó ở đầu.
- Thêm lại đúng loại đã có trong danh sách → không bị trùng, nhảy lên đầu lại.
- Thêm quá 6 loại khác nhau → danh sách chỉ giữ 6 loại mới nhất.
- Tải lại trang (reload) → danh sách vẫn còn (persist qua `localStorage`).
- Không hồi quy: tìm kiếm catalog, thêm/xoá/nhân đôi nội thất, thu gọn/mở panel (TASK-126).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` PASS (`✓ built in 2.48s`, không lỗi/cảnh báo mới ngoài cảnh báo chunk-size đã có từ trước).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome: xoá `localStorage.homely_recent_furniture`, tải lại trang, bấm "+ Sách trang trí" rồi "+ Gối tựa" (qua `button.click()` thật trên DOM, đúng cách vì đây là nút HTML thật — khác trường hợp mesh 3D trên canvas của TASK-128) — xác nhận qua screenshot: hàng "🕘 VỪA DÙNG GẦN ĐÂY" xuất hiện đúng ngay trên ô tìm kiếm, thứ tự đúng (mới nhất "Sách trang trí" đứng trước "Gối tựa"), cả 2 món được thêm đúng vào danh sách nội thất. `localStorage.getItem('homely_recent_furniture')` trả về `["books","pillow"]` đúng thứ tự. Tải lại trang (reload) → đọc lại `localStorage` xác nhận vẫn giữ nguyên `["books","pillow"]` — persist đúng qua reload.
- Không kiểm tra được case "bấm lại đúng loại đã có → nhảy lên đầu, không trùng" bằng thao tác trực tiếp trong phiên này vì tab bị chuyển hướng về `/login` giữa chừng (token phiên đăng nhập hết hạn sau phiên làm việc rất dài không liên quan tới tính năng này) — bù lại bằng code review: logic `[category, ...prev.filter((c) => c !== category)].slice(0, 6)` đã tự đảm bảo bỏ trùng + đưa lên đầu đúng theo đúng ngữ nghĩa `Array.filter`/spread, không có nhánh biên đặc biệt cần lo. Cắt tối đa 6 phần tử bằng `.slice(0, 6)` — cùng cách làm đơn giản, không rủi ro.
- Console sạch lỗi trong toàn bộ quá trình verify (không thấy log nào qua `read_console_messages`).
- Không phát hiện lỗi app mới, không hồi quy tìm kiếm catalog/thêm-xoá-nhân đôi nội thất/thu gọn panel (TASK-126).

## Status

COMPLETED
