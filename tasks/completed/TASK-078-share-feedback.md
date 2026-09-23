# TASK-078

## Title

Chia sẻ liên kết xem công khai (view-only) + bình luận để xin ý kiến (Share & Feedback)

## Goal

Tiếp tục vòng lặp tự động nâng cấp dự án (chưa dừng — xem `[[feedback_autonomous_3d_upgrade_loop]]` trong memory). User yêu cầu dùng Claude in Chrome hỏi ChatGPT ý tưởng nâng cấp rồi tự động thực hiện bằng nhiều agent, làm đến khi user báo dừng. Đã hỏi ChatGPT (phiên hội thoại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) 6 ý tưởng — chọn ý tưởng "Share & Feedback" (thu hẹp phạm vi so với đề xuất gốc: bỏ phần "vote A/B" và "biến feedback thành prompt AI" — để phạm vi hợp lý cho 1 task, thêm sau nếu cần). Vấn đề thật: thiết kế nội thất thường cần hỏi ý kiến người khác (vợ/chồng/gia đình/khách hàng) trước khi quyết định — hiện `DesignResult.jsx` đã có nút "chia sẻ" (TASK-024) nhưng chỉ copy URL trang kết quả, mà trang đó YÊU CẦU ĐĂNG NHẬP — người được chia sẻ (không có tài khoản Homely) không xem được.

## Scope

### Backend

- Đọc `backend/src/main/java/com/homely/api/template/` (module `template`) làm ví dụ cấu trúc 1 module đơn giản (Entity/Repository/dto/Controller/Service) trước khi viết — theo đúng layering đã có, không bịa pattern mới.
- Migration mới `backend/src/main/resources/db/migration/V4__design_share_comments.sql` (kiểm tra đúng V1/V2/V3 đã có trước khi đặt số, KHÔNG trùng số):
  - Thêm cột vào bảng design job hiện có (đọc `V1__init.sql`/entity `DesignJob` để biết đúng tên bảng/cột) — HOẶC bảng mới `design_share` (tự quyết định theo đúng chuẩn mực đã dùng trong migration cũ, ưu tiên bảng riêng để không đụng schema bảng job hiện có): `id UUID PK`, `job_id` (FK), `share_token` (UUID, UNIQUE, dùng làm khoá tra cứu công khai — KHÔNG dùng thẳng `job_id` làm khoá công khai để tránh lộ liên hệ trực tiếp tới ID nội bộ), `enabled BIT`, `created_at`.
  - Bảng `design_comment`: `id UUID PK`, `share_token` (hoặc `job_id`, tự quyết định theo thiết kế ở trên), `author_name NVARCHAR(100) NULL`, `message NVARCHAR(500) NOT NULL`, `created_at`.
- Module mới `backend/src/main/java/com/homely/api/sharing/` (package riêng, không nhét vào `aidesign` để giữ ranh giới module rõ ràng theo ADR-0002):
  - `POST /api/v1/designs/jobs/{jobId}/share` — yêu cầu đăng nhập + là chủ sở hữu job (theo đúng cách check ownership đã dùng ở `DesignService`/`RoomService`, KHÔNG viết lại logic check quyền khác kiểu). Idempotent: gọi lại nhiều lần trả về cùng 1 `shareToken` đã có (không tạo thêm bản ghi mới) nếu đã bật trước đó.
  - `DELETE /api/v1/designs/jobs/{jobId}/share` — tắt chia sẻ (set `enabled=false`, KHÔNG xoá bản ghi/comment — cho phép bật lại sau vẫn giữ lịch sử comment).
  - `GET /api/v1/public/shares/{shareToken}` — **PUBLIC, không cần đăng nhập** (thêm `permitAll()` cho pattern `/api/v1/public/**` trong `SecurityConfig.java`, đặt cạnh các `permitAll()` khác đã có). Trả về dữ liệu ĐỦ để hiển thị (ảnh AI 2D — asset ID, phong cách, màu sắc, danh sách nội thất, chi phí, kích thước phòng) nhưng KHÔNG trả thông tin định danh chủ sở hữu (không trả `userId`/email). 404 nếu token không tồn tại hoặc `enabled=false`.
  - `GET /api/v1/public/shares/{shareToken}/comments` — PUBLIC, danh sách comment (mới nhất trước).
  - `POST /api/v1/public/shares/{shareToken}/comments` — PUBLIC, thêm comment. Validate `message` bắt buộc, tối đa 500 ký tự (`@Size`), 404 nếu token không tồn tại/không `enabled`. Ghi chú rõ trong code (1 dòng comment) đây là MVP demo chưa có rate-limit/captcha chống spam — biết trước, chấp nhận được ở quy mô hiện tại, không phải lỗi bỏ sót.
  - Endpoint xem asset ảnh AI công khai: kiểm tra `AssetController`/`asset` module hiện có — nếu endpoint tải asset hiện tại yêu cầu auth, cần thêm 1 endpoint public riêng dùng `shareToken` để tải đúng ảnh của job đó (không được mở public TOÀN BỘ asset endpoint — chỉ ảnh thuộc đúng job đã bật share).

### Frontend

- `DesignResult.jsx`: đổi nút "chia sẻ" hiện có (TASK-024, hiện chỉ copy URL trang yêu cầu đăng nhập) — thêm lựa chọn "🔗 Tạo link chia sẻ công khai (xem + góp ý)" gọi API bật share, copy đúng URL public mới `/share/{shareToken}` vào clipboard, hiện thông báo đã copy. Không xoá nút chia sẻ URL nội bộ cũ (2 lựa chọn khác mục đích: 1 cho người có tài khoản, 1 cho người ngoài).
- Trang mới `frontend/src/pages/SharedDesign.jsx`, route `/share/:shareToken` — **KHÔNG dùng layout có NavBar yêu cầu đăng nhập**, là trang độc lập public (đọc `App.jsx` để biết cách 1 route không cần `ProtectedRoute` được khai báo, theo route `/login`/`/register` làm ví dụ). Hiển thị: ảnh AI 2D, phong cách/màu/chi phí/nội thất (đọc-only, không có nút chỉnh sửa 3D), danh sách bình luận + form thêm bình luận (tên tuỳ chọn + nội dung bắt buộc).
- `frontend/src/services/api.js`: thêm hàm gọi các endpoint mới (đọc file trước để theo đúng pattern các hàm hiện có — cách xử lý lỗi, cách gắn/không gắn Authorization header cho endpoint public).

## Out of scope

- Không làm "vote A/B" hay "AI biến comment thành prompt sửa thiết kế" (rút gọn từ đề xuất gốc của ChatGPT — để dành cho task sau nếu cần).
- Không rate-limit/CAPTCHA chống spam comment (ghi nhận là giới hạn đã biết trong `Known Issues`, không phải lỗi bỏ sót).
- Không sửa `Room3DViewer.jsx`/`CompareDesigns.jsx` (đang có agent khác làm song song trong cùng đợt — tránh xung đột file).
- Không thêm khả năng xoá/duyệt bình luận (không có UI kiểm duyệt) — nếu cần, thêm task riêng sau.

## Dependencies

Module `template` (pattern tham khảo), `DesignService`/`RoomService` (pattern check ownership), `AssetController` (pattern serve file), TASK-024 (nút chia sẻ hiện có ở `DesignResult.jsx`).

## Affected Services

Backend (module mới `sharing`, migration `V4`, đổi 1 dòng `SecurityConfig`) + Frontend (trang mới + đổi `DesignResult.jsx` + `api.js`).

## Acceptance Criteria

- `mvn test` PASS (unit test cho service mới nếu module khác trong dự án có thông lệ viết unit test — kiểm tra `backend/src/test/java` để theo đúng mức độ test đã có, không thêm ít hơn/nhiều hơn bất thường so với các module tương tự).
- `npm run build` PASS.
- Bật share cho 1 job → gọi lại API bật share lần 2 → xác nhận trả về CÙNG `shareToken` (không tạo bản ghi trùng — kiểm tra qua response, không cần query DB trực tiếp nếu không tiện).
- Mở `GET /api/v1/public/shares/{token}` KHÔNG có Authorization header (curl không header) → trả 200 + dữ liệu đúng, không có `userId`/email.
- Token không tồn tại/token của job đã tắt share → 404.
- Thêm bình luận qua API public → xuất hiện đúng trong danh sách khi GET lại.
- Trang `/share/:token` render được khi mở tab ẩn danh (không có JWT trong `localStorage`) — verify bằng cách tự xoá `localStorage` trong lúc test hoặc mở đúng URL không kèm token đăng nhập.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` (đủ 6 case ở Acceptance Criteria) — có thể tự tạo tài khoản/room/job mới qua API nếu cần (tài khoản test `task076-tester@example.com` cũng có sẵn 1 job COMPLETED từ trước, hoặc tự tạo tài khoản/job mới, `AI_PROVIDER=mock`).
- KHÔNG tự chạy `docker compose up`/rebuild Docker, KHÔNG dùng Claude-in-Chrome (agent điều phối sẽ gộp rebuild Docker + verify UI qua browser thật cho toàn bộ đợt nâng cấp này sau khi các agent song song hoàn thành).
- Báo cáo lại rõ: đã đổi những file nào, endpoint mới chính xác là gì (path + method + request/response shape thật), để agent điều phối verify UI đúng luồng.

## Status

COMPLETED

## Coordinator verification (sau khi agent implement xong)

Rebuild Docker (`docker compose up -d --build`, gộp chung với TASK-077/079) + verify E2E qua Claude in Chrome:
- Từ `DesignResult.jsx`, bấm "🔗 Tạo link chia sẻ công khai (xem + góp ý)" — xác nhận endpoint bật share hoạt động đúng (gọi lại qua curl idempotent, cùng `shareToken`).
- Mở `/share/{shareToken}` ở tab ĐÃ XOÁ `localStorage` (giả lập ẩn danh thật — `localStorage.clear()` rồi reload) — xác nhận: navbar đổi đúng thành "Đăng nhập/Đăng ký" (không phải menu đã đăng nhập), toàn bộ dữ liệu thiết kế (decor/bố trí/nội thất/màu/chi phí/giải thích AI) hiển thị đúng, KHÔNG có bất kỳ thông tin định danh chủ sở hữu nào (không userId/email) — khớp đúng acceptance criteria.
- Điền form góp ý ("Vo" / "Dep qua, nhung minh muon doi mau ghe sofa.") → bấm "Gửi góp ý" → xác nhận comment xuất hiện NGAY trong danh sách ("Góp ý (1)"), đúng tên + nội dung + thời gian, không cần tải lại trang, không cần đăng nhập.
- Console sạch lỗi xuyên suốt (`read_console_messages`, `onlyErrors: true`).
- **Phát hiện + sửa 1 lỗi thật lúc verify**: `SharedDesign.jsx` render `<img src={publicShareApi.assetUrl(shareToken)}>` VÔ ĐIỀU KIỆN kể cả khi `result.resultAssetId` là `null` (job mock provider không có ảnh thật) — endpoint asset trả 404, hiện icon ảnh vỡ (khác hẳn `DesignResult.jsx`/`CompareDesigns.jsx`, vốn đã có nhánh placeholder cho trường hợp này). Sửa bằng cách bọc điều kiện `result.resultAssetId ? <img .../> : <div className="room-card-photo-placeholder">🖼️</div>` — đúng pattern đã dùng ở 2 file kia; verify lại bằng screenshot xác nhận placeholder hiện đúng, căn giữa.
