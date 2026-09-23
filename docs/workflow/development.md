# Development Workflow

## Status System (dùng thống nhất toàn repo)

```text
PLANNED
SCAFFOLDED
IN_PROGRESS
IMPLEMENTED
TESTED
VERIFIED
PRODUCTION_READY
BLOCKED
DEPRECATED
```

Không dùng từ `DONE` khi chưa đáp ứng Definition of Done (build được, test qua, chạy thử thật trong Docker Compose).

## Quy trình làm task

1. Đọc `tasks/state/current-state.md` + `tasks/active/current-task.md`.
2. Code theo rules liên quan trong `rules/`.
3. Test theo [testing.md](testing.md).
4. Chạy thử thật (không chỉ unit test) trước khi coi task hoàn thành.
5. Cập nhật `tasks/`, `logs/progress/current.md`, `logs/ai-agent/latest.md` (xem [../../rules/ai-agent/after-coding.md](../../rules/ai-agent/after-coding.md)).
