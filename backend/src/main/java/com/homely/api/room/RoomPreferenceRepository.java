package com.homely.api.room;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RoomPreferenceRepository extends JpaRepository<RoomPreference, UUID> {
}
