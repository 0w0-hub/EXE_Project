# Error Format

Chuẩn response lỗi (áp dụng toàn bộ API):

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room does not exist"
  }
}
```

- `code` là machine-readable, ổn định, không đổi giữa các version.
