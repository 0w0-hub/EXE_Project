package com.homely.api.config;

import com.homely.api.billing.BillingService;
import com.homely.api.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminDataInitializerTest {
    @Test
    void bootstrapIsDisabledByDefault() {
        new ApplicationContextRunner().withUserConfiguration(AdminDataInitializer.class)
                .run(context -> assertThat(context).doesNotHaveBean(AdminDataInitializer.class));
    }

    @Test
    void bootstrapRejectsMissingCredentials() {
        assertThatThrownBy(() -> new AdminDataInitializer(mock(UserRepository.class),
                mock(PasswordEncoder.class), mock(BillingService.class), "", ""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void existingAdminIsNotOverwritten() {
        var users = mock(UserRepository.class);
        var encoder = mock(PasswordEncoder.class);
        var billing = mock(BillingService.class);
        when(users.existsByEmail("admin@example.com")).thenReturn(true);
        new AdminDataInitializer(users, encoder, billing, "admin@example.com", "test-password-123").run();
        verify(users, never()).save(any());
        verifyNoInteractions(encoder, billing);
    }
}
