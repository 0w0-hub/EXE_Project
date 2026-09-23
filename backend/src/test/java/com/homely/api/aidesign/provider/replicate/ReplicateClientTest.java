package com.homely.api.aidesign.provider.replicate;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Test phần parse output thuần (không gọi network) — Replicate trả output dạng String hoặc
 * List&lt;String&gt; tuỳ model, đây là điểm dễ vỡ nhất khi tích hợp API bên ngoài.
 */
class ReplicateClientTest {

    @Test
    void extractTextOutput_shouldJoinListOfTokens() {
        String result = ReplicateClient.extractTextOutput(List.of("A cozy ", "living room ", "with warm light."));
        assertThat(result).isEqualTo("A cozy living room with warm light.");
    }

    @Test
    void extractTextOutput_shouldTrimPlainString() {
        String result = ReplicateClient.extractTextOutput("  A bright bedroom.  ");
        assertThat(result).isEqualTo("A bright bedroom.");
    }

    @Test
    void extractTextOutput_shouldRejectUnknownType() {
        assertThatThrownBy(() -> ReplicateClient.extractTextOutput(42))
                .isInstanceOf(ReplicateException.class);
    }

    @Test
    void extractImageUrl_shouldReturnFirstOfList() {
        String url = ReplicateClient.extractImageUrl(List.of("https://replicate.delivery/a.png", "https://replicate.delivery/b.png"));
        assertThat(url).isEqualTo("https://replicate.delivery/a.png");
    }

    @Test
    void extractImageUrl_shouldAcceptPlainString() {
        String url = ReplicateClient.extractImageUrl("https://replicate.delivery/only.png");
        assertThat(url).isEqualTo("https://replicate.delivery/only.png");
    }

    @Test
    void extractImageUrl_shouldRejectNull() {
        assertThatThrownBy(() -> ReplicateClient.extractImageUrl(null))
                .isInstanceOf(ReplicateException.class);
    }

    @Test
    void prediction_isTerminal_and_isSucceeded() {
        ReplicatePrediction succeeded = new ReplicatePrediction("id1", "succeeded", "ok", null);
        ReplicatePrediction failed = new ReplicatePrediction("id2", "failed", null, "boom");
        ReplicatePrediction processing = new ReplicatePrediction("id3", "processing", null, null);

        assertThat(succeeded.isTerminal()).isTrue();
        assertThat(succeeded.isSucceeded()).isTrue();
        assertThat(failed.isTerminal()).isTrue();
        assertThat(failed.isSucceeded()).isFalse();
        assertThat(processing.isTerminal()).isFalse();
    }
}
