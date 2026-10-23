package com.homely.api.common;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Payload phân trang, dùng làm `data` bên trong ApiResponse — xem rules/api/rest.md.
 * Không thêm field vào ApiResponse để tránh phải sửa interceptor axios ở frontend.
 */
public record PagedResponse<T>(List<T> items, PageMeta meta) {

    public static <T> PagedResponse<T> of(Page<T> page) {
        return new PagedResponse<>(page.getContent(), PageMeta.from(page));
    }
}
