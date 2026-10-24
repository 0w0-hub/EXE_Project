# Product Requirements (Draft)

## Đối tượng dùng

Chủ nhà/người thuê nhà muốn có gợi ý thiết kế nội thất nhanh, trực quan, không cần thuê designer ngay từ đầu.

## Yêu cầu chức năng (Phase 1 — MVP)

1. Đăng ký/đăng nhập người dùng.
2. Thu thập input người dùng (xem chi tiết ở mục "Input/Output" dưới).
3. Gửi yêu cầu AI phân tích + sinh phương án thiết kế đầy đủ (không chỉ ảnh, mà cả danh sách nội thất, màu sắc, bố trí, chi phí, giải thích).
4. Xem kết quả, theo dõi trạng thái xử lý (đang phân tích / đang sinh ảnh / hoàn thành / lỗi).
5. Xem & chỉnh sửa cơ bản kết quả trong môi trường 3D.
6. Lưu lại các phương án đã tạo (dự án của người dùng).

## Input / Output của chức năng chính (AI Room Design)

### Input (người dùng cung cấp)

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| Thông tin phòng | text/structured | Có | loại phòng, kích thước (nếu biết), số cửa/sổ... |
| Ảnh phòng | file (1+) | Có | ảnh thực tế hiện trạng căn phòng |
| Sở thích | text/tag | Không | ví dụ: tối giản, ấm cúng, sang trọng |
| Phong cách | enum/tag | Không | ví dụ: Scandinavian, Japandi, Modern, Industrial... |
| Màu sắc mong muốn | tag/color | Không | 1 hoặc nhiều màu chủ đạo |
| Nội thất mong muốn | text/tag list | Không | ví dụ: muốn giữ giường cũ, muốn thêm bàn làm việc |
| Ngân sách | số (VND) | Không | dùng để AI đề xuất nội thất phù hợp tầm giá |
| Yêu cầu tự do (text) | text | Không | mô tả thêm bất kỳ điều gì AI cần biết |

### Output (hệ thống trả về)

| Trường | Mô tả |
|---|---|
| Phương án decor | mô tả tổng thể phương án thiết kế được đề xuất |
| Danh sách nội thất | các item nội thất đề xuất (tên, loại, vị trí đặt) |
| Màu sắc | bảng màu áp dụng cho phương án |
| Bố trí (layout) | cách sắp xếp nội thất trong không gian phòng |
| Chi phí dự kiến | tổng chi phí ước tính + breakdown theo item (đối chiếu ngân sách input) |
| Không gian 3D | ảnh/scene 3D toàn cảnh phòng theo phương án, xem & chỉnh sửa được |
| Giải thích của AI | lý do AI chọn phương án này (dựa trên ảnh gốc + sở thích + ngân sách) |

Input/output này là nguồn tham chiếu chính cho thiết kế data model ([data-architecture.md](../architecture/data-architecture.md)) và API của module `ai-design` ([ai-design-service.md](../services/ai-design-service.md)).

## Yêu cầu phi chức năng

- Tác vụ AI generation không block UI — người dùng phải thấy trạng thái tiến trình rõ ràng.
- Toàn bộ luồng chạy được bằng Docker Compose ở môi trường local/dev.

## Ngoài phạm vi MVP (chưa làm)

- Thanh toán/gói dịch vụ.
- Chia sẻ/cộng tác nhiều người trên một dự án.
- Marketplace nội thất thật (liên kết mua hàng).

Chi tiết requirement sẽ được breakdown thành task cụ thể trong `tasks/backlog/`.
