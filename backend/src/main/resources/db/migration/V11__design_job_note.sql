-- TASK-123: Ghi chú nhanh (Quick Notes) cho thiết kế — chuỗi ngắn user tự nhập để ghi lại ý định
-- tạm thời gắn với 1 job cụ thể (vd "đổi sofa", "xem lại màu tường trước khi chốt"). Lưu SERVER-SIDE
-- (không phải localStorage) để đồng bộ được giữa các thiết bị/phiên đăng nhập khác nhau — cùng tinh
-- thần với custom_name (TASK-106, V9__design_job_custom_name.sql), cũng là 1 chuỗi ngắn user tự
-- nhập, cùng khái niệm "metadata cá nhân gắn theo job". Cột nullable, không có default value vì
-- "chưa ghi chú" và "ghi chú rỗng" là cùng 1 trạng thái (NULL), không bịa giá trị mặc định khác.
ALTER TABLE design_jobs
    ADD note NVARCHAR(500) NULL;
