package com.homely.api.config;

import com.homely.api.billing.BillingService;
import com.homely.api.user.User;
import com.homely.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "homely.admin.bootstrap-enabled", havingValue = "true")
public class AdminDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDataInitializer.class);

    private final String adminEmail;
    private final String adminPassword;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BillingService billingService;

    public AdminDataInitializer(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 BillingService billingService,
                                 @Value("${HOMELY_ADMIN_EMAIL:}") String adminEmail,
                                 @Value("${HOMELY_ADMIN_PASSWORD:}") String adminPassword) {
        if (adminEmail.isBlank() || adminPassword.length() < 12) {
            throw new IllegalArgumentException("Admin bootstrap requires HOMELY_ADMIN_EMAIL and HOMELY_ADMIN_PASSWORD (at least 12 characters)");
        }
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.billingService = billingService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }
        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setFullName("Admin");
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole("ADMIN");
        admin = userRepository.save(admin);
        billingService.assignFreePlanToNewUser(admin.getId());
        log.info("Admin user created: {}", adminEmail);
    }
}
