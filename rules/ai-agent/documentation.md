# Documentation Discipline

- Không dùng từ "DONE" khi chưa đạt Definition of Done — dùng đúng trạng thái trong hệ [status system](../../docs/workflow/development.md).
- Không tuyên bố "production-ready" khi chưa test thật (xem [../testing/e2e.md](../testing/e2e.md)).
- Mỗi loại thông tin chỉ có một source of truth. Không copy nội dung giữa các nơi — luôn link tới bảng dưới đây.

## Source of Truth

| Loại thông tin | Nguồn duy nhất |
|---|---|
| Rules | `rules/` |
| Architecture | `docs/architecture/` |
| Architecture Decisions | `docs/decisions/` |
| API | `docs/api/` |
| Database | `docs/database/` |
| Service/module description | `docs/services/` |
| Tasks | `tasks/` |
| Current State | `tasks/state/` |
| Progress | `logs/progress/` |
| AI Sessions | `logs/ai-agent/` |
| Incidents | `logs/incidents/` |

Nếu một file cần tham chiếu thông tin từ nơi khác, hãy link tới source of truth thay vì copy lại.
