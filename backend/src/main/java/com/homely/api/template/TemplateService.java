package com.homely.api.template;

import com.homely.api.common.ApiException;
import com.homely.api.template.dto.TemplateResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TemplateService {

    private final DesignTemplateRepository templateRepository;

    public TemplateService(DesignTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    public List<TemplateResponse> list(String category) {
        List<DesignTemplate> templates = (category != null && !category.isBlank())
                ? templateRepository.findByCategory(category)
                : templateRepository.findAll();
        return templates.stream().map(TemplateResponse::from).toList();
    }

    public List<String> listCategories() {
        return templateRepository.findDistinctCategories();
    }

    public TemplateResponse getById(UUID id) {
        DesignTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND", "Template not found"));
        return TemplateResponse.from(template);
    }
}
