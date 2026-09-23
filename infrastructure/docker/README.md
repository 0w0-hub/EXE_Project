# Docker — Index

**Status:** SCAFFOLDED — Dockerfile thật đã có, đã build & chạy thành công qua `docker compose up`.

Rules: [../../rules/docker/README.md](../../rules/docker/README.md)

- Backend: [`../../backend/Dockerfile`](../../backend/Dockerfile) — multi-stage Maven build.
- Frontend: [`../../frontend/Dockerfile`](../../frontend/Dockerfile) — multi-stage npm build + Nginx, cấu hình tại [`../../frontend/nginx.conf`](../../frontend/nginx.conf).

Đã verify: `docker compose up -d --build` build cả 2 image thành công, container chạy healthy.
