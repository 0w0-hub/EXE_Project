package com.homely.api.design;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homely.api.aidesign.DesignJob;
import com.homely.api.aidesign.DesignJobRepository;
import com.homely.api.aidesign.DesignResult;
import com.homely.api.aidesign.DesignResultRepository;
import com.homely.api.common.ApiException;
import com.homely.api.design.dto.DesignResponse;
import com.homely.api.design.dto.DesignSummaryResponse;
import com.homely.api.design.dto.SaveDesignRequest;
import com.homely.api.room.Room;
import com.homely.api.room.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class DesignStudioService {

    private static final Logger log = LoggerFactory.getLogger(DesignStudioService.class);

    private final DesignJobRepository jobRepository;
    private final RoomRepository roomRepository;
    private final DesignResultRepository resultRepository;
    private final ObjectMapper objectMapper;

    public DesignStudioService(DesignJobRepository jobRepository,
                               RoomRepository roomRepository,
                               DesignResultRepository resultRepository,
                               ObjectMapper objectMapper) {
        this.jobRepository = jobRepository;
        this.roomRepository = roomRepository;
        this.resultRepository = resultRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Lưu hoặc cập nhật thiết kế 3D Decor:
     * - Nếu id != null: CẬP NHẬT (Update) scene_data và custom_name của DesignJob hiện tại.
     * - Nếu id == null: TẠO MỚI (Create) Room + DesignJob (status = COMPLETED) để hiển thị trong /projects.
     */
    @Transactional
    public DesignResponse saveOrUpdate(UUID userId, SaveDesignRequest request) {
        String designName = (request.name() != null && !request.name().trim().isEmpty())
                ? request.name().trim()
                : "Phòng 3D " + LocalDate.now();

        double[] dimensions = extractRoomDimensions(request.data());
        double width = dimensions[0];
        double length = dimensions[1];

        // 1. Cập nhật thiết kế đã tồn tại
        if (request.id() != null) {
            DesignJob job = jobRepository.findById(request.id())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Không tìm thấy thiết kế"));

            if (!job.getOwnerId().equals(userId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Bạn không có quyền sửa thiết kế này");
            }

            job.setCustomName(designName);
            job.setSceneData(request.data());
            job.setUpdatedAt(Instant.now());

            // Đồng bộ kích thước sang Room nếu có
            if (job.getRoomId() != null) {
                roomRepository.findById(job.getRoomId()).ifPresent(room -> {
                    room.setWidthMeters(width);
                    room.setLengthMeters(length);
                    roomRepository.save(room);
                });
            }

            DesignJob saved = jobRepository.save(job);
            log.info("Updated existing DesignJob {} for user {}", saved.getId(), userId);
            return toResponse(saved);
        }

        // 2. Tạo mới hoàn toàn Room + DesignJob
        Room room = new Room();
        room.setOwnerId(userId);
        room.setRoomType(designName);
        room.setWidthMeters(width);
        room.setLengthMeters(length);
        Room savedRoom = roomRepository.save(room);

        DesignJob job = new DesignJob();
        job.setRoomId(savedRoom.getId());
        job.setOwnerId(userId);
        job.setStatus("COMPLETED");
        job.setCustomName(designName);
        job.setSceneData(request.data());
        DesignJob savedJob = jobRepository.save(job);

        DesignResult result = new DesignResult();
        result.setJobId(savedJob.getId());
        result.setLayoutDescription("Bản thiết kế 3D Decor Studio");
        resultRepository.save(result);

        log.info("Created new DesignJob {} with Room {} for user {}", savedJob.getId(), savedRoom.getId(), userId);
        return toResponse(savedJob);
    }

    /**
     * Tải dữ liệu thiết kế 3D theo ID:
     * Tự động chuyển đổi dữ liệu phòng cũ (nếu chưa có scene_data) sang cấu trúc JSON 3D Studio chuẩn.
     */
    @Transactional
    public DesignResponse getById(UUID userId, UUID id) {
        DesignJob job = jobRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Không tìm thấy thiết kế"));

        if (!job.getOwnerId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Bạn không có quyền xem thiết kế này");
        }

        if (job.getDeletedAt() != null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Thiết kế này đã nằm trong thùng rác");
        }

        // Nếu chưa có sceneData (phòng cũ): tự động convert từ Room sang scene JSON
        if (job.getSceneData() == null || job.getSceneData().trim().isEmpty()) {
            Room room = (job.getRoomId() != null) ? roomRepository.findById(job.getRoomId()).orElse(null) : null;
            String convertedJson = generateDefaultSceneJson(room);
            job.setSceneData(convertedJson);
            jobRepository.save(job);
            log.info("Auto-migrated legacy DesignJob {} to 3D scene JSON format", job.getId());
        }

        return toResponse(job);
    }

    /**
     * Lấy danh sách các bản thiết kế của người dùng hiện tại
     */
    @Transactional(readOnly = true)
    public List<DesignSummaryResponse> listMine(UUID userId) {
        return jobRepository.findByOwnerId(userId, PageRequest.of(0, 50, Sort.by("updatedAt").descending()))
                .stream()
                .filter(job -> job.getDeletedAt() == null && !"PURGED".equals(job.getStatus()))
                .map(job -> new DesignSummaryResponse(
                        job.getId(),
                        job.getCustomName() != null ? job.getCustomName() : "Thiết kế phòng",
                        job.getCreatedAt(),
                        job.getUpdatedAt()
                ))
                .toList();
    }

    /**
     * Xóa mềm bản thiết kế (đưa vào thùng rác)
     */
    @Transactional
    public void delete(UUID userId, UUID id) {
        DesignJob job = jobRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "JOB_NOT_FOUND", "Không tìm thấy thiết kế"));

        if (!job.getOwnerId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Bạn không có quyền xóa thiết kế này");
        }

        job.setDeletedAt(Instant.now());
        jobRepository.save(job);
        log.info("Soft-deleted DesignJob {} for user {}", id, userId);
    }

    /**
     * Chuyển đổi dữ liệu phòng cũ (Room) thành chuỗi JSON 3D Studio chuẩn
     */
    public String generateDefaultSceneJson(Room room) {
        double width = (room != null && room.getWidthMeters() != null) ? room.getWidthMeters() : 4.0;
        double length = (room != null && room.getLengthMeters() != null) ? room.getLengthMeters() : 5.0;

        return String.format(
                "{\"version\":\"2.0\",\"migratedFrom\":\"legacy-room\",\"room\":{\"width\":%.2f,\"length\":%.2f,\"height\":2.80,\"wallColor\":\"#f8fafc\",\"floorColor\":\"#e2e8f0\",\"wallMaterialId\":\"paint-white\",\"floorMaterialId\":\"wood-oak\"},\"wallGraph\":null,\"items\":[]}",
                width, length
        );
    }

    private double[] extractRoomDimensions(String json) {
        try {
            if (json != null && !json.trim().isEmpty()) {
                JsonNode root = objectMapper.readTree(json);
                JsonNode roomNode = root.get("room");
                if (roomNode != null) {
                    double width = roomNode.has("width") ? roomNode.get("width").asDouble(4.0) : 4.0;
                    double length = roomNode.has("length") ? roomNode.get("length").asDouble(5.0) : 5.0;
                    return new double[]{width, length};
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse room dimensions from json: {}", e.getMessage());
        }
        return new double[]{4.0, 5.0};
    }

    private DesignResponse toResponse(DesignJob job) {
        String name = job.getCustomName() != null ? job.getCustomName() : "Thiết kế phòng";
        return new DesignResponse(
                job.getId(),
                job.getOwnerId(),
                name,
                job.getSceneData(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }
}
