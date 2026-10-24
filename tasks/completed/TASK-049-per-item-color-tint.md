# TASK-049

## Title

Nhuộm màu riêng cho từng món nội thất đang chọn

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Bảng màu hiện có (TASK-020) chỉ đổi được tường/sàn/trần TOÀN PHÒNG; tận dụng hạ tầng "chọn 1 món" vừa thêm (TASK-040) để cho phép nhuộm màu RIÊNG từng món nội thất — thử phối màu ghế/sofa/bàn khác màu gốc mà không ảnh hưởng món khác.

## Scope

- `Room3DViewer.jsx`: thêm state `itemColorOverrides` (map `index -> hex`), preset `ITEM_COLOR_PRESETS` (6 màu).
- `attachLoadedModel`: sau `enhanceMaterial` (giữ nguyên texture vân gỗ/vải đã tạo), nếu có tint cho đúng `proxyMesh.userData.index`, đặt `material.color.set(tintHex)` cho MỌI vật liệu của model (đơn giản, đồng nhất, không phân biệt gỗ/kim loại/kính).
- UI: khi có món đang chọn (`selectedFurnitureIndex != null`), hiện 1 hàng bảng màu nhỏ (dùng lại class `.room3d-color-swatch`/`.room3d-color-swatch-reset` có sẵn từ TASK-020) ngay dưới danh sách nội thất.
- **Lỗi phát hiện + sửa trong lúc tự verify**: đổi `itemColorOverrides` nằm trong dependency array effect dựng scene → mỗi lần chọn màu làm TOÀN BỘ scene rebuild → `selectedMesh` cục bộ (biến trong effect) reset về `null`, khiến vừa chọn màu xong thì mất luôn lựa chọn (bảng màu biến mất, phải chọn lại mới đổi tiếp được màu khác) — trải nghiệm "thử nhiều màu liên tiếp" bị gãy. Sửa bằng `selectedIndexRef` (React ref, sống xuyên suốt các lần effect chạy lại) — lưu index món đang chọn mỗi khi `selectMesh` gọi, và sau khi dựng xong toàn bộ nội thất trong effect mới, tự động gọi lại `selectMesh` cho đúng món đó nếu còn tồn tại.
- Đồng bộ `removeFurniture`: dồn lại key của `itemColorOverrides` VÀ `selectedIndexRef.current` theo đúng quy tắc dịch chỉ số khi xoá 1 món ở giữa danh sách (tránh nhuộm nhầm màu/chọn nhầm món sau khi index dịch chuyển).
- "Đặt lại bố trí" xoá luôn `itemColorOverrides` + `selectedIndexRef.current`.

## Out of scope

- Không phân biệt tint riêng cho từng bộ phận vật liệu (gỗ/vải/kim loại) của cùng 1 model — nhuộm đồng loạt toàn bộ, đơn giản và đủ dùng cho nhu cầu "thử màu khác".
- Không lưu màu đã chọn (giống mọi override khác trong `Room3DViewer` — chỉ trong phiên xem, mất khi rebuild trang).

## Dependencies

TASK-040 (hạ tầng chọn món — điều kiện tiên quyết để biết đang nhuộm món nào), TASK-020 (mẫu UI bảng màu tái sử dụng).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món → bảng màu hiện ra; bấm 1 màu → model đổi màu đúng, **selection KHÔNG bị mất** (bảng màu vẫn hiển thị, có thể bấm màu khác ngay).
- Bấm "Mặc định" → món trở lại màu gốc, vẫn giữ selection.
- Xoá 1 món đứng TRƯỚC món đã nhuộm màu trong danh sách → màu vẫn đúng ở món còn lại (không nhảy sang món khác).
- "Đặt lại bố trí" xoá hết màu đã nhuộm, không còn bảng màu hiển thị.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (đăng nhập lại tài khoản đã có, job "Phòng khách"):
- Chọn sofa → bấm màu xanh dương `#4D52B4` → screenshot xác nhận sofa đổi màu đúng, dòng "Sofa/giường chính" vẫn `is-selected`, hint text vẫn hiện tên món, bảng màu vẫn còn (phát hiện + sửa lỗi mất selection ở bước này).
- Bấm màu teal `#70D6C5` (đổi màu khác trong khi vẫn đang chọn) → xác nhận đổi đúng màu thứ 2 mà không cần chọn lại.
- Bấm "Mặc định" → sofa về đúng màu gốc, vẫn giữ selection.
- Bấm màu teal lại → xoá "Bàn trung tâm" (đứng trước sofa trong danh sách) → screenshot xác nhận sofa (giờ ở index 0) vẫn giữ đúng màu teal + vẫn được chọn (không lỗi bởi việc dịch chỉ số).
- "Đặt lại bố trí" → khôi phục đủ 4 món AI gốc, không còn màu tuỳ chỉnh, không còn bảng màu hiển thị.
- Console sạch lỗi xuyên suốt toàn bộ chuỗi thao tác.

## Status

COMPLETED
