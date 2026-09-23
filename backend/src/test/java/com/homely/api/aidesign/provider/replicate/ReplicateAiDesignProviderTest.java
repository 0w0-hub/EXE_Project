package com.homely.api.aidesign.provider.replicate;

import com.homely.api.asset.AssetService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Không gọi network thật (không có key trong CI/test) — chỉ verify hành vi fail-fast khi
 * homely.ai.provider=replicate được chọn nhưng thiếu REPLICATE_API_KEY, theo
 * rules/backend/error-handling.md (không âm thầm rơi về hành vi khác).
 */
class ReplicateAiDesignProviderTest {

    private final AssetService assetService = Mockito.mock(AssetService.class);

    @Test
    void constructor_shouldThrow_whenApiKeyBlank() {
        assertThatThrownBy(() -> new ReplicateAiDesignProvider(assetService, ""))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("REPLICATE_API_KEY");
    }

    @Test
    void constructor_shouldThrow_whenApiKeyNull() {
        assertThatThrownBy(() -> new ReplicateAiDesignProvider(assetService, null))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void constructor_shouldSucceed_whenApiKeyPresent() {
        new ReplicateAiDesignProvider(assetService, "r8_fake_key_for_construction_test_only");
        // không throw = pass; không gọi generate() nên không có network call thật.
    }
}
