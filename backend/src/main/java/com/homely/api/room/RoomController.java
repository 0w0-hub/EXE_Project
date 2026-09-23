package com.homely.api.room;

import com.homely.api.common.ApiException;
import com.homely.api.common.ApiResponse;
import com.homely.api.common.CurrentUser;
import com.homely.api.room.dto.CreateRoomRequest;
import com.homely.api.room.dto.PreferenceResponse;
import com.homely.api.room.dto.RoomResponse;
import com.homely.api.room.dto.SavePreferenceRequest;
import com.homely.api.room.dto.UpdateRoomRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ApiResponse<RoomResponse> create(@Valid @RequestBody CreateRoomRequest request) {
        Room room = roomService.create(CurrentUser.id(), request);
        return ApiResponse.success(RoomResponse.from(room));
    }

    @GetMapping
    public ApiResponse<List<RoomResponse>> listMine() {
        List<RoomResponse> rooms = roomService.listMine(CurrentUser.id()).stream()
                .map(RoomResponse::from).toList();
        return ApiResponse.success(rooms);
    }

    @GetMapping("/{id}")
    public ApiResponse<RoomResponse> getOne(@PathVariable UUID id) {
        Room room = roomService.getOwned(CurrentUser.id(), id);
        return ApiResponse.success(RoomResponse.from(room));
    }

    @PatchMapping("/{id}")
    public ApiResponse<RoomResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateRoomRequest request) {
        Room room = roomService.updateDimensions(CurrentUser.id(), id, request);
        return ApiResponse.success(RoomResponse.from(room));
    }

    @PostMapping("/{id}/photo")
    public ApiResponse<RoomResponse> attachPhoto(@PathVariable UUID id, @RequestParam UUID assetId) {
        Room room = roomService.attachPhoto(CurrentUser.id(), id, assetId);
        return ApiResponse.success(RoomResponse.from(room));
    }

    @PostMapping("/{id}/preferences")
    public ApiResponse<PreferenceResponse> savePreference(@PathVariable UUID id,
                                                            @RequestBody SavePreferenceRequest request) {
        RoomPreference preference = roomService.savePreference(CurrentUser.id(), id, request);
        return ApiResponse.success(PreferenceResponse.from(preference));
    }

    @GetMapping("/{id}/preferences/{preferenceId}")
    public ApiResponse<PreferenceResponse> getPreference(@PathVariable UUID id, @PathVariable UUID preferenceId) {
        roomService.getOwned(CurrentUser.id(), id); // kiểm tra quyền sở hữu room
        RoomPreference preference = roomService.getPreference(preferenceId);
        if (!preference.getRoomId().equals(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PREFERENCE_NOT_FOUND", "Preference not found");
        }
        return ApiResponse.success(PreferenceResponse.from(preference));
    }
}
