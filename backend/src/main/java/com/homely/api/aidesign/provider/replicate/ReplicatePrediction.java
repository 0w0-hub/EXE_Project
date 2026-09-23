package com.homely.api.aidesign.provider.replicate;

/**
 * Bản parse tối thiểu của response Replicate Predictions API
 * (https://replicate.com/docs/reference/http#predictions.create).
 */
public record ReplicatePrediction(String id, String status, Object output, String error) {

    public boolean isSucceeded() {
        return "succeeded".equals(status);
    }

    public boolean isTerminal() {
        return "succeeded".equals(status) || "failed".equals(status) || "canceled".equals(status);
    }
}
