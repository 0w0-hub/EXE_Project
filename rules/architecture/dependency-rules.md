# Dependency Rules

- Frontend (React) không gọi trực tiếp AI provider hoặc DB — luôn qua Backend API (Spring Boot).
- Backend module `ai-design` không chứa business logic của `room` hay `user` — chỉ orchestration.
- Không được có dependency vòng (circular) giữa các package Java theo domain.
- Thư viện bên thứ 3 dùng cho AI (model client, image processing) phải được bọc qua interface riêng để dễ thay provider (xem [../ai/model-integration.md](../ai/model-integration.md)).
