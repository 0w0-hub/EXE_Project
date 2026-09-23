package com.homely.api.aidesign;

import com.homely.api.aidesign.provider.AiDesignProvider;
import com.homely.api.aidesign.provider.DesignGenerationInput;
import com.homely.api.aidesign.provider.DesignGenerationOutput;
import com.homely.api.notification.NotificationService;
import com.homely.api.room.Room;
import com.homely.api.room.RoomPreference;
import com.homely.api.room.RoomPreferenceRepository;
import com.homely.api.room.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Xử lý generation job bất đồng bộ — xem rules/architecture/scalability.md.
 * Nâng cấp lên message queue thật nếu tải tăng (hiện tại đủ cho MVP với @Async).
 */
@Component
public class DesignJobProcessor {

    private static final Logger log = LoggerFactory.getLogger(DesignJobProcessor.class);

    private final DesignJobRepository jobRepository;
    private final DesignResultWriter resultWriter;
    private final RoomRepository roomRepository;
    private final RoomPreferenceRepository preferenceRepository;
    private final AiDesignProvider aiDesignProvider;
    private final NotificationService notificationService;

    public DesignJobProcessor(DesignJobRepository jobRepository,
                              DesignResultWriter resultWriter,
                              RoomRepository roomRepository,
                              RoomPreferenceRepository preferenceRepository,
                              AiDesignProvider aiDesignProvider,
                              NotificationService notificationService) {
        this.jobRepository = jobRepository;
        this.resultWriter = resultWriter;
        this.roomRepository = roomRepository;
        this.preferenceRepository = preferenceRepository;
        this.aiDesignProvider = aiDesignProvider;
        this.notificationService = notificationService;
    }

    @Async
    public void process(UUID jobId) {
        DesignJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.warn("DesignJob {} not found when processing", jobId);
            return;
        }

        job.setStatus("PROCESSING");
        jobRepository.save(job);

        try {
            DesignGenerationOutput output = runProvider(job);
            resultWriter.write(job, output);
            job.setStatus("COMPLETED");
            jobRepository.save(job);
            notificationService.notifyJobStatus(job); // TASK-082: báo cho user job đã xong
        } catch (Exception ex) {
            log.error("DesignJob {} failed", jobId, ex);
            job.setStatus("FAILED");
            job.setErrorMessage(ex.getMessage() != null ? ex.getMessage() : "Unknown error");
            jobRepository.save(job);
            notificationService.notifyJobStatus(job); // TASK-082: báo cho user job thất bại
        }
    }

    private DesignGenerationOutput runProvider(DesignJob job) {
        Room room = roomRepository.findById(job.getRoomId())
                .orElseThrow(() -> new IllegalStateException("Room không còn tồn tại"));
        RoomPreference preference = job.getPreferenceId() != null
                ? preferenceRepository.findById(job.getPreferenceId()).orElse(null)
                : null;

        DesignGenerationInput input = new DesignGenerationInput(
                job.getOwnerId(),
                room.getRoomType(),
                room.getWidthMeters(),
                room.getLengthMeters(),
                room.getPhotoAssetId(),
                preference != null ? preference.getStyle() : null,
                preference != null ? preference.getPreferredColors() : null,
                preference != null ? preference.getDesiredFurniture() : null,
                preference != null ? preference.getBudget() : null,
                preference != null ? preference.getFreeTextRequest() : null
        );
        return aiDesignProvider.generate(input);
    }
}
