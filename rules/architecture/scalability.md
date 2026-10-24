# Scalability

- Tác vụ AI sinh ảnh 3D là tác vụ nặng, chạy lâu → phải xử lý bất đồng bộ (job/queue), không block HTTP request.
- Ảnh gốc và ảnh AI sinh ra lưu ở object storage/volume riêng, không lưu trong DB.
- Backend phải stateless để có thể chạy nhiều instance sau Nginx.
- Chưa cần Kubernetes/auto-scaling ở giai đoạn hiện tại — xem [../../docs/architecture/infrastructure.md](../../docs/architecture/infrastructure.md).
