# TASK-105

## Title

Chế độ xem trước chỉ đọc (Design Read-only Preview Mode)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 10 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 6 ngày 2026-09-17). Đụng trực tiếp `Room3DViewer.jsx` nên coordinator tự làm trực tiếp, KHÔNG giao agent (đúng quy ước đã giữ xuyên suốt dự án, ví dụ TASK-079/TASK-102). Vấn đề thật: mở trang kết quả thiết kế để XEM LẠI (không có ý định chỉnh sửa) vẫn dễ vô tình bấm nhầm nút thêm/xoá/đổi màu/kéo-thả — không có cách nào "khoá" các control chỉnh sửa mà vẫn xem được đầy đủ (camera, walkthrough, 2D/3D/sơ đồ, ngày/đêm).

## Scope

- `frontend/src/components/Room3DViewer.jsx`: state mới `previewMode` (boolean, mặc định `false` — GIỮ NGUYÊN hành vi cũ, không đổi trải nghiệm mặc định của bất kỳ ai đang dùng).
- Nút mới "🔒 Chế độ xem trước" / "🔓 Chế độ chỉnh sửa" (toggle) trên thanh công cụ 3D, cạnh nút "❓ Phím tắt".
- Khi `previewMode === true`, VÔ HIỆU HOÁ (disabled hoặc ẩn tuỳ loại control, không xoá code logic):
  - Toàn bộ nút "+ thêm loại đồ", nút nhân đôi/xoá từng món, nút "🧹 Xoá món tự thêm", nút "Đặt lại bố trí".
  - Toàn bộ swatch màu tường/sàn/trần + màu riêng món đang chọn (và nút "Mặc định" đi kèm).
  - Ô sửa giá món tự thêm (readOnly).
  - Kéo-thả bằng chuột (`onPointerDown` không bắt đầu `dragging` khi `previewMode`), nhấp đúp xoay 90°, phím mũi tên di chuyển, phím Q/E xoay 15°, phím Delete/Backspace xoá (đọc kỹ `onKeyDown`/`onPointerDown`/`onDoubleClick` trong effect dựng scene, thêm điều kiện chặn sớm bằng 1 ref `previewModeRef` đồng bộ từ state `previewMode` — dùng ref vì các handler này nằm trong closure của effect three.js, không tự đọc lại state mới nhất giữa các lần render như đã thấy ở pattern `rotateSelectedRef`).
  - Nút "↶ Hoàn tác"/"↷ Làm lại" (không cho thay đổi ngăn xếp lịch sử trong lúc xem trước, tránh nhầm lẫn giữa "xem" và "sửa").
- KHÔNG vô hiệu hoá (vẫn hoạt động bình thường trong preview mode): xoay/pan/zoom camera, chuyển tab 3D/2D/sơ đồ, "Nhìn từ trên"/"Góc nhìn đi bộ"/"Đặt lại góc nhìn"/"Tự động xoay 360°", "Buổi tối"/"Ban ngày", toàn màn hình, tải ảnh chụp, ẩn/hiện nhãn, bảng phím tắt, nhấp chọn 1 món để xem thông tin (KHÔNG cho phím mũi tên/Q-E/Delete tác động sau khi chọn).
- Chọn 1 món trong preview mode vẫn hiển thị đúng dòng trạng thái "Đã chọn ... " nhưng câu hướng dẫn đổi thành không nhắc tới phím tắt chỉnh sửa (điều chỉnh nhỏ trong đoạn text mô tả sẵn có).

## Out of scope

- Không lưu lựa chọn `previewMode` qua `localStorage`/backend — session-only, luôn về lại chế độ chỉnh sửa mặc định (`false`) khi mở trang mới, giống mọi state khác của `Room3DViewer` (session-only theo quyết định TASK-028/075).
- Không đụng đến TASK-102 (Undo/Redo) hay TASK-079 (Live Budget Guard) ngoài việc disable nút Hoàn tác/Làm lại — không đổi logic ngăn xếp/cảnh báo ngân sách.
- Không sửa file nào khác (`DesignResult.jsx`, `Projects.jsx`) — nút toggle nằm hoàn toàn trong `Room3DViewer.jsx`.

## Dependencies

TASK-004 (viewer gốc), TASK-040 (chọn+phím mũi tên), TASK-042 (Q/E xoay), TASK-052/054 (kéo-thả), TASK-102 (Undo/Redo, vừa hoàn thành cùng phiên).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Bật "🔒 Chế độ xem trước" → mọi nút chỉnh sửa liệt kê ở Scope đúng là `disabled`/không phản hồi; camera/tab/góc nhìn/ngày-đêm/toàn màn hình/chụp ảnh/ẩn nhãn vẫn hoạt động đúng như trước.
- Kéo chuột vào 1 món nội thất trong preview mode → KHÔNG di chuyển được (khác hẳn hành vi mặc định).
- Tắt lại về "🔓 Chế độ chỉnh sửa" → mọi control hoạt động lại bình thường, không hồi quy bất kỳ chức năng nào đã verify ở các task trước.
- Console sạch lỗi.

## Testing

Tự thực hiện trực tiếp (không qua agent) do đụng `Room3DViewer.jsx`. Verify: `npm run build` PASS → rebuild Docker (gộp chung 1 lần với TASK-103/104 sau khi cả 2 agent xong) → chạy lại bộ Playwright (TASK-098) làm regression check → verify E2E qua Claude in Chrome, đọc trực tiếp thuộc tính `disabled` qua `document.querySelector` (đáng tin cậy hơn suy luận từ ảnh chụp).

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS ngay từ lần đầu. Rebuild Docker đầy đủ cùng đợt với TASK-103/104. Chạy lại bộ Playwright TASK-098 làm regression check — 3/3 PASS. Verify E2E qua Claude in Chrome (`task077-tester@example.com`, job thật `c54b3649-...`):
- Bật "🔒 Chế độ xem trước" → nút đổi đúng thành "🔓 Chế độ chỉnh sửa"; kiểm tra qua `element.matches(':disabled')` (đáng tin cậy hơn thuộc tính IDL `.disabled` — vốn KHÔNG phản ánh trạng thái khoá kế thừa từ `<fieldset disabled>` cha, đã tự phát hiện + sửa cách kiểm tra khi test lần đầu cho kết quả sai) — xác nhận đúng cả nút "+ Ghế/sofa", nút xoá (✕), swatch màu tường đều `:disabled`.
- Bấm "+ Ghế/sofa" trong khi đang khoá → xác nhận KHÔNG có tác dụng thật (đếm số món trước/sau bằng nhau, đúng "4 món · 8.000.000 đ" cả 2 lần).
- Chuyển sang tab "Sơ đồ mặt bằng" trong khi đang khoá → vẫn hoạt động đúng (SVG render đúng) — xác nhận điều hướng/xem vẫn mở, chỉ chỉnh sửa bị khoá.
- Tắt lại "🔓 Chế độ chỉnh sửa" → nút "+ Ghế/sofa" hết `:disabled`, hoạt động lại bình thường.
- Console sạch lỗi xuyên suốt toàn bộ chuỗi thao tác.
- Không phát hiện lỗi mới nào (khác 1 lỗi PHƯƠNG PHÁP TEST của chính coordinator lúc verify — không phải lỗi app, đã tự phát hiện và sửa cách kiểm tra ngay trong lúc verify).
