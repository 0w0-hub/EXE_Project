-- TASK-106: tên riêng do user tự đặt cho thiết kế (Design Naming Assistant). NULL nghĩa là user
-- chưa đặt tên riêng — FE/BE dùng tên tự sinh (suggestedName, tính từ roomType/style/kích thước
-- phòng THẬT, xem DesignService.buildSuggestedName) làm mặc định hiển thị. Cột nullable, không có
-- default value vì "chưa đặt tên" và "đặt tên rỗng" là cùng 1 trạng thái (NULL), không bịa giá trị
-- mặc định khác.
ALTER TABLE design_jobs
    ADD custom_name NVARCHAR(200) NULL;
