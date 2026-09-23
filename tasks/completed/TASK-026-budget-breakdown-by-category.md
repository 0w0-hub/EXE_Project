# TASK-026

## Title

Chi tiết ngân sách rõ hơn — phân bổ chi phí theo loại nội thất

## Goal

Theo lựa chọn user khi làm rõ "tiếp tục nâng cấp trang thiết kế" — mở rộng khối chi phí hiện có (chỉ có tổng + so ngân sách) thành có thêm biểu đồ phân bổ theo từng loại nội thất, và làm rõ số tiền vượt/còn dư thay vì chỉ báo "đã vượt ngân sách" chung chung.

## Scope

`DesignResult.jsx`:

- Thêm `CATEGORY_LABELS` (map category tiếng Anh cố định `seating/table/lighting/storage` sang tên tiếng Việt) và `CATEGORY_COLORS` (map sang 4 màu design token: Primary/Secondary/Accent/Support) + màu fallback cho category lạ.
- Thêm khối "Phân bổ theo loại nội thất" (giữa "Chi phí dự kiến" và khối so-ngân-sách sẵn có): thanh ngang chia đoạn theo tỷ lệ chi phí mỗi category (`totals[category] / totalCost`), + chú giải (dot màu + tên + số tiền + %) bên dưới. Tự ẩn nếu không có dữ liệu chi phí thật (đúng nguyên tắc "no fabricated data").
- Sửa dòng "So với ngân sách dự kiến" — thay vì chỉ báo "đã vượt ngân sách" (boolean), hiện rõ số tiền chênh lệch: "vượt X đ" hoặc "còn dư X đ".
- `styles.css`: thêm `.budget-breakdown__bar`, `.budget-breakdown__legend`, `.budget-breakdown__legend-item`, `.budget-breakdown__dot`.

## Out of scope

- Không đổi backend/dữ liệu (`estimatedCost` per item đã có sẵn từ TASK-005/output AI) — thuần tính toán + hiển thị phía client.
- Không thêm biểu đồ tròn (pie chart) hay thư viện chart — dùng thanh ngang chia đoạn (đơn giản, không cần dependency mới), nhất quán với `.budget-bar` đã có.

## Dependencies

TASK-025 (COMPLETED, cùng đợt nâng cấp trang kết quả).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Khối phân bổ hiện đúng: tổng % ≈ 100% (làm tròn từng mục), tổng số tiền các đoạn khớp đúng "Chi phí dự kiến" hiển thị phía trên.
- Dòng so-ngân-sách hiện đúng số tiền vượt/dư (không chỉ còn là text tĩnh "đã vượt ngân sách").
- Khối tự ẩn khi không có dữ liệu chi phí (job cũ/lỗi không có `furniture`/`estimatedCost`).
- Console sạch lỗi.

## Testing

- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`, 4 món: storage 6.000.000đ, seating 10.500.000đ, lighting 3.000.000đ, table 4.500.000đ, tổng 24.000.000đ):
  - Thanh phân bổ hiện đúng 4 đoạn màu (support/primary/accent/secondary), chú giải hiện đúng: "Tủ/kệ lưu trữ: 6.000.000 đ (25%)", "Ghế/sofa: 10.500.000 đ (44%)", "Đèn: 3.000.000 đ (13%)", "Bàn: 4.500.000 đ (19%)" — khớp đúng bảng "Danh sách nội thất" phía trên.
  - Job test này không có `preference.budget` thật nên khối so-ngân-sách tự ẩn đúng — xác nhận qua screenshot không có phần "So với ngân sách dự kiến" hiện ra khi thiếu dữ liệu (không fabricate).
- `read_console_messages(onlyErrors=true)` — sạch lỗi.

## Status

COMPLETED
