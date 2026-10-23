-- ADR-0005 / TASK-006: mesh 3D thật (GLB) cho 1 món nội thất "hero" (SQLite compatible)
ALTER TABLE design_furniture_items ADD COLUMN model_asset_id VARCHAR(36) NULL;
