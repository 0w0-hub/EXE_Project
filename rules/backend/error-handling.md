# Error Handling

- Dùng `@ControllerAdvice` tập trung, trả lỗi theo format chung — xem [../api/error-format.md](../api/error-format.md).
- Không nuốt exception (catch rồi bỏ qua) trừ khi log rõ lý do.
- Lỗi gọi AI provider phải phân loại: lỗi tạm thời (retry được) vs lỗi vĩnh viễn (input không hợp lệ).
