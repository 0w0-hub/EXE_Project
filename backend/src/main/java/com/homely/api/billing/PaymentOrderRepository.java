package com.homely.api.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, String> {
    Optional<PaymentOrder> findByOrderCode(Long orderCode);
}
