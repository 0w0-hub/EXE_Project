package com.homely.api.aidesign;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "design_jobs")
@Getter
@Setter
@NoArgsConstructor
public class DesignJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "preference_id")
    private UUID preferenceId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING | PROCESSING | COMPLETED | FAILED

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    // TASK-093: khác null nghĩa là job này được TẠO RA từ nhân bản job khác (không phải generate
    // AI thật) — DesignService.countJobsSince loại trừ các job này khỏi số lượt tính giới hạn gói.
    @Column(name = "duplicated_from_job_id")
    private UUID duplicatedFromJobId;

    // TASK-103: đánh dấu thiết kế yêu thích — chỉ chủ sở hữu mới toggle được (xem
    // DesignService.toggleFavorite). Khai báo isFavorite()/setFavorite() thủ công thay vì để Lombok
    // tự sinh để tránh mập mờ isIsFavorite()/setIsFavorite() với field boolean có tiền tố "is".
    @Column(name = "is_favorite", nullable = false)
    private boolean isFavorite = false;

    public boolean isFavorite() {
        return isFavorite;
    }

    public void setFavorite(boolean favorite) {
        this.isFavorite = favorite;
    }

    // TASK-106: tên riêng do user tự đặt (Design Naming Assistant) — null nghĩa là chưa đặt, dùng
    // tên tự sinh làm mặc định (xem DesignService.buildSuggestedName). Không dùng LLM để sinh tên.
    @Column(name = "custom_name", length = 200)
    private String customName;

    // TASK-123: ghi chú nhanh (Quick Notes) do user tự nhập — null nghĩa là chưa ghi chú. Cùng cách
    // làm với customName (TASK-106) — chuỗi ngắn, không rich text/markdown, lưu server-side để đồng
    // bộ giữa các thiết bị/phiên đăng nhập khác nhau (xem DesignService.setNote).
    @Column(name = "note", length = 500)
    private String note;

    // TASK-107: NULL = job còn hoạt động bình thường; có giá trị = thời điểm xoá mềm (job nằm trong
    // thùng rác — xem GET /api/v1/designs/trash). Mọi query hiển thị cho user thường (KHÔNG áp dụng
    // Admin Data Explorer/AdminDesignController TASK-104) phải tự loại trừ deletedAt IS NOT NULL —
    // xem DesignJobRepository. Xoá VĨNH VIỄN (DesignService.permanentlyDeleteJob) KHÔNG xoá vật lý
    // row này — xem STATUS_PURGED trong DesignService để biết lý do (giữ nguyên usage/me đã tính).
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
