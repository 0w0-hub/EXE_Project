package com.homely.api.sharing.dto;

import jakarta.validation.constraints.NotBlank;

/** TASK-097: body của PATCH /api/v1/admin/shares/{shareId}/moderate — giá trị hợp lệ kiểm tra
 *  trong ShareService (APPROVED/REJECTED), giống cách VALID_STATUSES của DesignService validate. */
public record ModerateShareRequest(
        @NotBlank(message = "Trạng thái kiểm duyệt không được để trống") String status
) {
}
