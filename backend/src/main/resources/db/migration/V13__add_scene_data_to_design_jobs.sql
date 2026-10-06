-- Homely V13: Add scene_data to design_jobs for 3D Decor Studio persistence
ALTER TABLE design_jobs ADD COLUMN scene_data TEXT NULL;
