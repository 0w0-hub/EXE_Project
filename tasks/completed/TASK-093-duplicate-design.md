# TASK-093

## Title

Nhân bản phương án thiết kế (Design Duplicate / Snapshot)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 5 — ý tưởng "Design Duplicate/Snapshot" ChatGPT đề xuất. Vấn đề thật: `Room3DViewer.jsx` cho chỉnh sửa nội thất (thêm/xoá/di chuyển/đổi màu) nhưng CHỈ trong phiên xem (session-only, không persist — xem Known Issues trong `tasks/state/current-state.md`); nếu user muốn thử 1 phương án khác mà KHÔNG mất bản kết quả AI gốc, hiện không có cách nào — phải tạo phòng mới từ đầu và tốn lượt generate (giới hạn gói FREE).

**Phạm vi task này**: nhân bản Ở CẤP BACKEND (toàn bộ `DesignJob` + `DesignResult` + `DesignFurnitureItem` + `DesignColorPalette` thật, KHÔNG tính vào lượt generate mới vì không gọi AI lại) — KHÔNG phải nhân bản trạng thái chỉnh sửa tạm thời trong `Room3DViewer` (đó là vấn đề khác, TASK-007 backlog #3 "persist bố trí nội thất").

## Scope

### Backend

- Đọc kỹ trước khi viết: `backend/src/main/java/com/homely/api/aidesign/DesignJob.java`, `DesignResult.java`, `DesignFurnitureItem.java`, `DesignColorPalette.java`, và ĐẶC BIỆT `DesignResultWriter.java` (nơi các bản ghi này được TẠO LẦN ĐẦU khi job hoàn thành — dùng làm pattern tham khảo chính xác cho việc clone, không tự đoán cấu trúc).
- Thêm `POST /api/v1/designs/jobs/{jobId}/duplicate` (auth, chỉ chủ sở hữu job — theo đúng pattern check ownership đã dùng ở `DesignService`, job PHẢI đang `COMPLETED` mới nhân bản được, job khác trạng thái → lỗi rõ ràng):
  - Tạo `DesignJob` mới CÙNG `roomId`/`ownerId`/`preferenceId` với job gốc, `status = COMPLETED` NGAY (không qua hàng đợi generate — đây là sao chép, không phải tạo mới thật).
  - Clone toàn bộ `DesignResult` + `DesignFurnitureItem` + `DesignColorPalette` sang bản ghi mới gắn với `jobId` mới (KHÔNG chia sẻ chung bản ghi — sửa 1 trong 2 job (nếu sau này có tính năng sửa) không được ảnh hưởng job kia).
  - **KHÔNG tính vào giới hạn lượt tạo thiết kế theo gói** (đọc `BillingService`/chỗ check usage limit hiện có ở `DesignService.createJob` — hàm duplicate KHÔNG được gọi qua đường đó, phải là code path riêng không đụng usage counter).
  - Trả về `DesignJobResponse` của job MỚI (dùng lại DTO có sẵn).

### Frontend

- `frontend/src/pages/DesignResult.jsx`: thêm nút "⧉ Nhân bản để thử nghiệm" cạnh các nút chia sẻ/in đã có (đọc file trước, khối nút đã có sẵn từ TASK-024/078 — thêm additive). Gọi API, khi xong điều hướng sang trang kết quả của job MỚI (`/designs/{newJobId}`).
- `frontend/src/services/api.js`: thêm hàm gọi endpoint mới.

## Out of scope

- Không đụng `Room3DViewer.jsx` (không liên quan tới nhân bản trạng thái session-only đang chỉnh sửa).
- Không tính vào usage limit gói cước (xem Scope — bắt buộc, không phải tuỳ chọn).
- Không đụng `NavBar.jsx`, `Projects.jsx` trực tiếp (job mới tự động xuất hiện trong danh sách vì đã có thật trong DB, không cần sửa trang đó).

## Dependencies

`DesignResultWriter.java` (pattern tạo bản ghi kết quả), `DesignService` (pattern check ownership + usage limit hiện có, để BIẾT CÁCH TRÁNH đường usage limit khi viết hàm duplicate).

## Affected Services

Backend (`aidesign` module, thêm 1 endpoint + logic clone) + Frontend (`DesignResult.jsx` + `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Nhân bản 1 job `COMPLETED` thật → job mới có `status=COMPLETED` NGAY (không qua PENDING/PROCESSING), cùng `roomId`, dữ liệu kết quả (furniture/colors/decorDescription/estimatedCost...) giống hệt job gốc nhưng là bản ghi ĐỘC LẬP (khác `jobId`, khác `id` của từng furniture/color row — verify bằng cách so sánh 2 response JSON, id khác nhau, nội dung giống nhau).
- Nhân bản KHÔNG làm giảm số lượt generate còn lại trong tháng (verify bằng cách gọi lại endpoint usage/dashboard trước và sau, số liệu không đổi).
- Nhân bản job KHÔNG phải của mình (job user khác) → lỗi quyền truy cập, không nhân bản được.
- Nhân bản job chưa `COMPLETED` (PENDING/PROCESSING/FAILED) → lỗi rõ ràng.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`). Dùng `task077-tester@example.com` (có job `COMPLETED` thật) — CHÚ Ý tài khoản này đã dùng hết 5/5 lượt FREE trong tháng (xem log các round trước), ĐÚNG để verify "duplicate không tốn thêm lượt" (thử duplicate dù đã hết lượt generate mới — PHẢI vẫn thành công, vì đây không phải generate mới).
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.
- Báo cáo lại rõ: endpoint chính xác (path/method/response shape thật), có chặn đúng usage limit hay không (bằng chứng cụ thể).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`, đang 0/5 lượt còn lại): bấm "⧉ Nhân bản để thử nghiệm" ở trang kết quả → điều hướng đúng sang `/designs/{jobId mới}` → hiển thị đúng `COMPLETED` ngay lập tức, cùng nội dung decor/furniture như bản gốc. Gọi lại `GET /api/v1/usage/me` sau khi nhân bản qua UI thật → `used` KHÔNG tăng thêm (giữ nguyên số đã có từ lúc agent tự test trước đó) — xác nhận đúng hành vi "không tốn lượt" qua chính thao tác click UI, không chỉ qua curl của agent. Console sạch lỗi. Không phát hiện lỗi mới nào (khác lỗi thật agent đã tự tìm + sửa trong lúc làm — xem báo cáo: usage counter ban đầu đếm nhầm cả job nhân bản, đã sửa bằng cột `duplicated_from_job_id` + migration V6).
