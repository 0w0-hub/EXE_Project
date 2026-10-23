package com.homely.api.user.dto;

import com.homely.api.aidesign.dto.DesignJobExportResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * TASK-087: dữ liệu cá nhân user có thể tự tải về (backup/tham khảo ngoài app) — chỉ metadata
 * dạng text/số, KHÔNG bao gồm password hash và KHÔNG bao gồm ảnh/asset/model 3D (giữ scope nhỏ,
 * xem tasks/active/TASK-087-personal-data-export.md).
 */
public record UserExportResponse(
        ProfileExport profile,
        List<RoomExport> rooms,
        List<DesignJobExportResponse> designJobs
) {

    public record ProfileExport(UUID id, String email, String fullName, Instant createdAt) {
    }

    public record RoomExport(UUID id, String roomType, Double widthMeters, Double lengthMeters, Instant createdAt) {
    }
}
