package com.homely.api.sharing;

import com.homely.api.aidesign.DesignService;
import com.homely.api.aidesign.dto.DesignJobResponse;
import com.homely.api.asset.Asset;
import com.homely.api.asset.AssetService;
import com.homely.api.common.ApiException;
import com.homely.api.room.Room;
import com.homely.api.room.RoomService;
import com.homely.api.sharing.dto.AddCommentRequest;
import com.homely.api.sharing.dto.AdminShareResponse;
import com.homely.api.sharing.dto.CommentResponse;
import com.homely.api.sharing.dto.PublicShareResponse;
import com.homely.api.sharing.dto.ShareResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Chia sẻ liên kết xem công khai (view-only) + bình luận xin ý kiến — TASK-078.
 * Package riêng ngoài `aidesign` để giữ ranh giới module rõ ràng (ADR-0002); dùng lại
 * DesignService/RoomService/AssetService thay vì đọc thẳng repository của module khác.
 */
@Service
public class ShareService {

    // TASK-097: 2 giá trị THẬT được set qua PATCH moderate.
    private static final Set<String> VALID_MODERATION_STATUSES = Set.of("APPROVED", "REJECTED");

    // TASK-097: giá trị filter hợp lệ cho GET /admin/shares?status= — có thêm PENDING dù KHÔNG có
    // luồng nào tự gán PENDING lúc tạo (chỉ chừa chỗ cho tương lai, xem Scope trong task file).
    private static final Set<String> VALID_MODERATION_FILTERS = Set.of("APPROVED", "REJECTED", "PENDING");

    private final DesignShareRepository shareRepository;
    private final DesignCommentRepository commentRepository;
    private final DesignService designService;
    private final RoomService roomService;
    private final AssetService assetService;

    public ShareService(DesignShareRepository shareRepository,
                         DesignCommentRepository commentRepository,
                         DesignService designService,
                         RoomService roomService,
                         AssetService assetService) {
        this.shareRepository = shareRepository;
        this.commentRepository = commentRepository;
        this.designService = designService;
        this.roomService = roomService;
        this.assetService = assetService;
    }

    /** Idempotent: gọi lại nhiều lần trả về cùng shareToken đã có (UNIQUE(job_id) ở DB), không
     *  tạo bản ghi mới — chỉ bật lại enabled nếu trước đó đã tắt. */
    public ShareResponse enableShare(UUID ownerId, UUID jobId) {
        designService.getOwnedJob(ownerId, jobId); // kiểm tra ownership — không viết lại logic khác kiểu

        DesignShare share = shareRepository.findByJobId(jobId).orElseGet(() -> {
            DesignShare created = new DesignShare();
            created.setJobId(jobId);
            return created;
        });
        share.setEnabled(true);
        share = shareRepository.save(share);
        return ShareResponse.from(share);
    }

    /** Tắt chia sẻ — set enabled=false, KHÔNG xoá bản ghi/comment để giữ lịch sử khi bật lại. */
    public ShareResponse disableShare(UUID ownerId, UUID jobId) {
        designService.getOwnedJob(ownerId, jobId);
        DesignShare share = shareRepository.findByJobId(jobId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SHARE_NOT_FOUND", "Chưa bật chia sẻ cho job này"));
        share.setEnabled(false);
        share = shareRepository.save(share);
        return ShareResponse.from(share);
    }

    public PublicShareResponse getPublicShare(UUID shareToken) {
        DesignShare share = getEnabledShare(shareToken);
        DesignJobResponse job = designService.getJobForSharing(share.getJobId());

        Map<UUID, Room> roomsById = roomService.findByIds(List.of(job.roomId()));
        Room room = roomsById.get(job.roomId());

        return new PublicShareResponse(
                job.jobId(),
                room != null ? room.getRoomType() : null,
                room != null ? room.getWidthMeters() : null,
                room != null ? room.getLengthMeters() : null,
                job.status(),
                job.result()
        );
    }

    /** Serve đúng ảnh AI 2D thuộc job đã bật share — KHÔNG mở public toàn bộ asset endpoint. */
    public Asset getPublicResultAsset(UUID shareToken) {
        DesignShare share = getEnabledShare(shareToken);
        DesignJobResponse job = designService.getJobForSharing(share.getJobId());
        UUID assetId = job.result() != null ? job.result().resultAssetId() : null;
        if (assetId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ASSET_NOT_FOUND", "Chưa có ảnh kết quả cho job này");
        }
        return assetService.get(assetId);
    }

    public List<CommentResponse> listComments(UUID shareToken) {
        DesignShare share = getEnabledShare(shareToken);
        return commentRepository.findByShareIdOrderByCreatedAtDesc(share.getId())
                .stream().map(CommentResponse::from).toList();
    }

    // TASK-078: MVP demo — chưa có rate-limit/CAPTCHA chống spam comment. Biết trước, chấp nhận
    // được ở quy mô hiện tại, không phải lỗi bỏ sót (xem Out of scope trong TASK-078).
    public CommentResponse addComment(UUID shareToken, AddCommentRequest request) {
        DesignShare share = getEnabledShare(shareToken);
        DesignComment comment = new DesignComment();
        comment.setShareId(share.getId());
        comment.setAuthorName(request.authorName());
        comment.setMessage(request.message());
        comment = commentRepository.save(comment);
        return CommentResponse.from(comment);
    }

    private DesignShare getEnabledShare(UUID shareToken) {
        DesignShare share = shareRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SHARE_NOT_FOUND", "Liên kết chia sẻ không tồn tại"));
        if (!share.isEnabled()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "SHARE_NOT_FOUND", "Liên kết chia sẻ không tồn tại");
        }
        // TASK-097: REJECTED trả 404 giống hệt case enabled=false — KHÔNG tiết lộ lý do cụ thể
        // (bị admin ẩn hay chưa từng bật) cho người xem công khai, tránh rò rỉ thông tin nội bộ.
        if ("REJECTED".equals(share.getModerationStatus())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "SHARE_NOT_FOUND", "Liên kết chia sẻ không tồn tại");
        }
        return share;
    }

    /** TASK-097: hàng đợi kiểm duyệt admin — TẤT CẢ share (không giới hạn theo owner/enabled), lọc
     *  đơn giản theo moderationStatus nếu có. roomType lấy qua DesignService/RoomService, KHÔNG
     *  đọc thẳng repository của module aidesign/room (đúng ranh giới module). */
    public List<AdminShareResponse> listSharesForAdmin(String moderationStatusFilter) {
        if (moderationStatusFilter != null && !VALID_MODERATION_FILTERS.contains(moderationStatusFilter)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_MODERATION_STATUS", "Trạng thái kiểm duyệt không hợp lệ");
        }

        return shareRepository.findAll().stream()
                .filter(s -> moderationStatusFilter == null || moderationStatusFilter.equals(s.getModerationStatus()))
                .sorted(Comparator.comparing(DesignShare::getCreatedAt).reversed())
                .map(this::toAdminShareResponse)
                .toList();
    }

    /** TASK-097: admin ẨN (REJECTED) hoặc KHÔI PHỤC (APPROVED) 1 share đã có — KHÔNG xoá
     *  design_share/design_comment, chỉ đổi moderationStatus (xem Out of scope trong task). */
    public AdminShareResponse moderate(UUID shareId, String status) {
        if (!VALID_MODERATION_STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_MODERATION_STATUS",
                    "Trạng thái kiểm duyệt không hợp lệ — chỉ chấp nhận APPROVED hoặc REJECTED");
        }
        DesignShare share = shareRepository.findById(shareId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SHARE_NOT_FOUND", "Liên kết chia sẻ không tồn tại"));
        share.setModerationStatus(status);
        share = shareRepository.save(share);
        return toAdminShareResponse(share);
    }

    /**
     * TASK-111 — Admin Data Integrity Checker (Kiểm tra 5): id design_share có job_id không tồn tại
     * trong design_jobs. sharing sở hữu design_share nên tự lấy toàn bộ job_id cần kiểm tra rồi nhờ
     * DesignService (sở hữu design_jobs) trả về id nào KHÔNG tồn tại — theo đúng hướng phụ thuộc 1
     * chiều sharing -> aidesign đã có sẵn (constructor ở trên), không JOIN xuyên module.
     */
    public List<UUID> findOrphanShareIds() {
        List<DesignShare> shares = shareRepository.findAll();
        Set<UUID> jobIds = shares.stream().map(DesignShare::getJobId).collect(Collectors.toSet());
        Set<UUID> missingJobIds = designService.findMissingJobIds(jobIds);
        if (missingJobIds.isEmpty()) {
            return List.of();
        }
        return shares.stream().filter(s -> missingJobIds.contains(s.getJobId())).map(DesignShare::getId).toList();
    }

    /** roomType lấy qua DesignService/RoomService (không đọc thẳng repository module khác); job/room
     *  bị xoá về sau (hiếm) không chặn cả danh sách/thao tác kiểm duyệt vì 1 record lỗi — trả null. */
    private AdminShareResponse toAdminShareResponse(DesignShare share) {
        String roomType = null;
        try {
            DesignJobResponse job = designService.getJobForSharing(share.getJobId());
            Map<UUID, Room> roomsById = roomService.findByIds(List.of(job.roomId()));
            Room room = roomsById.get(job.roomId());
            roomType = room != null ? room.getRoomType() : null;
        } catch (ApiException ex) {
            // xem javadoc phía trên
        }
        long commentCount = commentRepository.countByShareId(share.getId());
        return new AdminShareResponse(share.getId(), share.getJobId(), roomType, share.getShareToken(),
                share.isEnabled(), share.getModerationStatus(), share.getCreatedAt(), commentCount);
    }
}
