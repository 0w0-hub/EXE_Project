# Backend Coding Standard

- Java + Spring Boot, layer theo `controller → service → repository → domain`.
- Package theo domain module (`auth`, `user`, `room`, `aidesign`, `asset`), không package theo layer toàn cục.
- DTO riêng cho request/response, không expose entity JPA trực tiếp ra API.
- Không viết business logic trong controller.
