# TASK-076

## Title

Thêm nút "Tự động xoay 360°" + "Góc nhìn đi bộ" cho không gian 3D

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem `[[feedback_autonomous_3d_upgrade_loop]]`). User yêu cầu lại "tiếp tục nâng cấp giao diện dựa trên file `index.html`" (cùng file mockup đã đối chiếu ở TASK-075). Đối chiếu lại kỹ thanh công cụ nổi trong mockup (`btn-rotate` "Xoay 360°" tự động + icon "user" ghi chú "Góc nhìn walkthrough") với `Room3DViewer.jsx` hiện tại: Homely đã có xoay thủ công bằng kéo chuột (OrbitControls) và các góc nhìn nhanh "Nhìn từ trên"/"Đặt lại góc nhìn"/"Phóng to món đã chọn" (TASK-034/058), nhưng **chưa có** xoay camera TỰ ĐỘNG liên tục (rảnh tay) và **chưa có** góc nhìn ngang tầm mắt người đứng trong phòng — đúng 2 điểm còn thiếu so với mockup.

## Scope

- `Room3DViewer.jsx`:
  - State `isAutoRotating` (chỉ để đổi nhãn nút) + ref `isAutoRotatingRef` (khôi phục đúng trạng thái sau khi scene rebuild vì lý do khác — đổi màu/tab, cùng pattern `selectedIndexRef` TASK-049).
  - Hàm `toggleAutoRotate()`: bật/tắt trực tiếp `controlsRef.current.autoRotate` (thuộc tính có sẵn của `THREE.OrbitControls`) — không cần thêm code render, vì animate loop đã gọi `controls.update()` mỗi khung hình.
  - Hàm `setWalkthroughView()`: đặt camera ở độ cao 1.6m (chiều cao mắt người trưởng thành trung bình) gần 1 góc phòng, `controls.target` cũng ở cùng độ cao hướng về phía đối diện — theo đúng pattern `setTopView`/`resetView` (TASK-034, đổi trực tiếp camera đang chạy, không rebuild scene).
  - 2 nút mới trên thanh công cụ 3D: "🚶 Góc nhìn đi bộ" (cạnh "⬆ Nhìn từ trên") và "🔄 Tự động xoay 360°" / "⏸ Dừng tự xoay" (cạnh "↺ Đặt lại góc nhìn").
  - Cập nhật bảng phím tắt (`showShortcutsHelp`) ghi chú thêm 2 nút mới.

## Out of scope

- Không thêm điều khiển đi lại bằng bàn phím (WASD) kiểu game FPS thật — chỉ là 1 góc nhìn cố định ngang tầm mắt, đúng mức độ mockup có (mockup cũng chỉ là 1 icon, không có logic di chuyển thật).
- Không đổi cơ chế xoay nội thất (TASK-034/042/075) — đây là xoay CAMERA, khác xoay MÓN ĐỒ.
- Không viết lại dự án theo `index.html` — chỉ đối chiếu tính năng còn thiếu.

## Dependencies

TASK-034 (cameraRef/controlsRef + góc nhìn nhanh), TASK-049 (pattern ref khôi phục trạng thái qua rebuild), TASK-058 (pattern hàm điều khiển camera qua ref từ nút React).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "🔄 Tự động xoay 360°" → camera tự xoay quanh phòng liên tục không cần giữ chuột; nút đổi nhãn thành "⏸ Dừng tự xoay"; bấm lại → dừng, nhãn về lại ban đầu.
- Bấm "🚶 Góc nhìn đi bộ" → camera chuyển sang góc nhìn thấp ngang tầm mắt (khác hẳn góc mặc định chếch cao và góc "Nhìn từ trên").
- Đổi tab 2D/3D, đổi màu tường/sàn, "Đặt lại bố trí" không làm mất trạng thái đang tự động xoay (khôi phục đúng qua `isAutoRotatingRef`).
- Không phá vỡ các nút/thao tác đã có (xoay món 90°/15°, chọn món, kéo-thả, kéo-resize phòng).
- Console sạch lỗi.

## Testing

- `npm run build` PASS (`vite build`, 118 modules, không lỗi).
- Docker rebuild `frontend` service (`docker compose up -d --build`) — backend/sqlserver không đổi code, container start lại bình thường, `/actuator/health` trả `UP`.
- Tạo tài khoản/room (5×5m)/job mới qua API trực tiếp (curl, `AI_PROVIDER=mock`) vì Claude-in-Chrome extension **không kết nối được** trong phiên này (đã thử mở lại Chrome + chờ nhiều lần, vẫn báo "not connected" — vấn đề môi trường/công cụ, không phải lỗi app).
- Verify thay thế ở mức tối đa có thể làm được khi không có browser tương tác thật:
  - Tải trực tiếp bundle JS đã build & deploy qua Docker (`http://localhost:8082/assets/index-*.js`), xác nhận (qua `Invoke-WebRequest` + so khớp UTF-8 byte thật) có đủ 3 chuỗi nút mới: `"Tự động xoay 360°"`, `"Góc nhìn đi bộ"`, `"Dừng tự xoay"` — xác nhận code đã thật sự lên bản build chạy trong container, không chỉ tồn tại trên đĩa.
  - Review logic: `controls.autoRotate`/`controls.autoRotateSpeed` là thuộc tính chuẩn của `THREE.OrbitControls`; animate loop hiện có (dòng ~1622-1624 trước khi sửa) đã gọi `controls.update()` mỗi `requestAnimationFrame`, xác nhận qua đọc trực tiếp source — không cần thêm code render.
  - Đối chiếu code: `setWalkthroughView`/`toggleAutoRotate` dùng đúng `cameraRef.current`/`controlsRef.current` (không phải biến cục bộ trong effect), đúng pattern đã verify E2E thật nhiều lần ở `setTopView`/`resetView`/`focusOnSelected` (TASK-034/058) nên rủi ro hồi quy thấp.
- **Chưa verify bằng screenshot/thao tác chuột thật** — cần user xác nhận trực quan khi Claude-in-Chrome kết nối lại được, hoặc tự kiểm tra thủ công tại `http://localhost:8082`.

## Status

COMPLETED (verify code-level; verify UI tương tác trực tiếp bị chặn do Claude-in-Chrome extension không kết nối được trong phiên này — user đã xác nhận đồng ý tiếp tục ở mức này)
