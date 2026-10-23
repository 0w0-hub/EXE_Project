package com.homely.api.aidesign.provider;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MockAiDesignProviderTest {

    private final MockAiDesignProvider provider = new MockAiDesignProvider();

    @Test
    void generate_shouldReturnFullOutputStructure() {
        UUID photoAssetId = UUID.randomUUID();
        DesignGenerationInput input = new DesignGenerationInput(
                UUID.randomUUID(), "Phòng khách", 4.0, 5.0, photoAssetId,
                "Scandinavian", "trắng, xanh", "muốn giữ sofa cũ", 30_000_000L, "cần nhiều ánh sáng tự nhiên"
        );

        DesignGenerationOutput output = provider.generate(input);

        assertThat(output.decorDescription()).contains("Scandinavian");
        assertThat(output.layoutDescription()).isNotBlank();
        assertThat(output.aiExplanation()).contains("Phòng khách");
        assertThat(output.furniture()).isNotEmpty();
        assertThat(output.colors()).isNotEmpty();
        assertThat(output.estimatedCost())
                .isEqualTo(output.furniture().stream().mapToLong(DesignGenerationOutput.FurnitureItem::estimatedCost).sum());
        assertThat(output.resultAssetId()).isEqualTo(photoAssetId);
    }

    @Test
    void generate_withoutBudget_shouldFallBackToDefaultBudget() {
        DesignGenerationInput input = new DesignGenerationInput(
                UUID.randomUUID(), "Phòng ngủ", null, null, null, null, null, null, null, null
        );

        DesignGenerationOutput output = provider.generate(input);

        assertThat(output.estimatedCost()).isGreaterThan(0);
        assertThat(output.resultAssetId()).isNull();
    }
}
