package com.homely.api.sharing.dto;

import com.homely.api.sharing.DesignShare;

import java.util.UUID;

public record ShareResponse(UUID jobId, UUID shareToken, boolean enabled) {
    public static ShareResponse from(DesignShare share) {
        return new ShareResponse(share.getJobId(), share.getShareToken(), share.isEnabled());
    }
}
