# TASK-095

## Title

Tự động lưu bản nháp tạo phòng (Design Draft Autosave — thuần client-side)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 6 — ý tưởng "Design Draft Autosave" ChatGPT đã đề xuất ở round 5 (phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) nhưng chưa chọn làm. Vấn đề thật: điền form ở `RoomNew.jsx` khá dài (loại phòng, kích thước, ảnh, phong cách, màu sắc, nội thất mong muốn, ngân sách, text tự do) — refresh nhầm/mất mạng/đóng tab giữa chừng làm mất hết.

**Phạm vi**: CHỈ autosave form nhập liệu tạo phòng (`RoomNew.jsx`) — KHÔNG liên quan tới bản nháp chỉnh sửa nội thất trong `Room3DViewer` (khác vấn đề, đã có TASK-075 export/import JSON thủ công cho việc đó).

## Scope

- Đọc `frontend/src/pages/RoomNew.jsx` toàn bộ trước khi sửa (cùng file TASK-092 round trước đã thêm `RoomPresetBar` — đọc kỹ để KHÔNG xung đột logic, chỉ thêm tính năng mới bên cạnh).
- Component/hook mới `frontend/src/hooks/useDraftAutosave.js`: nhận `form` state + key lưu, tự động ghi vào `localStorage` (key riêng `homely_room_draft`, KHÁC hẳn key `homely_room_presets` của TASK-092 — 2 khái niệm khác nhau: preset là user CHỦ ĐỘNG lưu nhiều mẫu đặt tên, draft là tự động lưu 1 bản NHÁP GẦN NHẤT không cần thao tác) — debounce khoảng 800ms-1s sau mỗi lần user gõ, tránh ghi liên tục từng phím.
- Component nhỏ `frontend/src/components/DraftIndicator.jsx` (hoặc inline trong `RoomNew.jsx` nếu gọn hơn — tự quyết định): hiển thị trạng thái "Đã lưu nháp" / "Đang lưu..." gần khu vực form.
- Khi vào lại `/rooms/new` mà có draft cũ trong `localStorage` (VÀ form hiện tại đang trống — không ghi đè nếu user đã bắt đầu gõ gì đó thật trong phiên này): hiện banner nhỏ "Bạn có bản nháp chưa hoàn thành — [Khôi phục] [Bỏ qua]".
- Sau khi generate thiết kế THÀNH CÔNG (job tạo xong, điều hướng sang trang kết quả) → XOÁ draft (không còn lý do giữ nháp của 1 phòng đã tạo xong thật).

## Out of scope

- Không autosave lên backend (thuần `localStorage`, giống TASK-092).
- Không autosave ảnh đã chọn (`File` object không serialize được — giống lý do TASK-092 đã loại `photoFile` khỏi preset).
- Không đụng `RoomPresetBar.jsx`/logic preset đã có (TASK-092) — chỉ đọc để tránh xung đột, không sửa.
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `DesignResult.jsx`, `Projects.jsx`.

## Dependencies

`RoomNew.jsx` (form hiện có), TASK-092 (đã có `RoomPresetBar` trong cùng file — đọc để tránh xung đột, key `localStorage` phải khác).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Gõ vài field → đợi ~1-2s → chỉ báo đổi thành "Đã lưu nháp".
- Rời trang (điều hướng đi nơi khác) rồi quay lại `/rooms/new` → hiện banner khôi phục → bấm "Khôi phục" → form điền đúng lại như lúc rời đi.
- Bấm "Bỏ qua" → form trống bình thường, KHÔNG tự hiện lại banner ở lần vào tiếp theo (xoá draft khi user chủ động bỏ qua).
- Generate thiết kế thành công → draft bị xoá (vào lại `/rooms/new` sau đó không còn banner khôi phục cũ).
- Không hồi quy `RoomPresetBar` (TASK-092) hay luồng tạo phòng/generate hiện có.
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`): gõ "4.2" vào Chiều dài → đợi ~2s → xác nhận qua `localStorage.getItem('homely_room_draft')` đã lưu đúng giá trị. Điều hướng đi trang khác rồi quay lại `/rooms/new` → hiện đúng banner "Bạn có bản nháp chưa hoàn thành từ lần trước" → bấm "Khôi phục" → field điền lại đúng "4,2". Console sạch lỗi. Không phát hiện lỗi mới nào.
