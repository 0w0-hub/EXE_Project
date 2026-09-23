package com.homely.api.sharing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DesignCommentRepository extends JpaRepository<DesignComment, UUID> {

    List<DesignComment> findByShareIdOrderByCreatedAtDesc(UUID shareId);

    // TASK-097: đếm bình luận cho hàng đợi kiểm duyệt admin — không cần tải cả list.
    long countByShareId(UUID shareId);
}
