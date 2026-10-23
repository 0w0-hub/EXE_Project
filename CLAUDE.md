# Project Index

## Project

Docs index:
→ docs/README.md

Project overview:
→ docs/project/overview.md

Product requirements (bao gồm input/output đầy đủ của chức năng chính):
→ docs/project/requirements.md

Dự án tham khảo (pattern Docker Compose, AI integration, bug đã gặp):
→ ../dizaine_deploy

---

## Rules

Rules index:
→ rules/README.md

Architecture rules:
→ rules/architecture/README.md

Backend rules (Spring Boot):
→ rules/backend/README.md

Frontend rules (React):
→ rules/frontend/README.md

Database rules (SQL Server):
→ rules/database/README.md

API rules:
→ rules/api/README.md

AI integration rules:
→ rules/ai/README.md

Testing rules:
→ rules/testing/README.md

Security rules:
→ rules/security/README.md

Docker rules:
→ rules/docker/README.md

DevOps rules:
→ rules/devops/README.md

AI Agent rules:
→ rules/ai-agent/README.md

---

## Architecture

Architecture overview:
→ docs/architecture/overview.md

Service/module map:
→ docs/architecture/service-map.md

System context:
→ docs/architecture/system-context.md

Data architecture:
→ docs/architecture/data-architecture.md

Infrastructure architecture:
→ docs/architecture/infrastructure.md

---

## Current State

Current project state:
→ tasks/state/current-state.md

Current phase:
→ tasks/state/current-phase.md

Current blockers:
→ tasks/state/blockers.md

---

## Tasks

Task index:
→ tasks/README.md

Current task:
→ tasks/active/current-task.md

Backlog:
→ tasks/backlog/README.md

Completed tasks:
→ tasks/completed/README.md

Blocked tasks:
→ tasks/blocked/README.md

---

## Progress Logs

Progress log index:
→ logs/README.md

Current development log:
→ logs/progress/current.md

Latest AI session:
→ logs/ai-agent/latest.md

AI session history:
→ logs/ai-agent/README.md

AI session log template:
→ logs/ai-agent/template.md

---

## Architecture Decisions

ADR index:
→ docs/decisions/README.md

ADR template:
→ docs/decisions/template.md

---

## Services

Service/module documentation registry:
→ docs/services/README.md

Service/module map:
→ docs/architecture/service-map.md

---

## API

API documentation:
→ docs/api/README.md

OpenAPI specifications (planned, chưa có file):
→ docs/api/openapi/

---

## Database

Database documentation:
→ docs/database/README.md

Migrations (planned, chưa tạo — xem docs/database/README.md):
→ database/migrations/

---

## Security

Security documentation:
→ docs/security/README.md

---

## Infrastructure

Docker (planned):
→ infrastructure/docker/README.md

Docker Compose (planned):
→ infrastructure/compose/README.md

CI/CD (planned):
→ infrastructure/ci-cd/README.md

Deployment overview (planned):
→ docs/deployment/README.md

---

## Development Workflow

Development workflow (bao gồm status system dùng thống nhất toàn repo):
→ docs/workflow/development.md

Testing workflow:
→ docs/workflow/testing.md

Release workflow (planned):
→ docs/workflow/release.md

Incident workflow (planned):
→ docs/workflow/incident.md

---

## Source of Truth

Bảng đầy đủ:
→ rules/ai-agent/documentation.md

## Nguyên tắc bất biến

- Không viết business logic khi chưa có task ACTIVE tương ứng trong `tasks/active/`.
- Đọc theo thứ tự tại `rules/ai-agent/before-coding.md` trước khi code.
- Cập nhật `tasks/`, `logs/progress/current.md`, `logs/ai-agent/latest.md` sau mỗi task — xem `rules/ai-agent/after-coding.md`.
- Không dùng trạng thái `DONE`; dùng status system tại `docs/workflow/development.md`.
- Mỗi loại thông tin chỉ có một source of truth; không copy nội dung giữa các file — luôn link.
