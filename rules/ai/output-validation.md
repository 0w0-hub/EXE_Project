# Output Validation

Output đầy đủ phải có 7 phần (xem [../../docs/project/requirements.md](../../docs/project/requirements.md)): phương án decor, danh sách nội thất, màu sắc, bố trí, chi phí, không gian 3D, giải thích của AI. Thiếu bất kỳ phần nào coi như job chưa hoàn thành.

- Ảnh/scene 3D sinh ra phải được lưu kèm metadata: prompt gốc, thời gian, trạng thái job.
- Danh sách nội thất phải có chi phí từng item; tổng chi phí phải khớp với chi phí dự kiến trả về, và nên được so sánh với ngân sách input để cảnh báo nếu vượt.
- Bảng màu sắc và bố trí (layout) phải tham chiếu được tới các item nội thất cụ thể (không phải mô tả rời rạc không liên kết).
- Giải thích của AI phải nhắc tới lý do liên quan tới ảnh gốc và preference (không phải text chung chung).
- Phải có bước kiểm tra output cơ bản (kích thước ảnh, định dạng) trước khi trả về client.
- Nếu generation fail, trả lỗi rõ ràng cho client, không để job ở trạng thái "đang xử lý" vô hạn (tham khảo bug đã gặp ở dự án tham khảo: subscriptions/usage endpoint từng bị pending vô hạn do thiếu migrate DB).
