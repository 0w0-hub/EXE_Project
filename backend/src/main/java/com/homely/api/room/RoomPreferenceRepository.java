package com.homely.api.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RoomPreferenceRepository extends JpaRepository<RoomPreference, UUID> {

    /** Phong cách phòng phổ biến — trả về [style, count] giảm dần. */
    @Query(value = "SELECT style, COUNT(*) AS cnt FROM room_preferences " +
                   "WHERE style IS NOT NULL AND style <> '' " +
                   "GROUP BY style ORDER BY cnt DESC LIMIT 20",
           nativeQuery = true)
    List<Object[]> countByStyleGrouped();
}
