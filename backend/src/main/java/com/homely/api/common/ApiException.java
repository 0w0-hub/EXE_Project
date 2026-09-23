package com.homely.api.common;

import org.springframework.http.HttpStatus;

/**
 * Exception nghiệp vụ có mã lỗi machine-readable ổn định (xem rules/api/error-format.md).
 */
public class ApiException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
