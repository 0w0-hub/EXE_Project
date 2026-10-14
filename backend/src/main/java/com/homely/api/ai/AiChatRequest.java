package com.homely.api.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AiChatRequest(
        @NotEmpty @Size(max = 20) List<@Valid @NotNull Message> messages
) {
    public record Message(
            @NotNull @Pattern(regexp = "user|assistant") String role,
            @NotNull @Size(max = 4000) String content
    ) {}
}
