package com.homely.api.config;

import com.homely.api.aidesign.DesignJob;
import com.homely.api.aidesign.DesignJobRepository;
import com.homely.api.billing.Plan;
import com.homely.api.billing.PlanRepository;
import com.homely.api.billing.Subscription;
import com.homely.api.billing.SubscriptionRepository;
import com.homely.api.design.DesignStudioService;
import com.homely.api.room.Room;
import com.homely.api.room.RoomRepository;
import com.homely.api.user.User;
import com.homely.api.user.UserRepository;
import com.homely.api.model.FurnitureModelRepository;
import com.homely.api.model.ModelCollectionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final DesignJobRepository jobRepository;
    private final RoomRepository roomRepository;
    private final DesignStudioService designStudioService;
    private final FurnitureModelRepository furnitureModelRepository;
    private final ModelCollectionRepository modelCollectionRepository;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           PlanRepository planRepository,
                           SubscriptionRepository subscriptionRepository,
                           DesignJobRepository jobRepository,
                           RoomRepository roomRepository,
                           DesignStudioService designStudioService,
                           FurnitureModelRepository furnitureModelRepository,
                           ModelCollectionRepository modelCollectionRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.jobRepository = jobRepository;
        this.roomRepository = roomRepository;
        this.designStudioService = designStudioService;
        this.furnitureModelRepository = furnitureModelRepository;
        this.modelCollectionRepository = modelCollectionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Khởi tạo tài khoản ADMIN mặc định nếu chưa tồn tại
        String adminEmail = "admin@gmail.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setFullName("System Admin");
            admin.setPasswordHash(passwordEncoder.encode("123456"));
            admin.setRole("ADMIN");
            admin = userRepository.save(admin);

            Plan proPlan = planRepository.findByCode("STUDIO")
                    .orElseGet(() -> planRepository.findByCode("FREE").orElse(null));

            if (proPlan != null && subscriptionRepository.findByUserId(admin.getId()).isEmpty()) {
                Subscription sub = new Subscription();
                sub.setUserId(admin.getId());
                sub.setPlan(proPlan);
                sub.setStatus("ACTIVE");
                subscriptionRepository.save(sub);
            }

            log.info("Initialized default ADMIN account: {} / password: {}", adminEmail, "123456");
        }

        // 2. Chuyển đổi tự động dữ liệu phòng cũ sang dữ liệu phòng mới (3D Decor Studio scene JSON)
        List<DesignJob> legacyJobs = jobRepository.findAll().stream()
                .filter(j -> j.getSceneData() == null || j.getSceneData().trim().isEmpty())
                .filter(j -> j.getDeletedAt() == null && !"PURGED".equals(j.getStatus()))
                .toList();

        if (!legacyJobs.isEmpty()) {
            for (DesignJob job : legacyJobs) {
                Room room = (job.getRoomId() != null) ? roomRepository.findById(job.getRoomId()).orElse(null) : null;
                String convertedJson = designStudioService.generateDefaultSceneJson(room);
                job.setSceneData(convertedJson);
                jobRepository.save(job);
            }
            log.info("Successfully converted {} legacy room design jobs to 3D Decor Studio scene JSON format", legacyJobs.size());
        }

        // 3. Ghi nhận tình trạng kho mô hình 3D Decor Studio trong CSDL
        long totalModels = furnitureModelRepository.count();
        long realisticModels = furnitureModelRepository.findByCollectionIdAndStatusOrderBySortOrderAsc("col-modern-realistic", "ACTIVE").size();
        long stylizedModels = furnitureModelRepository.findByCollectionIdAndStatusOrderBySortOrderAsc("col-stylized-kenney", "ACTIVE").size();
        log.info("Homely 3D Furniture Models Status: {} total models in DB (Realistic PBR: {}, Stylized Kenney: {})",
                totalModels, realisticModels, stylizedModels);
    }
}
