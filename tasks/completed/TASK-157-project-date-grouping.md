# TASK-157

## Title

Nhóm danh sách Project theo thời gian tương đối (Hôm nay/Hôm qua/Tuần này/Cũ hơn)

## Goal

Ý tưởng từ ChatGPT round 32 (hỏi lần 9 trong cùng phiên chat), đã vét trước qua Explore agent, xác nhận CHƯA CÓ: `Projects.jsx` hiện chỉ SẮP XẾP (dropdown "Sắp xếp theo") chứ không NHÓM — danh sách vẫn là 1 khối liên tục, không có tiêu đề nhóm nào.

- **Nhóm theo thời gian tương đối**: chia danh sách hiển thị thành các nhóm "Hôm nay" / "Hôm qua" / "Tuần này" / "Cũ hơn" dựa trên `createdAt` (hoặc `updatedAt` nếu đang sắp xếp theo cập nhật — dùng ĐÚNG field đang dùng để sắp xếp hiện tại) đã có sẵn, KHÔNG cần API/dữ liệu mới.

## Scope

- `frontend/src/pages/Projects.jsx`:
  - Viết hàm `groupByRelativeDate(items, dateField)` tính nhóm cho từng item dựa trên chênh lệch ngày với `new Date()` hiện tại (Hôm nay: cùng ngày; Hôm qua: hôm trước; Tuần này: trong 7 ngày gần nhất KHÔNG tính Hôm nay/Hôm qua; Cũ hơn: còn lại).
  - Áp dụng cho CẢ 2 chế độ hiển thị (grid/list) — chèn tiêu đề nhóm (`<h3>`/tương đương) trước danh sách con của từng nhóm, CHỈ hiện nhóm nào thực sự có item (không hiện nhóm rỗng).
  - **Tương thích với pin/filter/search hiện có**: món đã ghim (`pinnedIds`, TASK-122) — kiểm tra kỹ hành vi hiện tại (pin có tách riêng lên đầu danh sách không, đứng ngoài mọi nhóm hay vẫn theo nhóm ngày của nó) và giữ nguyên logic đó, KHÔNG phá vỡ thứ tự ghim đã có. Danh sách sau khi filter/search vẫn nhóm đúng theo tập kết quả đã lọc (không nhóm dữ liệu chưa lọc).
  - Dùng field ngày ĐANG DÙNG để sắp xếp (`sort` state hiện có: `createdAt_desc/asc` → nhóm theo `createdAt`; `updatedAt_desc` → nhóm theo `updatedAt`; các lựa chọn sort khác không liên quan tới ngày, xem xét GIỮ NGUYÊN không nhóm/hoặc nhóm theo `createdAt` mặc định — quyết định hợp lý nhất khi implement, ghi rõ lý do).

## Out of scope

- Không thêm API/trường dữ liệu mới — chỉ dùng `createdAt`/`updatedAt` đã có sẵn trong response.
- Không đổi logic sort/filter/search/pin hiện có — chỉ THÊM lớp nhóm hiển thị bên trên kết quả đã có.

## Dependencies

`Projects.jsx` (`sort`/`pinnedIds`/`filteredItems`/`displayItems` hiện có).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Danh sách project hiện đúng tiêu đề nhóm theo ngày tương đối, chỉ hiện nhóm có item.
- Đổi "Sắp xếp theo" sang "Cập nhật gần đây" → nhóm tính lại theo `updatedAt` (không phải `createdAt` cũ).
- Gõ tìm kiếm lọc còn ít project hơn → nhóm vẫn đúng theo tập đã lọc (không hiện nhóm rỗng/sai).
- Không hồi quy: ghim (TASK-122), "Mở nhanh" (TASK-147), menu "⋮" (TASK-147), điều hướng bàn phím (TASK-148/154), "Tìm thấy X project"/Esc xoá chữ (TASK-152), phím "/" (TASK-150).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-158/159.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`. Agent thêm `groupByRelativeDate(items, dateField)` + `startOfDay` (hàm thuần cấp module), tách `pinnedDisplayItems`/`unpinnedDisplayItems` (món ghim tách hẳn thành nhóm "📌 Đã ghim" luôn đứng đầu, đứng NGOÀI mọi nhóm ngày — không bị nhóm ngày làm lu mờ dù cũ), `displaySections` gộp nhóm ghim (nếu có) + các nhóm ngày không rỗng, áp dụng cho cả grid/list qua `Fragment`. Field ngày dùng để nhóm bám theo `sort` hiện tại (`updatedAt` khi `updatedAt_desc`, còn lại `createdAt` — kể cả `roomType_asc`, quyết định hợp lý của agent, có ghi lý do).

**Agent tự phát hiện + xử lý đúng 1 rủi ro hồi quy không được nêu rõ trong task spec**: nhóm/ghim làm thay đổi THỨ TỰ hiển thị thật trên DOM, trong khi hệ thống điều hướng bàn phím (TASK-148/154) dựa vào index của `cardRefs` — nếu giữ nguyên index gốc từ `.map()` trước khi nhóm, Home/End/Arrow sẽ điều hướng sai. Agent tự suy ra và thêm `orderedDisplayItems` (làm phẳng `displaySections`) + `jobIndexById` Map để tính lại đúng index cuối cùng truyền vào `handleCardKeyDown`/`cardRefs`.

`npm run build` PASS. Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.

Verify E2E qua Claude in Chrome (tài khoản test):
- Mở `/projects`: header nhóm "Hôm nay" hiện đúng, gộp cả 2 project test (cùng ngày tạo) — không hiện nhóm rỗng nào khác.
- Nhấn `End` → focus nhảy đúng tới card cuối cùng theo THỨ TỰ HIỂN THỊ THẬT (không phải thứ tự dữ liệu gốc); `Home` → về card đầu. Xác nhận index remap của agent hoạt động đúng.
- Ghim 1 project → tách đúng vào nhóm "📌 Đã ghim" riêng, đứng đầu; bỏ ghim → quay lại đúng nhóm ngày gốc. Cả 2 chiều đều đúng.
- Đổi "Sắp xếp theo" → "Cập nhật gần đây" (`updatedAt_desc`) → nhóm tính lại theo `updatedAt`, không giữ nhóm cũ theo `createdAt`.
- Gõ tìm kiếm lọc còn ít project hơn → nhóm chỉ áp dụng trên tập đã lọc, không hiện nhóm rỗng/sai (xác nhận qua trực quan, tập test hiện tại nhỏ nên không có nhóm nào bị loại hoàn toàn để kiểm tra edge case "nhóm biến mất sau lọc" — chấp nhận rủi ro thấp, logic filter chạy trước group theo đúng thứ tự code).
- Không hồi quy: "Mở nhanh" (TASK-147), menu "⋮" (TASK-147), phím "/" (TASK-150), "Tìm thấy X project"/Esc xoá chữ (TASK-152) — tất cả test không lỗi trong cùng phiên verify.
- Console sạch lỗi trong toàn bộ quá trình.

## Status

COMPLETED
