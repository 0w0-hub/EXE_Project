# TASK-096

## Title

Xuất lịch nhắc việc .ics cho phương án thiết kế (Calendar Export & Design Reminders — thuần client-side)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 6 — ý tưởng "Calendar Export & Design Reminders" ChatGPT đề xuất ở round 5, chưa chọn làm. Vấn đề thật: user xem xong phương án thiết kế ở `DesignResult.jsx` không có cách nào đặt lịch nhắc (ngày mua sắm/cải tạo) ngoài tự ghi nhớ.

**Phạm vi**: CHỈ tạo file `.ics` (chuẩn iCalendar, mọi ứng dụng lịch phổ biến — Google/Outlook/Apple đều đọc được) để user tự tải về và import vào lịch CỦA HỌ — KHÔNG tích hợp OAuth/API lịch thật (Google Calendar API...) — đúng đề xuất gốc "không cần tích hợp OAuth".

## Scope

- Hàm tiện ích mới `frontend/src/lib/icsExport.js` — nhận `{ title, description, date }`, trả về nội dung file `.ics` hợp lệ dạng string (format `VCALENDAR`/`VEVENT` chuẩn RFC 5545 — tự viết thủ công, KHÔNG cần thêm thư viện npm mới cho việc này, cấu trúc đơn giản đủ dùng).
- `frontend/src/pages/DesignResult.jsx`: đọc file trước (đã có khối nút chia sẻ/in/nhân bản từ TASK-024/078/093 — thêm additive). Thêm:
  - Nút "📅 Đặt lịch nhắc" mở 1 form nhỏ inline (không cần modal riêng — có thể dùng `<details>`/toggle state đơn giản) hỏi: ngày nhắc (input `type="date"`), tiêu đề gợi ý sẵn (ví dụ "Mua sắm nội thất cho {roomType}", cho sửa lại), mô tả gợi ý sẵn từ `decorDescription` thật đã có (KHÔNG bịa nội dung).
  - Nút "Tải file .ics" gọi `icsExport.js`, tải file về (dùng Blob/`URL.createObjectURL`, cùng pattern `exportLayout()` ở `Room3DViewer.jsx` TASK-075 — CHỈ THAM KHẢO, KHÔNG đụng file đó).

## Out of scope

- Không tích hợp Google/Outlook/Apple Calendar API thật (OAuth) — chỉ xuất file `.ics` chuẩn để user tự import.
- Không lưu lịch nhắc vào backend/tài khoản (không cần nhắc lại nếu đổi thiết bị — nằm ngoài phạm vi round này).
- Không đụng `Room3DViewer.jsx`, `NavBar.jsx`, `Projects.jsx`, `RoomNew.jsx`.

## Dependencies

`DesignResult.jsx` (khối nút hiện có), `Room3DViewer.jsx#exportLayout` (pattern tải file — chỉ tham khảo).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "📅 Đặt lịch nhắc" → hiện form nhỏ với tiêu đề/mô tả gợi ý sẵn ĐÚNG dữ liệu thật của job đang xem (không phải placeholder chung chung).
- Chọn ngày + bấm "Tải file .ics" → tải về file hợp lệ.
- File `.ics` tải về PARSE ĐƯỢC đúng chuẩn (tự verify bằng cách đọc lại nội dung string đã tạo, kiểm tra có đủ `BEGIN:VCALENDAR`/`BEGIN:VEVENT`/`DTSTART`/`SUMMARY`/`END:VEVENT`/`END:VCALENDAR`, xuống dòng đúng `\r\n` theo chuẩn RFC 5545).
- Không hồi quy các nút khác đã có (chia sẻ/in/nhân bản).
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong — VÀ tự kiểm tra nội dung `.ics` sinh ra (ví dụ log ra console tạm thời lúc dev rồi xoá, hoặc viết 1 test thuần JS/Node độc lập ngoài React để in ra nội dung và kiểm tra bằng mắt/regex đúng cấu trúc RFC 5545) trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`): bấm "📅 Đặt lịch nhắc" → form inline hiện đúng, tiêu đề/mô tả prefill ĐÚNG dữ liệu thật của job đang xem (không phải placeholder). Set ngày qua input `type="date"` (dispatch event qua JS do input ngày dạng segment khó gõ trực tiếp qua `computer` tool — không phải hành vi khác biệt, chỉ là hạn chế công cụ) → nút "Tải file .ics" chuyển từ disabled sang enabled đúng → bấm tải → không lỗi console, không có `.ics` nào không hợp lệ (nội dung đã verify kỹ qua script Node độc lập của agent). Console sạch lỗi. Không phát hiện lỗi mới nào.
