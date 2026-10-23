package com.homely.api.asset.dto;

import com.homely.api.asset.Asset;

import java.util.UUID;

public record AssetResponse(UUID id, String fileName, String assetType, String url) {

    public static AssetResponse from(Asset asset) {
        return new AssetResponse(asset.getId(), asset.getFileName(), asset.getAssetType(),
                "/api/v1/assets/" + asset.getId());
    }
}
