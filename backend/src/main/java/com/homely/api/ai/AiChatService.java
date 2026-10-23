package com.homely.api.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homely.api.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);
    private static final String SYSTEM_INSTRUCTION = """
            Bạn là trợ lý AI Homely, chuyên tư vấn thiết kế nội thất.
            Hãy giúp người dùng về phong cách, màu sắc, vật liệu, bố cục, ánh sáng,
            lựa chọn nội thất và cách sử dụng Homely. Trả lời bằng tiếng Việt, thân thiện,
            rõ ràng, thực tế; ưu tiên gợi ý có thể áp dụng theo diện tích và ngân sách người dùng cung cấp.
            Nếu thiếu thông tin quan trọng, hãy hỏi lại ngắn gọn. Không bịa giá chính xác khi chưa có dữ liệu.
            """;

    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final HttpClient httpClient;

    public AiChatService(ObjectMapper objectMapper,
                         @Value("${homely.ai.gemini.api-key:}") String apiKey,
                         @Value("${homely.ai.gemini.model:gemini-3.8-flash}") String model) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = normalizeModel(model);
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public AiChatResponse reply(AiChatRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_NOT_CONFIGURED",
                    "Chưa cấu hình GEMINI_API_KEY cho backend. Thêm key rồi khởi động lại backend.");
        }
        if (apiKey.chars().anyMatch(ch -> ch <= 0x20 || ch >= 0x7f)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_KEY_CONFIGURATION_INVALID",
                    "GEMINI_API_KEY có khoảng trắng hoặc ký tự không hợp lệ. Hãy sao chép key thành một chuỗi liền trong terminal backend.");
        }
        if (model.isBlank() || !model.matches("[A-Za-z0-9._-]+")) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_MODEL_CONFIGURATION_INVALID",
                    "GEMINI_CHAT_MODEL không hợp lệ. Chỉ nhập model ID, ví dụ: gemini-3.8-flash.");
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        for (AiChatRequest.Message message : request.messages()) {
            if (message.content() == null || message.content().isBlank()) continue;
            contents.add(Map.of(
                    "role", "assistant".equals(message.role()) ? "model" : "user",
                    "parts", List.of(Map.of("text", message.content().trim()))
            ));
        }
        if (contents.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_CHAT", "Hãy nhập câu hỏi trước khi gửi.");
        }

        Map<String, Object> payload = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_INSTRUCTION))),
                "contents", contents,
                "generationConfig", Map.of("maxOutputTokens", 700, "temperature", 0.7)
        );

        String body;
        try {
            body = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            log.error("Unable to serialize Gemini chat request", ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI_REQUEST_SERIALIZATION_FAILED",
                    "Backend không thể chuẩn bị yêu cầu chat AI.");
        }

        URI endpoint;
        try {
            endpoint = URI.create("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent");
        } catch (IllegalArgumentException ex) {
            log.error("Invalid Gemini model URL", ex);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_MODEL_CONFIGURATION_INVALID",
                    "Không tạo được URL Gemini từ GEMINI_CHAT_MODEL. Chỉ nhập model ID, ví dụ: gemini-3.8-flash.");
        }

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(endpoint)
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json");
        try {
            requestBuilder.header("x-goog-api-key", apiKey);
        } catch (IllegalArgumentException ex) {
            log.error("GEMINI_API_KEY cannot be used as an HTTP header", ex);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_KEY_CONFIGURATION_INVALID",
                    "GEMINI_API_KEY có định dạng không hợp lệ cho HTTP header. Hãy sao chép lại key thành một dòng liền.");
        }
        HttpRequest httpRequest = requestBuilder
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response;
        try {
            response = sendWithRetry(httpRequest);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_REQUEST_INTERRUPTED",
                    "Yêu cầu AI bị gián đoạn. Vui lòng thử lại.");
        } catch (java.net.http.HttpTimeoutException ex) {
            log.warn("Gemini chat request timed out", ex);
            throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, "AI_TIMEOUT",
                    "Gemini phản hồi quá lâu. Vui lòng thử lại sau.");
        } catch (IOException ex) {
            // The API key is sent only in a header, so this log helps identify
            // DNS/TLS/proxy/connectivity failures without logging prompts.
            log.warn("Unable to connect to Gemini", ex);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_ERROR",
                    "Backend không kết nối được Gemini. Xem log backend để biết lỗi mạng chi tiết.");
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            // Do not log upstream response bodies; they may contain prompt data.
            log.warn("Gemini chat request failed with HTTP status {}", response.statusCode());
            throw providerError(response.statusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(response.body());
            List<String> textParts = new ArrayList<>();
            JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
            if (parts.isArray()) {
                parts.forEach(part -> {
                    if (part.hasNonNull("text")) textParts.add(part.get("text").asText());
                });
            }
            String reply = String.join("", textParts).trim();
            if (reply.isBlank()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_EMPTY_RESPONSE",
                        "AI chưa tạo được câu trả lời. Vui lòng thử lại.");
            }
            return new AiChatResponse(reply);
        } catch (JsonProcessingException ex) {
            log.error("Gemini returned an invalid JSON response", ex);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_INVALID_RESPONSE",
                    "Gemini trả về phản hồi không đọc được. Kiểm tra log backend.");
        }
    }

    private ApiException providerError(int status) {
        if (status == 401 || status == 403) {
            return new ApiException(HttpStatus.BAD_GATEWAY, "GEMINI_KEY_REJECTED",
                    "Gemini từ chối API key. Kiểm tra GEMINI_API_KEY và quyền truy cập Gemini API của key.");
        }
        if (status == 404) {
            return new ApiException(HttpStatus.BAD_GATEWAY, "GEMINI_MODEL_NOT_FOUND",
                    "Không tìm thấy model Gemini đang cấu hình. Kiểm tra GEMINI_CHAT_MODEL.");
        }
        if (status == 429) {
            return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "GEMINI_QUOTA_EXCEEDED",
                    "Gemini đang giới hạn lượt gọi hoặc đã hết quota. Kiểm tra quota của project rồi thử lại.");
        }
        if (status == 400) {
            return new ApiException(HttpStatus.BAD_GATEWAY, "GEMINI_REQUEST_REJECTED",
                    "Gemini từ chối nội dung hoặc cấu hình yêu cầu. Kiểm tra model và cấu hình chat.");
        }
        return new ApiException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_ERROR",
                "Dịch vụ Gemini tạm thời chưa phản hồi (HTTP " + status + "). Vui lòng thử lại sau.");
    }

    private HttpResponse<String> sendWithRetry(HttpRequest request) throws IOException, InterruptedException {
        int maxRetries = 2;
        for (int attempt = 0; ; attempt++) {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 503 || attempt >= maxRetries) return response;

            long backoffMs = (1L << attempt) * 1_000L + ThreadLocalRandom.current().nextLong(250L);
            log.warn("Gemini returned HTTP 503; retrying request ({}/{}) after {}ms",
                    attempt + 1, maxRetries, backoffMs);
            Thread.sleep(backoffMs);
        }
    }

    private static String normalizeModel(String configuredModel) {
        if (configuredModel == null || configuredModel.isBlank()) return "gemini-3.8-flash";
        String normalized = configuredModel.trim();
        if (normalized.startsWith("models/")) normalized = normalized.substring("models/".length());
        if (normalized.endsWith(":generateContent")) {
            normalized = normalized.substring(0, normalized.length() - ":generateContent".length());
        }
        return normalized;
    }
}
