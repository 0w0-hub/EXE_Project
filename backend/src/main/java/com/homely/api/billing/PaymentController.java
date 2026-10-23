package com.homely.api.billing;

import com.homely.api.billing.dto.CreatePaymentRequest;
import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PayOSService payOSService;

    public PaymentController(PayOSService payOSService) {
        this.payOSService = payOSService;
    }

    /**
     * Tạo link thanh toán PayOS. Cần user đăng nhập.
     */
    @PostMapping("/create-link")
    public ApiResponse<Map<String, String>> createPaymentLink(@RequestBody CreatePaymentRequest request) {
        String userId = CurrentUser.id().toString();
        String planCode = request.getPlanCode() != null ? request.getPlanCode() : "PLUS";
        String billing = request.getBilling() != null ? request.getBilling() : "monthly";

        Map<String, String> result = payOSService.createPaymentLink(userId, planCode, billing);
        return ApiResponse.success(result);
    }

    /**
     * Webhook từ PayOS callback khi user chuyển khoản/quét QR thành công.
     */
    @PostMapping("/webhook")
    public ApiResponse<Map<String, Object>> handleWebhook(@RequestBody Object webhookPayload) {
        payOSService.handleWebhook(webhookPayload);
        return ApiResponse.success(Map.of("message", "Webhook processed successfully"));
    }

    /**
     * Kiểm tra trạng thái đơn hàng (đã PAID hay chưa).
     */
    @GetMapping("/orders/{orderId}/status")
    public ApiResponse<Map<String, Object>> getOrderStatus(@PathVariable String orderId) {
        return ApiResponse.success(payOSService.getOrderStatus(orderId));
    }
}
