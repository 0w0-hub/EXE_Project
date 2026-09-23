package com.homely.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homely.api.auth.JwtAuthFilter;
import com.homely.api.common.ApiResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, ObjectMapper objectMapper) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // TASK-083: đổi mật khẩu yêu cầu đăng nhập — matcher cụ thể này PHẢI đứng trước
                        // "/api/v1/auth/**" permitAll() bên dưới để không bị permitAll nuốt mất.
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/auth/password").authenticated()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/plans").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/templates/**").permitAll()
                        // TASK-078: trang chia sẻ liên kết công khai (view-only) + bình luận — không cần đăng nhập.
                        .requestMatchers("/api/v1/public/**").permitAll()
                        // Defense-in-depth: dù đã có @PreAuthorize trên từng method admin,
                        // matcher này đảm bảo endpoint admin mới thêm sau mà quên @PreAuthorize
                        // vẫn fail-closed (403) thay vì vô tình mở cho mọi user đã đăng nhập.
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        // Filter-chain-level denials (URL matchers, trước khi vào controller) không
                        // đi qua GlobalExceptionHandler — phải map JSON body ở đây để đồng bộ format
                        // với rules/api/error-format.md. @PreAuthorize-level denials (đi qua controller)
                        // vẫn được GlobalExceptionHandler xử lý như bình thường.
                        .accessDeniedHandler(accessDeniedHandler())
                        .authenticationEntryPoint(authenticationEntryPoint())
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> writeJsonError(response, 403, "ACCESS_DENIED",
                "Bạn không có quyền thực hiện hành động này");
    }

    private AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, ex) -> writeJsonError(response, 401, "UNAUTHENTICATED",
                "Vui lòng đăng nhập để tiếp tục");
    }

    private void writeJsonError(jakarta.servlet.http.HttpServletResponse response, int status,
                                 String code, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.error(code, message)));
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
