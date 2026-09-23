# TASK-000

## Title

Knowledge Base Bootstrap

## Goal

Thiết lập hệ thống quản lý kiến thức (CLAUDE.md index-only + rules/ + docs/ + tasks/ + logs/ + infrastructure skeleton) cho dự án Homely, dựa trên bài học/tham khảo từ dự án `dizaine_deploy`. Ghi lại input/output đầy đủ của chức năng chính (AI phân tích & đề xuất thiết kế phòng 3D).

## Scope

- Tạo toàn bộ cấu trúc thư mục theo yêu cầu.
- Không viết business logic, không scaffold code Spring Boot/React thật.

## Dependencies

None.

## Affected Services

Không có service code nào bị ảnh hưởng — chỉ tài liệu.

## Acceptance Criteria

- `CLAUDE.md` chỉ chứa path, không chứa nội dung dài.
- Mọi path trong `CLAUDE.md` tồn tại hoặc được ghi rõ planned.
- Input/output đầy đủ của chức năng chính được ghi tại `docs/project/requirements.md` và phản ánh trong `docs/services/`, `docs/architecture/data-architecture.md`, `rules/ai/`.

## Testing

Không áp dụng (không có code).

## Documentation

Toàn bộ deliverable của task này CHÍNH LÀ documentation.

## Status

COMPLETED
