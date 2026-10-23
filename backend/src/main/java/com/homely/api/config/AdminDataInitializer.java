package com.homely.api.config;

import com.homely.api.billing.BillingService;
import com.homely.api.user.User;
import com.homely.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDataInitializer.class);

    private static final String ADMIN_EMAIL = "admin@gmail.com";
    private static final String ADMIN_PASSWORD = "123456";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BillingService billingService;

    public AdminDataInitializer(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 BillingService billingService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.billingService = billingService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }
        User admin = new User();
        admin.setEmail(ADMIN_EMAIL);
        admin.setFullName("Admin");
        admin.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setRole("ADMIN");
        admin = userRepository.save(admin);
        billingService.assignFreePlanToNewUser(admin.getId());
        log.info("Admin user created: {}", ADMIN_EMAIL);
    }
}
