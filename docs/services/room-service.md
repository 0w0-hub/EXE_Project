# Module: room

**Status:** IMPLEMENTED

- **Responsibility:** lưu thông tin phòng của người dùng (loại phòng, kích thước, ảnh gốc) và preference cho từng lần yêu cầu (sở thích, phong cách, màu sắc mong muốn, nội thất mong muốn, ngân sách, yêu cầu text tự do — xem input đầy đủ tại [../project/requirements.md](../project/requirements.md)).
- **Owned Data:** bảng `rooms`, `room_preferences`, liên kết tới `assets` (ảnh gốc).
- **API:**
  - `/api/v1/rooms` (CRUD)
  - `/api/v1/rooms/{id}/photo` (gắn ảnh đã upload qua module `asset` vào room, bằng `assetId`)
  - `/api/v1/rooms/{id}/preferences` (tạo/sửa preference: sở thích, phong cách, màu sắc, nội thất mong muốn, ngân sách, text tự do)
- **Events Produced/Consumed:** none. Module `aidesign` không lắng nghe event từ `room` — frontend tự gọi `POST /api/v1/designs/generate` với `roomId`/`preferenceId` sau khi tạo xong (xem `frontend/src/pages/RoomNew.jsx`).
- **Dependencies:** `user` (ownership), `asset` (lưu file ảnh). `RoomService` cung cấp `countAll()` và `findByIds(List<UUID>)` để module `aidesign`/`admin` tổng hợp dữ liệu (đếm tổng room, resolve `roomType` cho danh sách job) mà không đọc trực tiếp `RoomRepository` — xem [../../rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md).
- **Scaling:** stateless; ảnh lưu ở volume/asset store riêng.
- **Failure Modes:** upload ảnh sai định dạng/quá lớn → 400 kèm lý do rõ.
- **Security:** chỉ owner xem/sửa room của mình.
- **Observability:** log số lượng room tạo mới theo ngày (phục vụ theo dõi sản phẩm).
