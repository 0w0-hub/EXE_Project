# Module: asset

**Status:** IMPLEMENTED

- **Responsibility:** lưu trữ và phục vụ file (ảnh gốc người dùng upload, ảnh AI sinh ra).
- **Owned Data:** bảng `assets` (metadata: đường dẫn, loại, chủ sở hữu), file thật trên volume/object storage.
- **API:** `/api/v1/assets/upload` (POST), `/api/v1/assets/{id}` (GET).
- **Events Produced/Consumed:** none.
- **Dependencies:** dùng chung bởi `room` và `ai-design`.
- **Scaling:** volume riêng, có thể chuyển sang object storage (S3-compatible) khi cần scale ngang nhiều backend instance.
- **Failure Modes:** file quá lớn/định dạng sai → 400; mất file trên disk → 404 kèm log lỗi.
- **Security:** URL truy cập ảnh phải kiểm tra quyền sở hữu, không public toàn bộ theo mặc định.
- **Observability:** log dung lượng lưu trữ theo thời gian.
