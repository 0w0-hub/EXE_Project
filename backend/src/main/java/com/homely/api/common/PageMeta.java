package com.homely.api.common;

import org.springframework.data.domain.Page;

/**
 * Metadata phân trang — đóng gói cùng danh sách item trong PagedResponse, không sửa ApiResponse.
 */
public record PageMeta(int page, int size, long totalElements, int totalPages) {

    public static PageMeta from(Page<?> page) {
        return new PageMeta(page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
