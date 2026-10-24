# Prompt Design

- Input người dùng đầy đủ (xem [../../docs/project/requirements.md](../../docs/project/requirements.md)): thông tin phòng, ảnh phòng, sở thích, phong cách, màu sắc mong muốn, nội thất mong muốn, ngân sách, yêu cầu tự do bằng text.
- Prompt gửi cho model phải kết hợp: phân tích không gian từ ảnh (kích thước, ánh sáng, vật thể hiện có) + toàn bộ preference cấu trúc (phong cách, màu sắc, nội thất mong muốn, ngân sách) + yêu cầu tự do bằng text.
- Ngân sách phải được đưa vào prompt/logic đề xuất nội thất để tránh AI gợi ý nội thất vượt quá khả năng chi trả của người dùng.
- Không để người dùng tự do gửi prompt thẳng tới model production mà không qua lớp chuẩn hoá/kiểm duyệt input.
