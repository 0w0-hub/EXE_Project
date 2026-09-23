# Migrations

- Dùng Flyway (khuyến nghị) cho versioned migration của SQL Server, chạy tự động khi backend start ở môi trường dev.
- Không sửa migration đã apply ở môi trường khác — luôn tạo migration mới.
- Bài học từ dự án tham khảo: phải có bước migrate/seed rõ ràng trong quy trình chạy dự án, tránh lỗi "table does not exist" khi mới deploy.
