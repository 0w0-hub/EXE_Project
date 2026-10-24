# TASK-123

## Title

Ghi chú nhanh cho thiết kế (Quick Notes) + phóng to ảnh phòng gốc

## Goal

Round 20 (cùng batch ChatGPT với TASK-122 — xem Goal ở đó để biết đầy đủ 6 ý tưởng + lý do loại "Duplicate Design"/2 ý tưởng đụng `Room3DViewer.jsx`). Gộp 2 ý tưởng CÙNG đụng `frontend/src/pages/DesignResult.jsx` thành 1 task cho 1 agent (tránh xung đột 2 agent song song cùng sửa 1 file — đúng bài học đã áp dụng nhiều lần, vd round 10/11/15):

**Phần A — "Quick Notes cho Design"**: vấn đề thật — đã grep xác nhận `DesignJob.java` KHÔNG có field nào dạng ghi chú tự do; user không có chỗ ghi lại ý định tạm thời (vd "đổi sofa", "xem lại màu tường trước khi chốt") gắn với 1 thiết kế cụ thể, phải nhớ trong đầu hoặc ghi ở nơi khác ngoài app. Quyết định kiến trúc: lưu SERVER-SIDE (không phải `localStorage`) vì ghi chú nên đồng bộ được giữa các thiết bị/phiên đăng nhập khác nhau — đúng tinh thần đã áp dụng cho "Đặt tên thiết kế" (TASK-106, cũng là 1 chuỗi ngắn user tự nhập, cùng khái niệm "metadata cá nhân gắn theo job"). Theo ĐÚNG pattern `customName` đã có, không phát minh cách làm mới.

**Phần B — "Image Lightbox cho ảnh phòng gốc"**: đã kiểm tra code — `Room3DViewer.jsx` ĐÃ có lightbox (dòng ~2512-2524, state `imageLightboxOpen`) nhưng CHỈ áp dụng cho tab "Ảnh AI (2D)". Ảnh phòng GỐC (`room.photoAssetId`, hiển thị trong khối Trước/Sau ở `DesignResult.jsx`, TASK-015) KHÔNG có cách phóng to — chỉ xem được ở kích thước nhỏ trong slider so sánh. Vấn đề thật, không trùng lặp tính năng đã có.

**Vị trí neo KHÔNG chồng lấn trong `DesignResult.jsx`** (đọc kỹ toàn file trước khi sửa, giữ đúng 2 vị trí tách biệt rõ ràng):
- Phần A: thêm khối MỚI (không có vị trí tương đương trước đó) — đặt gần khối "🔧 Thông tin kỹ thuật" (TASK-115) hoặc ngay trên nó.
- Phần B: chỉ thêm `onClick`/state lightbox vào ĐÚNG khối Trước/Sau đã có (biến `beforeUrl`, dòng ~34) — không đụng bất kỳ phần nào khác.

## Scope

- `backend/src/main/resources/db/migration/V11__design_job_note.sql` (migration mới, pre-assign số hiệu TRƯỚC khi code để tránh xung đột nếu có agent khác cùng round cần migration — round này KHÔNG có agent nào khác cần, nhưng vẫn giữ đúng quy ước dự án): thêm cột `note NVARCHAR(500) NULL` vào bảng `design_jobs`.
- `backend/src/main/java/com/homely/api/aidesign/DesignJob.java`: thêm field `note` (String, nullable) — đúng cách `customName` đã làm.
- `backend/src/main/java/com/homely/api/aidesign/DesignJobRepository.java`: KHÔNG cần method mới nếu chỉ set/đọc qua entity trực tiếp (kiểm tra lại cách `customName` đã làm — nếu `customName` cũng không cần method riêng thì `note` cũng vậy, giữ nhất quán).
- `backend/src/main/java/com/homely/api/aidesign/DesignService.java`: thêm method `setNote(UUID userId, UUID jobId, String note)` — đúng cấu trúc `setCustomName` (ownership check qua `getOwnedJob`, gửi rỗng/khoảng trắng → set `null` xoá ghi chú, giới hạn độ dài 500 ký tự nếu `customName` cũng có giới hạn tương tự thì dùng chung logic).
- `backend/src/main/java/com/homely/api/aidesign/DesignController.java`: endpoint mới `PATCH /api/v1/designs/jobs/{jobId}/note`, body `{ note: string }` — đúng cấu trúc endpoint `rename` (dùng `RenameDesignJobRequest` làm mẫu, tạo `UpdateNoteRequest` tương tự).
- `backend/src/main/java/com/homely/api/aidesign/dto/DesignJobResponse.java` + `DesignJobSummaryResponse.java`: thêm field `note` vào response (đúng cách `customName` đã thêm ở cả 2 DTO).
- `frontend/src/pages/DesignResult.jsx` (Phần A): khối nhỏ mới trên trang kết quả — ô nhập text ngắn (không phải textarea lớn, giữ đúng tinh thần "ghi chú nhanh") hiển thị/sửa `note`, lưu qua `onBlur` (đúng pattern TASK-046 đã dùng cho sửa giá — tránh gọi API mỗi phím gõ).
- `frontend/src/services/api.js` (hoặc file tương đương chứa `designApi`): thêm hàm gọi endpoint mới.
- `frontend/src/pages/DesignResult.jsx` (Phần B): state `originalPhotoLightboxOpen` mới (cùng pattern `imageLightboxOpen` đã có trong `Room3DViewer.jsx` — đọc lại code đó trước khi làm để nhất quán: overlay toàn màn hình, đóng bằng click nền HOẶC phím Esc, `role="button"`/`tabIndex`/`aria-label`). Ảnh gốc (`beforeUrl`) trong khối Trước/Sau: thêm `onClick` mở lightbox, `cursor: zoom-in`. Không bắt buộc tách thành component riêng cho đúng 1 chỗ dùng (nguyên tắc "3 dòng giống nhau tốt hơn abstraction sớm" của `CLAUDE.md`) — copy đúng cấu trúc JSX/CSS class đã có ở `Room3DViewer.jsx` là đủ.

## Out of scope

- Không hiện `note` ở `Projects.jsx`/list (chỉ ở trang kết quả) — có thể mở rộng sau nếu cần.
- Không thêm rich text/markdown cho note — chỉ 1 dòng text thuần, giới hạn độ dài.
- Không thêm zoom kéo-thả/pan trong lightbox ảnh gốc — chỉ phóng to xem full, giống đúng lightbox AI 2D đã có.
- Không đụng `Room3DViewer.jsx` (chỉ đọc tham khảo cấu trúc lightbox có sẵn, không sửa file đó).
- Không áp dụng lightbox cho `Trash.jsx`/`CompareDesigns.jsx`/`SharedDesign.jsx`.

## Dependencies

TASK-106 (Design Naming Assistant — `customName`, pattern gốc để tái dùng nguyên cấu trúc).

## Affected Services

Backend (`aidesign` module) + Frontend (`DesignResult.jsx`).

## Acceptance Criteria

- Migration chạy được, không xung đột với `V10__design_job_soft_delete.sql` đã có.
- `PATCH /designs/jobs/{jobId}/note` — verify qua curl đủ 3 case: chủ sở hữu đúng → 200 lưu đúng; gửi rỗng → xoá về `null`; user khác cố sửa → 403.
- `npm run build` (frontend) PASS.
- Nhập ghi chú trên trang kết quả → rời khỏi ô nhập (blur) → lưu thật qua backend; tải lại trang → ghi chú vẫn còn (persist thật, không phải state cục bộ).
- Click ảnh gốc trong khối Trước/Sau → phóng to toàn màn hình đúng ảnh đó (không lẫn ảnh AI); đóng bằng click nền HOẶC Esc đều đúng; chỉ hiện khả năng click khi `beforeUrl` thực sự có ảnh.
- Không hồi quy bất kỳ khối nào khác trên trang kết quả (đặc biệt slider Trước/Sau TASK-015 vẫn kéo được bình thường khi lightbox đóng).
- Console sạch lỗi.

## Testing

Agent tự verify: build backend (`mvn -q -DskipTests package` hoặc tương đương dùng trong dự án — kiểm tra `backend/pom.xml`/README để biết đúng lệnh), build frontend, verify curl 3 case ở trên qua Docker (dùng kỹ thuật container tạm nếu cần code mới chưa có trong container đang chạy — đúng cách TASK-104/106/111 đã làm, KHÔNG tự restart 3 container compose chính). Nếu có Claude-in-Chrome trong phiên: khuyến khích tự verify UI. Không bắt buộc — coordinator sẽ verify đầy đủ ở vòng gộp cuối cùng của round này.

## Coordinator verification

- Agent báo cáo: migration V11 chạy sạch (tiếp nối đúng sau V10), verify curl đủ 3 case + 1 case bonus (note >500 ký tự → 400) qua container tạm gắn network compose (không đụng 3 container chính), `mvn package` + `npm run build` đều PASS.
- Coordinator: rebuild Docker backend+frontend (gộp cùng TASK-122), containers khởi động healthy — xác nhận Flyway áp dụng V11 thành công trên chính container `homely_backend` thật. Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome — **phát hiện + chẩn đoán 1 vấn đề trong lúc verify**: dispatch sự kiện `input`/`blur` TỔNG HỢP qua JS (native setter + `dispatchEvent`) KHÔNG kích hoạt `handleNoteBlur` — điều tra kỹ bằng interceptor `fetch`/`XMLHttpRequest.prototype.open` toàn cục xác nhận ZERO request gửi đi dù state `noteValue` đã cập nhật đúng và `document.activeElement` đã thật sự đổi. Retest bằng thao tác THẬT qua `computer`/`find` (click ref thật → gõ phím thật → click phần tử khác thật) → PATCH `/designs/jobs/{jobId}/note` gửi đúng, lưu thành công, giữ nguyên sau reload. Kết luận: đây là hạn chế của kỹ thuật dispatch sự kiện tổng hợp qua JS đối với riêng sự kiện blur trong React (một sự kiện tinh vi hơn input, phụ thuộc thứ tự sự kiện focus thật), KHÔNG PHẢI lỗi app — ghi vào Known Issues công cụ (nhóm với clipboard hang TASK-115, coordinate mismatch TASK-011→016/116/117).
- Lightbox ảnh gốc: tạo phòng mới có upload ảnh thật (`hero-living-room.jpg` có sẵn trong repo) để có `beforeUrl` — click ảnh "Trước" (qua `find` + `computer` ref thật) → phóng to đúng ảnh gốc (không lẫn ảnh AI), đóng bằng Esc đúng, slider Trước/Sau vẫn nguyên vẹn sau khi đóng.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
