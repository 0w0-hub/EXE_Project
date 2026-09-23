package com.homely.api.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Sinh & validate JWT access/refresh token — xem rules/security/authentication.md.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${homely.jwt.secret}") String secret,
            @Value("${homely.jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
            @Value("${homely.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        this.key = Keys.hmacShaKeyFor(pad(secret).getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    private static String pad(String secret) {
        // HS256 cần key >= 256 bit (32 byte); pad cho môi trường dev nếu secret ngắn.
        StringBuilder sb = new StringBuilder(secret);
        while (sb.length() < 32) {
            sb.append(secret);
        }
        return sb.toString();
    }

    public String generateAccessToken(UUID userId, String role) {
        return buildToken(userId, role, accessTokenExpirationMs, "access");
    }

    public String generateRefreshToken(UUID userId, String role) {
        return buildToken(userId, role, refreshTokenExpirationMs, "refresh");
    }

    private String buildToken(UUID userId, String role, long expirationMs, String tokenType) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role)
                .claim("type", tokenType)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }
}
