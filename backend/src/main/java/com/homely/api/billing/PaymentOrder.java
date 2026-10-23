package com.homely.api.billing;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_orders")
@Getter
@Setter
public class PaymentOrder {

    @Id
    @Column(columnDefinition = "TEXT")
    private String id;

    @Column(name = "user_id", nullable = false, columnDefinition = "TEXT")
    private String userId;

    @Column(name = "plan_code", nullable = false, columnDefinition = "TEXT")
    private String planCode;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String billing;

    @Column(name = "order_code", nullable = false, unique = true)
    private Long orderCode;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String status;

    @Column(name = "checkout_url", columnDefinition = "TEXT")
    private String checkoutUrl;

    @Column(name = "created_at", nullable = false)
    private Long createdAt;

    @Column(name = "paid_at")
    private Long paidAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null)
            this.id = UUID.randomUUID().toString();
        if (this.createdAt == null)
            this.createdAt = Instant.now().toEpochMilli();
        if (this.status == null)
            this.status = "PENDING";
    }
}
