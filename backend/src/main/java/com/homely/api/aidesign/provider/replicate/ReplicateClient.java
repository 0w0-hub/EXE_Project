package com.homely.api.aidesign.provider.replicate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Client HTTP tối giản cho Replicate Predictions API — xem
 * https://replicate.com/docs/reference/http#predictions.create.
 *
 * Chỉ implement đúng những gì ReplicateAiDesignProvider cần (tạo prediction, chờ/poll kết quả,
 * download ảnh) — không phải SDK đầy đủ. Timeout + số lần poll có giới hạn theo
 * rules/architecture/resilience.md (không retry/poll vô hạn).
 */
public class ReplicateClient {

    private static final String API_BASE = "https://api.replicate.com/v1";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(90);
    private static final int MAX_POLL_ATTEMPTS = 45; // 45 * 2s = 90s chờ tối đa sau "Prefer: wait"
    private static final Duration POLL_INTERVAL = Duration.ofSeconds(2);

    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ReplicateClient(String apiKey) {
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Tạo prediction (theo version hash đã pin) và chờ tới khi xong (dùng header "Prefer: wait" của
     * Replicate để chờ đồng bộ tối đa ~60s; nếu chưa xong thì poll thêm tới MAX_POLL_ATTEMPTS lần).
     * Dùng cho model đã có version hash xác thực (LLaVA, SDXL — xem model-integration.md).
     */
    public ReplicatePrediction runAndWait(String versionHash, Map<String, Object> input) {
        Map<String, Object> body = Map.of("version", versionHash, "input", input);
        return submitAndPoll(API_BASE + "/predictions", body);
    }

    /**
     * Tạo prediction theo tên model (owner/name), không cần version hash — Replicate tự dùng version
     * mặc định mới nhất của model. Dùng khi không có version hash đã verify (xem model-integration.md
     * mục "model-name endpoint") — đánh đổi: output có thể đổi nếu owner cập nhật model, nhưng tránh
     * rủi ro pin nhầm 1 hash không tồn tại/không verify được.
     */
    public ReplicatePrediction runAndWaitByModel(String owner, String name, Map<String, Object> input) {
        Map<String, Object> body = Map.of("input", input);
        return submitAndPoll(API_BASE + "/models/" + owner + "/" + name + "/predictions", body);
    }

    private ReplicatePrediction submitAndPoll(String createUrl, Map<String, Object> body) {
        ReplicatePrediction prediction = createPrediction(createUrl, body);

        int attempts = 0;
        while (!prediction.isTerminal() && attempts < MAX_POLL_ATTEMPTS) {
            sleep(POLL_INTERVAL);
            prediction = getPrediction(prediction.id());
            attempts++;
        }

        if (!prediction.isTerminal()) {
            throw new ReplicateException("Replicate prediction timed out sau " + (attempts * POLL_INTERVAL.getSeconds()) + "s");
        }
        if (!prediction.isSucceeded()) {
            throw new ReplicateException("Replicate prediction failed: " + prediction.error());
        }
        return prediction;
    }

    /** Tải file nhị phân kết quả (ảnh hoặc model 3D/GLB) từ URL Replicate trả về. */
    public byte[] downloadBytes(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                throw new ReplicateException("Không tải được file kết quả từ Replicate (HTTP " + response.statusCode() + ")");
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            throw new ReplicateException("Lỗi kết nối khi tải file kết quả từ Replicate: " + e.getMessage());
        }
    }

    /** Trích text đầu ra của model dạng vision/LLM: Replicate trả về String hoặc List&lt;String&gt; (nối từng token). */
    public static String extractTextOutput(Object output) {
        if (output instanceof List<?> list) {
            StringBuilder sb = new StringBuilder();
            for (Object part : list) {
                sb.append(part);
            }
            return sb.toString().trim();
        }
        if (output instanceof String s) {
            return s.trim();
        }
        throw new ReplicateException("Định dạng output không nhận diện được: " + (output == null ? "null" : output.getClass()));
    }

    /** Trích URL ảnh đầu ra của model text-to-image: Replicate trả về String hoặc List&lt;String&gt;. */
    public static String extractImageUrl(Object output) {
        if (output instanceof List<?> list && !list.isEmpty()) {
            return String.valueOf(list.get(0));
        }
        if (output instanceof String s) {
            return s;
        }
        throw new ReplicateException("Định dạng output ảnh không nhận diện được: " + (output == null ? "null" : output.getClass()));
    }

    /**
     * Trích URL file (mesh 3D/GLB, hoặc ảnh) từ output của model image-to-3D — BEST-EFFORT, CHƯA
     * VERIFY (xem ADR-0005): thử string trực tiếp → list (phần tử đầu) → map (thử các key phổ biến
     * "model_file"/"mesh"/"glb"). Cập nhật lại khi biết chính xác schema thật.
     */
    public static String extractFileUrl(Object output) {
        if (output instanceof String s) {
            return s;
        }
        if (output instanceof List<?> list && !list.isEmpty()) {
            return String.valueOf(list.get(0));
        }
        if (output instanceof Map<?, ?> map) {
            for (String key : List.of("model_file", "mesh", "glb")) {
                Object value = map.get(key);
                if (value != null) {
                    return String.valueOf(value);
                }
            }
        }
        throw new ReplicateException("Định dạng output file không nhận diện được: " + (output == null ? "null" : output.getClass()));
    }

    private ReplicatePrediction createPrediction(String createUrl, Map<String, Object> body) {
        try {
            String json = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(createUrl))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("Prefer", "wait")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseResponse(response);
        } catch (IOException | InterruptedException e) {
            throw new ReplicateException("Lỗi kết nối tới Replicate: " + e.getMessage());
        }
    }

    private ReplicatePrediction getPrediction(String id) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE + "/predictions/" + id))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return parseResponse(response);
        } catch (IOException | InterruptedException e) {
            throw new ReplicateException("Lỗi kết nối tới Replicate khi poll kết quả: " + e.getMessage());
        }
    }

    private ReplicatePrediction parseResponse(HttpResponse<String> response) {
        if (response.statusCode() == 401) {
            throw new ReplicateException("Replicate API key không hợp lệ (401)");
        }
        if (response.statusCode() == 429) {
            throw new ReplicateException("Replicate rate limit (429) — thử lại sau");
        }
        if (response.statusCode() >= 400) {
            throw new ReplicateException("Replicate trả lỗi HTTP " + response.statusCode() + ": " + truncate(response.body()));
        }
        try {
            JsonNode node = objectMapper.readTree(response.body());
            String id = node.path("id").asText(null);
            String status = node.path("status").asText(null);
            String error = node.path("error").isMissingNode() || node.path("error").isNull()
                    ? null : node.path("error").asText();
            Object output = node.has("output") && !node.get("output").isNull()
                    ? objectMapper.convertValue(node.get("output"), Object.class)
                    : null;
            return new ReplicatePrediction(id, status, output, error);
        } catch (IOException e) {
            throw new ReplicateException("Không parse được response từ Replicate: " + e.getMessage());
        }
    }

    private String truncate(String s) {
        return s != null && s.length() > 300 ? s.substring(0, 300) : s;
    }

    private void sleep(Duration duration) {
        try {
            Thread.sleep(duration.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ReplicateException("Bị interrupt khi chờ Replicate");
        }
    }
}
