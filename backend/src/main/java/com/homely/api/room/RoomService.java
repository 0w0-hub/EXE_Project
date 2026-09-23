package com.homely.api.room;

import com.homely.api.common.ApiException;
import com.homely.api.room.dto.CreateRoomRequest;
import com.homely.api.room.dto.SavePreferenceRequest;
import com.homely.api.room.dto.UpdateRoomRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomPreferenceRepository preferenceRepository;

    public RoomService(RoomRepository roomRepository, RoomPreferenceRepository preferenceRepository) {
        this.roomRepository = roomRepository;
        this.preferenceRepository = preferenceRepository;
    }

    public Room create(UUID ownerId, CreateRoomRequest request) {
        Room room = new Room();
        room.setOwnerId(ownerId);
        room.setRoomType(request.roomType());
        room.setWidthMeters(request.widthMeters());
        room.setLengthMeters(request.lengthMeters());
        return roomRepository.save(room);
    }

    public List<Room> listMine(UUID ownerId) {
        return roomRepository.findByOwnerId(ownerId);
    }

    public Room getOwned(UUID ownerId, UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Room not found"));
        if (!room.getOwnerId().equals(ownerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ROOM_ACCESS_DENIED", "Bạn không có quyền truy cập room này");
        }
        return room;
    }

    /**
     * TASK-104: tra cứu room KHÔNG kiểm tra ownership — chỉ dùng bởi Admin Data Explorer (tra ngược
     * "job này của ai" cần đọc room của job dù admin không phải chủ sở hữu). RBAC ADMIN đã chặn ở
     * tầng controller/SecurityConfig, không phải lỗ hổng — khác getOwned() ở trên vốn dùng cho chính
     * chủ sở hữu.
     */
    public Room getById(UUID roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Room not found"));
    }

    /** Đổi kích thước room sau khi đã tạo (TASK-007) — dùng khi user kéo tường trong Room3DViewer. */
    public Room updateDimensions(UUID ownerId, UUID roomId, UpdateRoomRequest request) {
        Room room = getOwned(ownerId, roomId);
        room.setWidthMeters(request.widthMeters());
        room.setLengthMeters(request.lengthMeters());
        return roomRepository.save(room);
    }

    public Room attachPhoto(UUID ownerId, UUID roomId, UUID assetId) {
        Room room = getOwned(ownerId, roomId);
        room.setPhotoAssetId(assetId);
        return roomRepository.save(room);
    }

    public RoomPreference savePreference(UUID ownerId, UUID roomId, SavePreferenceRequest request) {
        getOwned(ownerId, roomId); // kiểm tra ownership
        RoomPreference preference = new RoomPreference();
        preference.setRoomId(roomId);
        preference.setStyle(request.style());
        preference.setPreferredColors(request.preferredColors());
        preference.setDesiredFurniture(request.desiredFurniture());
        preference.setBudget(request.budget());
        preference.setFreeTextRequest(request.freeTextRequest());
        return preferenceRepository.save(preference);
    }

    public RoomPreference getPreference(UUID preferenceId) {
        return preferenceRepository.findById(preferenceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PREFERENCE_NOT_FOUND", "Preference not found"));
    }

    /** TASK-087: lookup an toàn (không throw) — dùng bởi aidesign module khi build dữ liệu export
     *  cá nhân, tránh phải try/catch ApiException chỉ để lấy style nếu có. */
    public Optional<RoomPreference> findPreferenceById(UUID preferenceId) {
        return preferenceRepository.findById(preferenceId);
    }

    /** Dùng bởi admin module để đếm tổng số room — admin không đọc RoomRepository trực tiếp. */
    public long countAll() {
        return roomRepository.count();
    }

    /** Dùng bởi aidesign module để resolve roomType hàng loạt cho danh sách job — tránh N+1 query
     *  và tránh aidesign đọc trực tiếp RoomRepository (vi phạm ranh giới module). */
    public Map<UUID, Room> findByIds(List<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return roomRepository.findAllById(ids).stream().collect(Collectors.toMap(Room::getId, r -> r));
    }

    /**
     * TASK-106: batch lookup RoomPreference theo id — dùng để tính "tên tự sinh" (roomType · style ·
     * kích thước) cho danh sách thiết kế (DesignService.buildSuggestedName). Cùng lý do tồn tại như
     * findByIds ở trên: tránh N+1 và tránh aidesign đọc trực tiếp RoomPreferenceRepository (vi phạm
     * ranh giới module, xem TASK-104).
     */
    public Map<UUID, RoomPreference> findPreferencesByIds(List<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return preferenceRepository.findAllById(ids).stream().collect(Collectors.toMap(RoomPreference::getId, p -> p));
    }

    /**
     * TASK-111: trong danh sách roomId truyền vào, trả về đúng những id KHÔNG tồn tại trong bảng
     * rooms — dùng bởi aidesign module (DesignService.findOrphanJobRoomRefIds, Admin Data Integrity
     * Checker) để tìm design_jobs.room_id mồ côi. Giữ đúng hướng phụ thuộc 1 chiều aidesign -> room
     * đã có sẵn (DesignService đã inject RoomService) — room KHÔNG gọi ngược lại aidesign, không vi
     * phạm ranh giới module (rules/architecture/service-boundaries.md).
     */
    public Set<UUID> findMissingRoomIds(Collection<UUID> roomIds) {
        if (roomIds.isEmpty()) {
            return Set.of();
        }
        Set<UUID> existing = roomRepository.findAllById(roomIds).stream().map(Room::getId).collect(Collectors.toSet());
        Set<UUID> missing = new HashSet<>(roomIds);
        missing.removeAll(existing);
        return missing;
    }

    /** TASK-111: cùng lý do/pattern với findMissingRoomIds ở trên, áp dụng cho bảng room_preferences
     *  (design_jobs.preference_id mồ côi). */
    public Set<UUID> findMissingPreferenceIds(Collection<UUID> preferenceIds) {
        if (preferenceIds.isEmpty()) {
            return Set.of();
        }
        Set<UUID> existing = preferenceRepository.findAllById(preferenceIds).stream()
                .map(RoomPreference::getId).collect(Collectors.toSet());
        Set<UUID> missing = new HashSet<>(preferenceIds);
        missing.removeAll(existing);
        return missing;
    }
}
