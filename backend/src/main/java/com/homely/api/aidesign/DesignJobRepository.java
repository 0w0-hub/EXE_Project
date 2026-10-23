package com.homely.api.aidesign;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DesignJobRepository extends JpaRepository<DesignJob, UUID> {

    // TASK-107: mọi query "listing/lookup thông thường" theo owner bên dưới (dùng cho danh sách/
    // trang hiển thị của CHÍNH user — Projects/Dashboard/export/insights) đổi sang @Query để tự
    // loại trừ deletedAt IS NOT NULL, GIỮ NGUYÊN tên method + chữ ký hiện có (không đổi hành vi các
    // nơi gọi/test đang mock theo tên method — xem DesignServiceTest, InsightsServiceTest).
    // KHÔNG áp dụng cho findByStatus/findAll (nhánh admin, ownerId=null ở DesignService.listJobs) và
    // findByRoomIdOrderByCreatedAtDesc/findById (Admin Data Explorer TASK-104) — admin phải thấy cả
    // job đã xoá mềm, xem tasks/active/TASK-107-trash-soft-delete.md mục Scope.

    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.deletedAt IS NULL")
    Page<DesignJob> findByOwnerId(@Param("ownerId") UUID ownerId, Pageable pageable);

    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.status = :status AND j.deletedAt IS NULL")
    Page<DesignJob> findByOwnerIdAndStatus(@Param("ownerId") UUID ownerId, @Param("status") String status, Pageable pageable);

    /** Admin (ownerId=null, xem DesignService.listJobs 4-tham số nhánh else) — KHÔNG lọc deletedAt. */
    Page<DesignJob> findByStatus(String status, Pageable pageable);

    /** TASK-103: filter "Chỉ hiện yêu thích" — kết hợp AND với status khi có, dùng cho listMine. */
    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.isFavorite = true AND j.deletedAt IS NULL")
    Page<DesignJob> findByOwnerIdAndIsFavoriteTrue(@Param("ownerId") UUID ownerId, Pageable pageable);

    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.status = :status AND j.isFavorite = true AND j.deletedAt IS NULL")
    Page<DesignJob> findByOwnerIdAndStatusAndIsFavoriteTrue(@Param("ownerId") UUID ownerId, @Param("status") String status, Pageable pageable);

    /** TASK-093: dùng cho tính usage limit — loại trừ job nhân bản (duplicatedFromJobId != null)
     *  vì đây không phải lượt generate AI thật, không được tính vào giới hạn gói. KHÔNG lọc
     *  deletedAt (TASK-107 Out of scope: xoá mềm/vĩnh viễn KHÔNG được hoàn lượt đã dùng). */
    long countByOwnerIdAndCreatedAtGreaterThanEqualAndDuplicatedFromJobIdIsNull(UUID ownerId, Instant since);

    long countByStatus(String status);

    /** TASK-087: danh sách đầy đủ (không phân trang) — dùng cho export dữ liệu cá nhân. TASK-099:
     *  cũng dùng trực tiếp bởi InsightsService (thống kê cá nhân) — cả 2 đều hiển thị cho CHÍNH
     *  user nên phải loại trừ job đã xoá mềm (TASK-107). */
    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.deletedAt IS NULL ORDER BY j.createdAt DESC")
    List<DesignJob> findByOwnerIdOrderByCreatedAtDesc(@Param("ownerId") UUID ownerId);

    /** TASK-094: đếm job đang chờ/đang xử lý ngay lúc gọi — dùng cho admin system health. */
    long countByStatusIn(Collection<String> statuses);

    /** TASK-094: đếm job FAILED tạo ra trong khoảng thời gian gần đây (ví dụ 24h). */
    long countByStatusAndCreatedAtGreaterThanEqual(String status, Instant since);

    /** TASK-094: đếm job còn ở 1 status nhưng lâu chưa được cập nhật — dấu hiệu job bị treo. */
    long countByStatusAndUpdatedAtLessThan(String status, Instant updatedBefore);

    /**
     * TASK-100: top N job (PROCESSING/COMPLETED) sửa gần đây nhất của user — dùng cho section
     * "Recently Edited / Continue Designing" trên Dashboard. TASK-107: đổi sang @Query + Pageable
     * (thay vì "findTop5By" derive-từ-tên) để lọc thêm deletedAt IS NULL — số lượng lấy ra do
     * DesignService truyền Pageable (PageRequest.of(0, 5)), giữ đúng hành vi "tối đa 5" cũ.
     */
    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.status IN :statuses AND j.deletedAt IS NULL ORDER BY j.updatedAt DESC")
    List<DesignJob> findRecentByOwnerIdAndStatusIn(@Param("ownerId") UUID ownerId, @Param("statuses") Collection<String> statuses, Pageable pageable);

    /** TASK-104: toàn bộ job của 1 room, mới nhất trước — dùng cho Admin Data Explorer (tra "user
     *  này có room/job nào"). Số lượng thực tế mỗi room rất nhỏ nên không phân trang. KHÔNG lọc
     *  deletedAt — admin phải thấy cả job đã xoá mềm (TASK-107). */
    List<DesignJob> findByRoomIdOrderByCreatedAtDesc(UUID roomId);

    /**
     * TASK-106: dùng riêng cho sort "roomType_asc" ở listMine. DesignJob KHÔNG có cột roomType
     * (thuộc bảng rooms, module `room`) nên không thể ORDER BY roomType bằng query derive-từ-tên
     * trong module aidesign mà không JOIN xuyên module (vi phạm ranh giới module — xem lý do tương
     * tự ở RoomService.findByIds, TASK-104). Lấy KHÔNG phân trang rồi ghép roomType qua
     * RoomService.findByIds + sort/phân trang thủ công trong Java (xem DesignService.listJobsSortedByRoomType)
     * — dữ liệu cá nhân mỗi user thường nhỏ nên chấp nhận đánh đổi hiệu năng để giữ đúng ranh giới module.
     * TASK-107: cả 4 method bên dưới đổi sang @Query để loại trừ deletedAt IS NULL (hiển thị cho
     * CHÍNH user, cùng lý do findByOwnerIdOrderByCreatedAtDesc ở trên).
     */
    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.deletedAt IS NULL")
    List<DesignJob> findAllByOwnerId(@Param("ownerId") UUID ownerId);

    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.status = :status AND j.deletedAt IS NULL")
    List<DesignJob> findAllByOwnerIdAndStatus(@Param("ownerId") UUID ownerId, @Param("status") String status);

    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.isFavorite = true AND j.deletedAt IS NULL")
    List<DesignJob> findAllByOwnerIdAndIsFavoriteTrue(@Param("ownerId") UUID ownerId);

    @Query("SELECT j FROM DesignJob j WHERE j.ownerId = :ownerId AND j.status = :status AND j.isFavorite = true AND j.deletedAt IS NULL")
    List<DesignJob> findAllByOwnerIdAndStatusAndIsFavoriteTrue(@Param("ownerId") UUID ownerId, @Param("status") String status);

    /**
     * TASK-107: GET /api/v1/designs/trash — job đã xoá mềm của user hiện tại, mới xoá trước
     * (DesignService.listTrash tự truyền Pageable đã sort theo deletedAt DESC). Loại trừ status
     * PURGED (xem DesignService.STATUS_PURGED) — job đã xoá VĨNH VIỄN không hiện lại trong thùng rác
     * dù row nội bộ vẫn còn giữ làm "tombstone" (không hoàn lượt usage/me đã tính).
     */
    Page<DesignJob> findByOwnerIdAndDeletedAtIsNotNullAndStatusNot(UUID ownerId, String status, Pageable pageable);

    // ── Analytics queries ─────────────────────────────────────────────────────

    /** Jobs được tạo theo ngày — trả về [date_str, count]. */
    @Query(value = "SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) " +
                   "FROM design_jobs WHERE created_at >= :since GROUP BY day ORDER BY day",
           nativeQuery = true)
    List<Object[]> countJobsByDay(@Param("since") Instant since);

    /** Jobs theo tuần — trả về [week_start, count]. */
    @Query(value = "SELECT TO_CHAR(DATE_TRUNC('week', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS week, COUNT(*) " +
                   "FROM design_jobs WHERE created_at >= :since GROUP BY week ORDER BY week",
           nativeQuery = true)
    List<Object[]> countJobsByWeek(@Param("since") Instant since);

    /** Jobs theo tháng — trả về [year_month, count]. */
    @Query(value = "SELECT TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month, COUNT(*) " +
                   "FROM design_jobs WHERE created_at >= :since GROUP BY month ORDER BY month",
           nativeQuery = true)
    List<Object[]> countJobsByMonth(@Param("since") Instant since);

    /** Phân bố giờ trong ngày của tất cả jobs — trả về [hour_int, count]. */
    @Query(value = "SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC')::int AS hour, COUNT(*) " +
                   "FROM design_jobs GROUP BY hour ORDER BY hour",
           nativeQuery = true)
    List<Object[]> countJobsByHourOfDay();

    /** Thời gian xử lý trung bình (giây) của COMPLETED jobs thật (không phải nhân bản). */
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) " +
                   "FROM design_jobs WHERE status = 'COMPLETED' AND duplicated_from_job_id IS NULL",
           nativeQuery = true)
    Double avgProcessingSecondsForCompleted();

    /** Phân bố thời gian xử lý (bucket 30 giây) — trả về [bucket_label, count]. */
    @Query(value = "SELECT CONCAT(FLOOR(EXTRACT(EPOCH FROM (updated_at - created_at)) / 30) * 30, 's') AS bucket, COUNT(*) " +
                   "FROM design_jobs WHERE status = 'COMPLETED' AND duplicated_from_job_id IS NULL " +
                   "GROUP BY bucket ORDER BY MIN(EXTRACT(EPOCH FROM (updated_at - created_at)))",
           nativeQuery = true)
    List<Object[]> processingTimeDistribution();

    /** COMPLETED jobs theo tháng (12 tháng gần nhất). */
    @Query(value = "SELECT TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month, COUNT(*) " +
                   "FROM design_jobs WHERE status = 'COMPLETED' AND created_at >= :since " +
                   "GROUP BY month ORDER BY month",
           nativeQuery = true)
    List<Object[]> countCompletedJobsByMonth(@Param("since") Instant since);

    /** Retention proxy: số users đã tạo job trong vòng :windowSeconds giây sau khi đăng ký. */
    @Query(value = "SELECT COUNT(DISTINCT u.id) FROM users u " +
                   "WHERE EXISTS (SELECT 1 FROM design_jobs j " +
                   "              WHERE j.owner_id = u.id " +
                   "              AND j.duplicated_from_job_id IS NULL " +
                   "              AND EXTRACT(EPOCH FROM (j.created_at - u.created_at)) BETWEEN 0 AND :windowSeconds)",
           nativeQuery = true)
    long countUsersRetainedWithinSeconds(@Param("windowSeconds") long windowSeconds);

    /** Users có ít nhất 1 design (để tính funnel). */
    @Query("SELECT COUNT(DISTINCT j.ownerId) FROM DesignJob j WHERE j.deletedAt IS NULL")
    long countDistinctOwners();

    /** Users có ít nhất 1 COMPLETED design. */
    @Query("SELECT COUNT(DISTINCT j.ownerId) FROM DesignJob j WHERE j.status = 'COMPLETED' AND j.deletedAt IS NULL")
    long countDistinctOwnersWithCompleted();
}
