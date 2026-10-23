package com.homely.api.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByOwnerId(UUID ownerId);

    /** Users đã tạo ít nhất 1 phòng (dùng cho funnel). */
    @Query("SELECT COUNT(DISTINCT r.ownerId) FROM Room r")
    long countDistinctOwners();
}
