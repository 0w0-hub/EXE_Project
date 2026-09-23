# Consistency

- Một Spring Boot instance, một database — không cần xử lý consistency phân tán ở giai đoạn hiện tại.
- Transaction bắt buộc cho các thao tác ghi nhiều bảng liên quan (ví dụ: tạo room + lưu asset ảnh gốc).
