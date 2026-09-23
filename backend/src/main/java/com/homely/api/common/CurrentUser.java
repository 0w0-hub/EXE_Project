package com.homely.api.common;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Helper lấy id/role user hiện tại từ SecurityContext (được JwtAuthFilter set principal = UUID,
 * authority = ROLE_<role>).
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static UUID id() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Not authenticated");
    }

    public static String role() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Not authenticated"));
    }

    public static boolean isAdmin() {
        return "ADMIN".equals(role());
    }
}
