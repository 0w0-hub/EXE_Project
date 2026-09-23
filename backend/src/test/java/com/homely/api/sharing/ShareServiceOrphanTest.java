package com.homely.api.sharing;

import com.homely.api.aidesign.DesignService;
import com.homely.api.asset.AssetService;
import com.homely.api.room.RoomService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * TASK-111: Admin Data Integrity Checker (Kiểm tra 5) — verify ShareService.findOrphanShareIds
 * bằng repository/DesignService giả lập (không phụ thuộc DB thật — design_share.job_id có FK
 * constraint cứng tới design_jobs.id, xem V4__design_share_comments.sql, nên không tạo được orphan
 * thật qua INSERT bình thường để test E2E). Tách file test riêng (không thêm vào ShareServiceTest
 * vì file đó chưa tồn tại) — theo đúng convention 1 test class cho service, các dependency khác
 * (DesignShareRepository/DesignCommentRepository/RoomService/AssetService) đều mock vì không liên
 * quan tới logic đang test.
 */
class ShareServiceOrphanTest {

    private final DesignShareRepository shareRepository = mock(DesignShareRepository.class);
    private final DesignCommentRepository commentRepository = mock(DesignCommentRepository.class);
    private final DesignService designService = mock(DesignService.class);
    private final RoomService roomService = mock(RoomService.class);
    private final AssetService assetService = mock(AssetService.class);

    private final ShareService shareService = new ShareService(
            shareRepository, commentRepository, designService, roomService, assetService);

    @Test
    void findOrphanShareIds_shouldReturnOnlySharesWithMissingJob() {
        UUID okJobId = UUID.randomUUID();
        UUID missingJobId = UUID.randomUUID();

        DesignShare okShare = new DesignShare();
        okShare.setId(UUID.randomUUID());
        okShare.setJobId(okJobId);

        DesignShare orphanShare = new DesignShare();
        orphanShare.setId(UUID.randomUUID());
        orphanShare.setJobId(missingJobId);

        when(shareRepository.findAll()).thenReturn(List.of(okShare, orphanShare));
        when(designService.findMissingJobIds(anyCollection())).thenReturn(Set.of(missingJobId));

        List<UUID> orphanIds = shareService.findOrphanShareIds();

        assertThat(orphanIds).containsExactly(orphanShare.getId());
    }

    @Test
    void findOrphanShareIds_shouldReturnEmpty_whenNoMissingJob() {
        DesignShare okShare = new DesignShare();
        okShare.setId(UUID.randomUUID());
        okShare.setJobId(UUID.randomUUID());

        when(shareRepository.findAll()).thenReturn(List.of(okShare));
        when(designService.findMissingJobIds(anyCollection())).thenReturn(Set.of());

        assertThat(shareService.findOrphanShareIds()).isEmpty();
    }
}
