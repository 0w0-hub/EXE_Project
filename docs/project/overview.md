# Homely — Project Overview

## Là gì

Homely là nền tảng AI phân tích ảnh phòng thực tế + yêu cầu/sở thích của người dùng, tự động đề xuất phương án thiết kế nội thất, sinh ảnh toàn cảnh căn phòng theo phương án đó, và cho phép người dùng xem/chỉnh sửa trong môi trường 3D.

## Chức năng chính

AI phân tích phòng + tự động đề xuất thiết kế 3D:

- Input: ảnh phòng hiện tại (người dùng upload) + mô tả yêu cầu, sở thích (phong cách, ngân sách, mục đích sử dụng...).
- Xử lý: AI phân tích không gian (kích thước, ánh sáng, vật thể hiện có) kết hợp yêu cầu người dùng để tạo phương án decor.
- Output: ảnh toàn cảnh căn phòng theo phương án thiết kế, hiển thị và chỉnh sửa được trong môi trường 3D.

## Dự án tham khảo

`../../../dizaine_deploy` — nền tảng AI tạo banner quảng cáo, dùng làm tham khảo về cách tổ chức multi-service Docker Compose, luồng auth JWT, và bài học vận hành (xem [ADR liên quan](../decisions/README.md)).

## Trạng thái

PROJECT_BOOTSTRAP — repo hiện tại chỉ có hệ thống tài liệu/knowledge base, chưa có business logic.
