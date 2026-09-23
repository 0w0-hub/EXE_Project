package com.homely.api.aidesign;

import com.homely.api.aidesign.provider.DesignGenerationOutput;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tách riêng khỏi DesignJobProcessor để @Transactional thực sự áp dụng qua Spring proxy
 * (self-invocation trong cùng class sẽ bị bỏ qua bởi AOP proxy của Spring).
 */
@Component
public class DesignResultWriter {

    private final DesignResultRepository resultRepository;
    private final DesignFurnitureItemRepository furnitureItemRepository;
    private final DesignColorPaletteRepository colorPaletteRepository;

    public DesignResultWriter(DesignResultRepository resultRepository,
                               DesignFurnitureItemRepository furnitureItemRepository,
                               DesignColorPaletteRepository colorPaletteRepository) {
        this.resultRepository = resultRepository;
        this.furnitureItemRepository = furnitureItemRepository;
        this.colorPaletteRepository = colorPaletteRepository;
    }

    @Transactional
    public DesignResult write(DesignJob job, DesignGenerationOutput output) {
        DesignResult result = new DesignResult();
        result.setJobId(job.getId());
        result.setDecorDescription(output.decorDescription());
        result.setLayoutDescription(output.layoutDescription());
        result.setAiExplanation(output.aiExplanation());
        result.setEstimatedCost(output.estimatedCost());
        result.setResultAssetId(output.resultAssetId());
        result = resultRepository.save(result);

        for (var item : output.furniture()) {
            DesignFurnitureItem entity = new DesignFurnitureItem();
            entity.setResultId(result.getId());
            entity.setName(item.name());
            entity.setCategory(item.category());
            entity.setPosition(item.position());
            entity.setEstimatedCost(item.estimatedCost());
            entity.setModelAssetId(item.modelAssetId());
            furnitureItemRepository.save(entity);
        }

        for (var color : output.colors()) {
            DesignColorPalette entity = new DesignColorPalette();
            entity.setResultId(result.getId());
            entity.setColorHex(color.colorHex());
            entity.setRole(color.role());
            colorPaletteRepository.save(entity);
        }

        return result;
    }
}
