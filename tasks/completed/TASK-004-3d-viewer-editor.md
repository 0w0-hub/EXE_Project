# TASK-004

## Title

3D viewer/editor thật ở frontend — thay `Room3DViewerPlaceholder`

## Goal

Thay component placeholder (hiện chỉ hiển thị ảnh 2D) bằng một scene 3D thật, tương tác được (xoay/zoom camera, kéo-thả nội thất cơ bản), đáp ứng requirement `docs/project/requirements.md`: "Không gian 3D | ảnh/scene 3D toàn cảnh phòng theo phương án, xem & chỉnh sửa được".

## Scope

- Backend (nhỏ): thêm `roomId` vào `DesignJobResponse` (record `withResult`/`pending`) để frontend biết room nào để lấy `widthMeters`/`lengthMeters` (dùng lại `GET /api/v1/rooms/{id}` đã có sẵn, không tạo endpoint mới).
- Frontend:
  - Thêm dependency `three` (plain three.js, không thêm framework nặng như react-three-fiber — nhất quán với phong cách dự án ưu tiên ít dependency, xem TASK-003).
  - New: `frontend/src/components/Room3DViewer.jsx` thay cho `Room3DViewerPlaceholder.jsx` — render scene 3D thật:
    - Phòng dạng hộp 3D kích thước theo `room.widthMeters` x `room.lengthMeters` (chiều cao mặc định cố định 2.8m — entity `Room` chưa có field height, không tự ý thêm).
    - Tường/sàn tô màu theo `colors` output (PRIMARY→tường, SECONDARY→sàn, ACCENT→điểm nhấn nội thất).
    - Nội thất render dạng khối 3D có nhãn tên, vị trí suy ra từ text tự do (`position`, ví dụ "Góc phòng, gần cửa sổ") qua hàm mapping từ khoá tiếng Việt (trái/phải/giữa/góc/tường/cửa sổ/đối diện lối vào...) sang toạ độ lưới trong phòng — hàm thuần, không phụ thuộc DOM, dễ test độc lập theo `rules/frontend/components.md`.
    - `OrbitControls` để xoay/pan/zoom camera (đáp ứng "xem" 3D).
    - Kéo-thả nội thất trong phạm vi phòng bằng raycasting (đáp ứng "chỉnh sửa cơ bản"); nút "Đặt lại bố trí" để reset về vị trí suy ra ban đầu.
    - Vẫn giữ ảnh 2D AI sinh ra (`resultAssetId`) hiển thị song song (tab hoặc bên cạnh) vì đó là ảnh AI thật, không muốn mất thông tin này.
  - `DesignResult.jsx`: sau khi job COMPLETED, gọi `roomApi.get(job.roomId)` để lấy kích thước phòng, truyền vào `Room3DViewer`.
  - Component tách biệt khỏi form nhập liệu, props rõ ràng (`room`, `furniture`, `colors`, `resultAssetId`), không phụ thuộc global state ẩn.

## Out of scope (ghi rõ để không hiểu nhầm là thiếu sót)

- Không persist vị trí nội thất đã kéo-thả về backend (chỉnh sửa chỉ tồn tại trong phiên xem hiện tại) — persist cần thêm cột DB + API mới, chưa có yêu cầu cụ thể, để lại backlog nếu cần sau.
- Không dùng model 3D thật cho từng món nội thất (ghế/sofa/tủ thật) — dùng khối hình học đơn giản có nhãn, vì chưa có thư viện asset 3D nội thất trong dự án và AI provider hiện tại (Replicate) không sinh model 3D, chỉ sinh ảnh 2D (xem ADR-0003).
- Không đổi `Room` entity để thêm field chiều cao — dùng hằng số mặc định.

## Dependencies

TASK-002 (billing/template/admin) và TASK-003 (Replicate provider) — COMPLETED. Dùng lại `RoomController.getOne`, `roomApi.get`, dữ liệu `colors`/`furniture` đã có từ AI Design output.

## Affected Services

`aidesign` (DTO thêm field `roomId`), frontend (component mới + trang `DesignResult`).

## Acceptance Criteria

- `mvn test` PASS (không phá test hiện có sau khi thêm field `roomId` vào response).
- E2E thật qua Docker Compose (theo `rules/testing/e2e.md`): đăng ký → tạo room (có width/length) → upload ảnh → preference → generate (mock provider) → xem kết quả → scene 3D hiển thị đúng tỉ lệ phòng, nội thất có nhãn đúng tên/vị trí hợp lý, xoay/zoom camera hoạt động, kéo nội thất đổi vị trí được, màu tường/sàn khớp `colors` output.
- Không có lỗi console JS khi mở trang kết quả.

## Testing

- `mvn test`: 12/12 PASS (không có test mới — chỉ thêm field DTO, không đổi logic backend).
- E2E thật qua Docker Compose + browser thật (Claude in Chrome): đăng ký → tạo phòng 5m×3m + ảnh → preference → generate (mock provider) → xem kết quả. Xác nhận: scene 3D render đúng tỉ lệ phòng, tường/sàn đúng màu theo `colors` (PRIMARY/SECONDARY), 4 nội thất hiển thị đúng tên/nhãn; xoay/pan/zoom camera qua `OrbitControls` hoạt động (verify bằng thao tác kéo chuột thật); kéo-thả nội thất đổi vị trí hoạt động đúng (verify bằng cách dispatch pointer event chính xác qua JS + xác nhận qua console log tạm thời — đã gỡ log trước khi hoàn thành) và nút "Đặt lại bố trí" trả về đúng vị trí ban đầu; tab "Ảnh AI (2D)" hiển thị đúng ảnh.
- Phát hiện + sửa 1 bug tồn tại từ trước (không thuộc scope 3D nhưng nằm trong component mới thay thế): `<img src={assetApi.url(...)}>` gọi thẳng URL asset không gắn được Bearer token → luôn lỗi 401/ảnh vỡ. Sửa bằng `assetApi.fetchObjectUrl()` (fetch kèm header, tạo blob object URL).
- Console không có lỗi JS sau khi gỡ log debug tạm thời.

## Status

COMPLETED
