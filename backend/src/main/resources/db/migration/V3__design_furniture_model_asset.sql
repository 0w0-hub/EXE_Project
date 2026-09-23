-- ADR-0005 / TASK-006: mesh 3D thật (GLB) cho 1 món nội thất "hero" — nullable vì chỉ 1 món/job
-- có mesh, và provider mock/lỗi mesh vẫn để trống.
ALTER TABLE design_furniture_items ADD model_asset_id UNIQUEIDENTIFIER NULL;

ALTER TABLE design_furniture_items ADD CONSTRAINT fk_furniture_model_asset
    FOREIGN KEY (model_asset_id) REFERENCES assets(id);
