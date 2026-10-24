# Dockerfile Rules

- Multi-stage build cho backend (build Java jar) và frontend (build React rồi copy vào Nginx), theo mẫu ở dự án tham khảo (`di-zai-ne-api/Dockerfile`, `di-zai-ne/Dockerfile`).
- Không chạy container với user root khi không cần thiết.
