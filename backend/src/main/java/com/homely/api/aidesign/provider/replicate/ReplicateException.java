package com.homely.api.aidesign.provider.replicate;

/**
 * Lỗi khi gọi Replicate API — DesignJobProcessor bắt Exception chung và set job FAILED
 * kèm message này, không cần xử lý riêng.
 */
public class ReplicateException extends RuntimeException {
    public ReplicateException(String message) {
        super(message);
    }
}
