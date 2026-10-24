# ADR-0002: Modular Monolith cho giai đoạn MVP

## Status

ACCEPTED

## Context

Template kiến thức repo (theo yêu cầu bootstrap) mô tả mô hình microservices quy mô lớn, nhưng phạm vi thực tế của Homely ở MVP chỉ gồm 1 backend Spring Boot + 1 frontend React + 1 database, chưa có nhu cầu scale độc lập theo domain hay nhiều team cùng phát triển song song.

## Decision

Triển khai backend như **modular monolith**: một Spring Boot application, chia package theo domain module (`auth`, `user`, `room`, `ai-design`, `asset`) với ranh giới rõ ràng (xem [../../rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md)), thay vì tách microservices riêng ngay từ đầu.

## Consequences

- Được: đơn giản vận hành (1 service, 1 DB, 1 pipeline deploy), phù hợp giai đoạn MVP/1 team nhỏ.
- Đánh đổi: nếu 1 module (đặc biệt `ai-design`, tác vụ nặng) cần scale độc lập, sẽ phải tách ra sau — ranh giới module hiện tại được thiết kế sẵn để việc tách này ít đau nhất có thể.
- Không áp dụng toàn bộ rules/kubernetes, rules/events từ template gốc vì chưa cần thiết ở quy mô hiện tại.
