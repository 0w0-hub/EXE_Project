# API Documentation — Index

**Status:** IMPLEMENTED (MVP) — các endpoint dưới đã verify chạy thật qua Docker Compose. Chưa có OpenAPI spec (`openapi/` vẫn trống — planned).

- Quy tắc REST: [../../rules/api/README.md](../../rules/api/README.md)
- OpenAPI specs (chưa có): [openapi/](openapi/)

## Endpoint đã implement

| Method | Path | Module |
|---|---|---|
| POST | `/api/v1/auth/register` | auth |
| POST | `/api/v1/auth/login` | auth |
| GET | `/api/v1/users/me` | user |
| POST | `/api/v1/rooms` | room |
| GET | `/api/v1/rooms` | room |
| GET | `/api/v1/rooms/{id}` | room |
| POST | `/api/v1/rooms/{id}/photo` | room |
| POST | `/api/v1/rooms/{id}/preferences` | room |
| POST | `/api/v1/assets/upload` | asset |
| GET | `/api/v1/assets/{id}` | asset |
| POST | `/api/v1/designs/generate` | aidesign |
| GET | `/api/v1/designs/jobs/{jobId}` | aidesign |
| GET | `/api/v1/designs?status=&page=&size=` | aidesign |
| GET | `/api/v1/plans` | billing (public) |
| GET | `/api/v1/subscriptions/me` | billing |
| GET | `/api/v1/usage/me` | billing (gọi cả aidesign) |
| GET | `/api/v1/templates?category=` | template (public) |
| GET | `/api/v1/templates/categories` | template (public) |
| GET | `/api/v1/templates/{id}` | template (public) |
| GET | `/api/v1/admin/dashboard` | admin (role ADMIN) |
| GET | `/api/v1/admin/users?page=&size=` | admin (role ADMIN) |
| GET | `/api/v1/admin/designs?status=&page=&size=` | admin (role ADMIN) |

Endpoint phân trang trả `data: {items: [...], meta: {page, size, totalElements, totalPages}}` (xem `common/PagedResponse.java`, [ADR-0004](../decisions/ADR-0004-billing-and-pagination.md)).

Chi tiết request/response từng module: xem [../services/README.md](../services/README.md).
