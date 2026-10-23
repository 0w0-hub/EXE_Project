package com.homely.api.admin.dto;

import java.util.Map;

public record AdminDashboardResponse(long totalUsers, long totalRooms, long totalDesignJobs,
                                      Map<String, Long> designJobsByStatus) {
}
