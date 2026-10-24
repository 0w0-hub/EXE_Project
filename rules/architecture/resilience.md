# Resilience

- Mọi lời gọi tới AI provider bên ngoài phải có timeout + retry có giới hạn (không retry vô hạn).
- Nếu AI provider lỗi, job phải chuyển trạng thái `FAILED` rõ ràng, không treo vô thời hạn — tránh lặp lại bug đã gặp ở dự án tham khảo (job pending không bao giờ resolve).
- Health check bắt buộc cho backend service và AI service trước khi đưa vào Nginx upstream.
