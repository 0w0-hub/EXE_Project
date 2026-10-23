package com.homely.api.aidesign.provider;

/**
 * Interface chung cho mọi AI provider phân tích phòng + sinh phương án thiết kế.
 * Xem rules/ai/model-integration.md — không gọi SDK provider trực tiếp từ nơi khác ngoài interface này.
 * Provider cụ thể (self-host / API bên thứ 3) chưa chốt — xem docs/decisions/ADR-0003-ai-integration-approach.md.
 */
public interface AiDesignProvider {

    DesignGenerationOutput generate(DesignGenerationInput input);
}
