package com.homely.api.sharing.dto;

import com.homely.api.sharing.DesignComment;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(UUID id, String authorName, String message, Instant createdAt) {
    public static CommentResponse from(DesignComment comment) {
        return new CommentResponse(comment.getId(), comment.getAuthorName(), comment.getMessage(), comment.getCreatedAt());
    }
}
