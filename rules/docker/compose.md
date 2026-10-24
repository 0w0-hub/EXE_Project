# Docker Compose Rules

- Service tối thiểu: `sqlserver`, `backend`, `ai-service` (nếu tách riêng), `frontend` (Nginx).
- Healthcheck bắt buộc cho `sqlserver` và `backend` trước khi service phụ thuộc start.
- Tham khảo cấu trúc tại `../../../dizaine_deploy/docker-compose.yml`.
