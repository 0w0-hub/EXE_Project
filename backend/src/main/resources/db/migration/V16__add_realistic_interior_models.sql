-- V16: Bổ sung 216 mô hình 3D nội thất cao cấp tả thực (Realistic PBR) từ kho 3D_Models/GLB
-- Thuộc bộ sưu tập 'col-modern-realistic', tất cả đều là mô hình cao cấp (tier: premium, required_plan: PLUS / STUDIO)

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-airer-clothes', 'real-airer-clothes', 'Giá Phơi Quần Áo Đa Năng', 'col-modern-realistic', 'bathroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Airer_Clothes.glb', NULL, 0.9, 1.4, 0.6, false, false, 'ACTIVE', 1001, 'bathroom, decor, realistic, pbr, airer, clothes', '{"defaultColor":"#475569","description":"Giá Phơi Quần Áo Đa Năng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-appliance-cooker', 'real-appliance-cooker', 'Bếp Nấu Ăn Đôi Cao Cấp', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Appliance_Cooker.glb', NULL, 0.75, 0.85, 0.6, true, false, 'ACTIVE', 1002, 'kitchen, decor, realistic, pbr, appliance, cooker', '{"defaultColor":"#475569","description":"Bếp Nấu Ăn Đôi Cao Cấp phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-appliance-dishwasher', 'real-appliance-dishwasher', 'Máy Rửa Bát Âm Tủ', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Appliance_Dishwasher.glb', NULL, 0.6, 0.85, 0.6, false, false, 'ACTIVE', 1003, 'kitchen, decor, realistic, pbr, appliance, dishwasher', '{"defaultColor":"#475569","description":"Máy Rửa Bát Âm Tủ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-appliance-extractor', 'real-appliance-extractor', 'Máy Hút Mùi Treo Tường', 'col-modern-realistic', 'kitchen', 'decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Appliance_Extractor.glb', NULL, 0.9, 0.7, 0.5, false, false, 'ACTIVE', 1004, 'kitchen, decor, realistic, pbr, appliance, extractor', '{"defaultColor":"#475569","description":"Máy Hút Mùi Treo Tường phong cách hiện đại tả thực PBR sắc nét","icon":"Wind"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-appliance-fridge', 'real-appliance-fridge', 'Tủ Lạnh Side-by-Side 2 Cánh', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Appliance_Fridge.glb', NULL, 0.95, 1.85, 0.75, false, false, 'ACTIVE', 1005, 'kitchen, storage, realistic, pbr, appliance, fridge', '{"defaultColor":"#475569","description":"Tủ Lạnh Side-by-Side 2 Cánh phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-appliance-microwave', 'real-appliance-microwave', 'Lò Vi Sóng Để Bàn', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Appliance_Microwave.glb', NULL, 0.55, 0.35, 0.4, false, true, 'ACTIVE', 1006, 'kitchen, decor, realistic, pbr, appliance, microwave', '{"defaultColor":"#475569","description":"Lò Vi Sóng Để Bàn phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-appliance-washer', 'real-appliance-washer', 'Máy Giặt Cửa Ngang Inverter', 'col-modern-realistic', 'bathroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Appliance_Washer.glb', NULL, 0.6, 0.85, 0.6, false, false, 'ACTIVE', 1007, 'bathroom, decor, realistic, pbr, appliance, washer', '{"defaultColor":"#475569","description":"Máy Giặt Cửa Ngang Inverter phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-arch-garden', 'real-arch-garden', 'Cổng Vòm Sân Vườn Nghệ Thuật', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Arch_Garden.glb', NULL, 1.4, 2.3, 0.5, false, false, 'ACTIVE', 1008, 'decor, decor, realistic, pbr, arch, garden', '{"defaultColor":"#475569","description":"Cổng Vòm Sân Vườn Nghệ Thuật phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-art-framed', 'real-art-framed', 'Tranh Treo Tường Khung Gỗ Nghệ Thuật', 'col-modern-realistic', 'wall-decor', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Art_Framed.glb', NULL, 1, 0.75, 0.05, false, false, 'ACTIVE', 1009, 'wall-decor, wall-decor, realistic, pbr, art, framed', '{"defaultColor":"#475569","description":"Tranh Treo Tường Khung Gỗ Nghệ Thuật phong cách hiện đại tả thực PBR sắc nét","icon":"Image"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-barbecue-kettle', 'real-barbecue-kettle', 'Bếp Nướng BBQ Sân Vườn', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Barbecue_Kettle.glb', NULL, 0.65, 0.95, 0.65, false, false, 'ACTIVE', 1010, 'kitchen, decor, realistic, pbr, barbecue, kettle', '{"defaultColor":"#475569","description":"Bếp Nướng BBQ Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-basin-pedestal', 'real-basin-pedestal', 'Chậu Lavabo Liền Chân Đứng', 'col-modern-realistic', 'bathroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Basin_Pedestal.glb', NULL, 0.6, 0.85, 0.5, false, false, 'ACTIVE', 1011, 'bathroom, decor, realistic, pbr, basin, pedestal', '{"defaultColor":"#475569","description":"Chậu Lavabo Liền Chân Đứng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-basket-laundry', 'real-basket-laundry', 'Giỏ Đựng Đồ Giặt Mây Đan', 'col-modern-realistic', 'bathroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Basket_Laundry.glb', NULL, 0.45, 0.65, 0.45, false, false, 'ACTIVE', 1012, 'bathroom, decor, realistic, pbr, basket, laundry', '{"defaultColor":"#475569","description":"Giỏ Đựng Đồ Giặt Mây Đan phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-basket-log', 'real-basket-log', 'Giỏ Đựng Củi Lò Sưởi', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Basket_Log.glb', NULL, 0.5, 0.45, 0.4, false, false, 'ACTIVE', 1013, 'living-room, decor, realistic, pbr, basket, log', '{"defaultColor":"#475569","description":"Giỏ Đựng Củi Lò Sưởi phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bath-tub', 'real-bath-tub', 'Bồn Tắm Nằm Thư Giãn Acrylic', 'col-modern-realistic', 'bathroom', 'decor', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Bath_Tub.glb', NULL, 1.7, 0.6, 0.75, false, false, 'ACTIVE', 1014, 'bathroom, decor, realistic, pbr, bath, tub', '{"defaultColor":"#475569","description":"Bồn Tắm Nằm Thư Giãn Acrylic phong cách hiện đại tả thực PBR sắc nét","icon":"Bath"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bed-bunk', 'real-bed-bunk', 'Giường Tầng Trẻ Em Tiết Kiệm Không Gian', 'col-modern-realistic', 'bedroom', 'bed', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bed_Bunk.glb', NULL, 1.1, 1.7, 2.05, false, false, 'ACTIVE', 1015, 'bedroom, bed, realistic, pbr, bed, bunk', '{"defaultColor":"#475569","description":"Giường Tầng Trẻ Em Tiết Kiệm Không Gian phong cách hiện đại tả thực PBR sắc nét","icon":"Layers"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bed-dog', 'real-bed-dog', 'Đệm Nằm Thú Cưng Êm Ái', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bed_Dog.glb', NULL, 0.8, 0.25, 0.65, false, false, 'ACTIVE', 1016, 'living-room, decor, realistic, pbr, bed, dog', '{"defaultColor":"#475569","description":"Đệm Nằm Thú Cưng Êm Ái phong cách hiện đại tả thực PBR sắc nét","icon":"Heart"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bed-four-poster', 'real-bed-four-poster', 'Giường Bốn Cột Phong Cách Cổ Điển', 'col-modern-realistic', 'bedroom', 'bed', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Bed_Four_Poster.glb', NULL, 1.95, 2.2, 2.15, false, false, 'ACTIVE', 1017, 'bedroom, bed, realistic, pbr, bed, four, poster', '{"defaultColor":"#475569","description":"Giường Bốn Cột Phong Cách Cổ Điển phong cách hiện đại tả thực PBR sắc nét","icon":"Bed"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bed-single', 'real-bed-single', 'Giường Đơn Gỗ Tự Nhiên', 'col-modern-realistic', 'bedroom', 'bed', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bed_Single.glb', NULL, 1.1, 0.9, 2.05, false, false, 'ACTIVE', 1018, 'bedroom, bed, realistic, pbr, bed, single', '{"defaultColor":"#475569","description":"Giường Đơn Gỗ Tự Nhiên phong cách hiện đại tả thực PBR sắc nét","icon":"Bed"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bed-trundle', 'real-bed-trundle', 'Giường Kéo 2 Tầng Tiện Ích', 'col-modern-realistic', 'bedroom', 'bed', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bed_Trundle.glb', NULL, 1.15, 0.95, 2.1, false, false, 'ACTIVE', 1019, 'bedroom, bed, realistic, pbr, bed, trundle', '{"defaultColor":"#475569","description":"Giường Kéo 2 Tầng Tiện Ích phong cách hiện đại tả thực PBR sắc nét","icon":"Bed"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-bar', 'real-bench-bar', 'Băng Ghế Dài Quầy Bar', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Bar.glb', NULL, 1.2, 0.75, 0.4, false, false, 'ACTIVE', 1020, 'kitchen, seating, realistic, pbr, bench, bar', '{"defaultColor":"#475569","description":"Băng Ghế Dài Quầy Bar phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-dining', 'real-bench-dining', 'Ghế Băng Bàn Ăn Gỗ Sồi', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Dining.glb', NULL, 1.4, 0.48, 0.4, false, false, 'ACTIVE', 1021, 'kitchen, seating, realistic, pbr, bench, dining', '{"defaultColor":"#475569","description":"Ghế Băng Bàn Ăn Gỗ Sồi phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-gym', 'real-bench-gym', 'Ghế Tập Thể Hình Đa Năng', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Gym.glb', NULL, 1.3, 0.55, 0.45, false, false, 'ACTIVE', 1022, 'living-room, decor, realistic, pbr, bench, gym', '{"defaultColor":"#475569","description":"Ghế Tập Thể Hình Đa Năng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-park', 'real-bench-park', 'Ghế Băng Công Viên Nan Gỗ', 'col-modern-realistic', 'decor', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Park.glb', NULL, 1.5, 0.85, 0.6, false, false, 'ACTIVE', 1023, 'decor, seating, realistic, pbr, bench, park', '{"defaultColor":"#475569","description":"Ghế Băng Công Viên Nan Gỗ phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-pew', 'real-bench-pew', 'Ghế Băng Dài Lưng Tựa', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Pew.glb', NULL, 1.6, 0.9, 0.55, false, false, 'ACTIVE', 1024, 'living-room, seating, realistic, pbr, bench, pew', '{"defaultColor":"#475569","description":"Ghế Băng Dài Lưng Tựa phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-potting', 'real-bench-potting', 'Bàn Làm Vườn Kèm Chậu Cây', 'col-modern-realistic', 'decor', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Potting.glb', NULL, 1.1, 0.9, 0.55, true, false, 'ACTIVE', 1025, 'decor, table, realistic, pbr, bench, potting', '{"defaultColor":"#475569","description":"Bàn Làm Vườn Kèm Chậu Cây phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-shoe', 'real-bench-shoe', 'Ghế Ngồi Thay Giày Kèm Giá Để Giày', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Shoe.glb', NULL, 0.95, 0.5, 0.38, true, false, 'ACTIVE', 1026, 'living-room, storage, realistic, pbr, bench, shoe', '{"defaultColor":"#475569","description":"Ghế Ngồi Thay Giày Kèm Giá Để Giày phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-stacking', 'real-bench-stacking', 'Ghế Băng Xếp Chồng Tiện Lợi', 'col-modern-realistic', 'office', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bench_Stacking.glb', NULL, 1.2, 0.48, 0.45, false, false, 'ACTIVE', 1027, 'office, seating, realistic, pbr, bench, stacking', '{"defaultColor":"#475569","description":"Ghế Băng Xếp Chồng Tiện Lợi phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bench-tree', 'real-bench-tree', 'Ghế Vòng Quanh Gốc Cây Sân Vườn', 'col-modern-realistic', 'decor', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Bench_Tree.glb', NULL, 1.8, 0.85, 1.8, false, false, 'ACTIVE', 1028, 'decor, seating, realistic, pbr, bench, tree', '{"defaultColor":"#475569","description":"Ghế Vòng Quanh Gốc Cây Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bin-bread', 'real-bin-bread', 'Hộp Đựng Bánh Mì Bếp', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bin_Bread.glb', NULL, 0.4, 0.22, 0.25, false, true, 'ACTIVE', 1029, 'kitchen, decor, realistic, pbr, bin, bread', '{"defaultColor":"#475569","description":"Hộp Đựng Bánh Mì Bếp phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bin-compost', 'real-bin-compost', 'Thùng Rác Hữu Cơ Bếp', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bin_Compost.glb', NULL, 0.25, 0.3, 0.25, false, true, 'ACTIVE', 1030, 'kitchen, decor, realistic, pbr, bin, compost', '{"defaultColor":"#475569","description":"Thùng Rác Hữu Cơ Bếp phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bin-pedal', 'real-bin-pedal', 'Thùng Rác Đạp Chân Inox', 'col-modern-realistic', 'bathroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bin_Pedal.glb', NULL, 0.3, 0.42, 0.3, false, false, 'ACTIVE', 1031, 'bathroom, decor, realistic, pbr, bin, pedal', '{"defaultColor":"#475569","description":"Thùng Rác Đạp Chân Inox phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bin-recycling', 'real-bin-recycling', 'Thùng Rác Phân Loại Tái Chế', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bin_Recycling.glb', NULL, 0.4, 0.65, 0.35, false, false, 'ACTIVE', 1032, 'kitchen, decor, realistic, pbr, bin, recycling', '{"defaultColor":"#475569","description":"Thùng Rác Phân Loại Tái Chế phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bin-wire', 'real-bin-wire', 'Giỏ Rác Lưới Kim Loại', 'col-modern-realistic', 'office', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bin_Wire.glb', NULL, 0.28, 0.35, 0.28, false, false, 'ACTIVE', 1033, 'office, decor, realistic, pbr, bin, wire', '{"defaultColor":"#475569","description":"Giỏ Rác Lưới Kim Loại phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-block-knife', 'real-block-knife', 'Khối Cắm Dao Bếp Bằng Gỗ', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Block_Knife.glb', NULL, 0.18, 0.28, 0.22, false, true, 'ACTIVE', 1034, 'kitchen, decor, realistic, pbr, block, knife', '{"defaultColor":"#475569","description":"Khối Cắm Dao Bếp Bằng Gỗ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-board-ironing', 'real-board-ironing', 'Cầu Là Bàn Ủi Quần Áo', 'col-modern-realistic', 'bedroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Board_Ironing.glb', NULL, 1.25, 0.85, 0.38, false, false, 'ACTIVE', 1035, 'bedroom, decor, realistic, pbr, board, ironing', '{"defaultColor":"#475569","description":"Cầu Là Bàn Ủi Quần Áo phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-board-pin', 'real-board-pin', 'Bảng Ghim Ghi Chú Văn Phòng', 'col-modern-realistic', 'office', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Board_Pin.glb', NULL, 1.2, 0.8, 0.04, false, false, 'ACTIVE', 1036, 'office, wall-decor, realistic, pbr, board, pin', '{"defaultColor":"#475569","description":"Bảng Ghim Ghi Chú Văn Phòng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-board-white', 'real-board-white', 'Bảng Trắng Viết Bút Dạ', 'col-modern-realistic', 'office', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Board_White.glb', NULL, 1.5, 0.9, 0.04, false, false, 'ACTIVE', 1037, 'office, wall-decor, realistic, pbr, board, white', '{"defaultColor":"#475569","description":"Bảng Trắng Viết Bút Dạ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bookcase-barrister', 'real-bookcase-barrister', 'Tủ Sách Kính Cổ Điển Barrister', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Bookcase_Barrister.glb', NULL, 0.95, 1.8, 0.42, false, false, 'ACTIVE', 1038, 'office, storage, realistic, pbr, bookcase, barrister', '{"defaultColor":"#475569","description":"Tủ Sách Kính Cổ Điển Barrister phong cách hiện đại tả thực PBR sắc nét","icon":"BookOpen"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bookcase-divider', 'real-bookcase-divider', 'Kệ Sách Vách Ngăn Không Gian', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bookcase_Divider.glb', NULL, 1.6, 1.75, 0.38, true, false, 'ACTIVE', 1039, 'living-room, storage, realistic, pbr, bookcase, divider', '{"defaultColor":"#475569","description":"Kệ Sách Vách Ngăn Không Gian phong cách hiện đại tả thực PBR sắc nét","icon":"BookOpen"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bookcase-tall', 'real-bookcase-tall', 'Kệ Sách Đứng 5 Tầng Gỗ', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bookcase_Tall.glb', NULL, 0.9, 1.95, 0.35, false, false, 'ACTIVE', 1040, 'living-room, storage, realistic, pbr, bookcase, tall', '{"defaultColor":"#475569","description":"Kệ Sách Đứng 5 Tầng Gỗ phong cách hiện đại tả thực PBR sắc nét","icon":"BookOpen"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-books-stack', 'real-books-stack', 'Chồng Sách Trang Trí Bìa Cứng', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Books_Stack.glb', NULL, 0.28, 0.18, 0.22, false, true, 'ACTIVE', 1041, 'living-room, decor, realistic, pbr, books, stack', '{"defaultColor":"#475569","description":"Chồng Sách Trang Trí Bìa Cứng phong cách hiện đại tả thực PBR sắc nét","icon":"BookOpen"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-booth-banquette', 'real-booth-banquette', 'Băng Ghế Sofa Booth Ăn Liền Tường', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Booth_Banquette.glb', NULL, 1.6, 1.05, 0.7, false, false, 'ACTIVE', 1042, 'kitchen, seating, realistic, pbr, booth, banquette', '{"defaultColor":"#475569","description":"Băng Ghế Sofa Booth Ăn Liền Tường phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-booth-bar', 'real-booth-bar', 'Booth Ngồi Quầy Bar Sang Trọng', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Booth_Bar.glb', NULL, 1.4, 1.1, 0.65, false, false, 'ACTIVE', 1043, 'kitchen, seating, realistic, pbr, booth, bar', '{"defaultColor":"#475569","description":"Booth Ngồi Quầy Bar Sang Trọng phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-bowl-fruit', 'real-bowl-fruit', 'Đĩa Pha Lê Đựng Trái Cây', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Bowl_Fruit.glb', NULL, 0.35, 0.15, 0.35, false, true, 'ACTIVE', 1044, 'kitchen, decor, realistic, pbr, bowl, fruit', '{"defaultColor":"#475569","description":"Đĩa Pha Lê Đựng Trái Cây phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-box-blanket', 'real-box-blanket', 'Rương Gỗ Đựng Chăn Màn', 'col-modern-realistic', 'bedroom', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Box_Blanket.glb', NULL, 0.95, 0.5, 0.48, true, false, 'ACTIVE', 1045, 'bedroom, storage, realistic, pbr, box, blanket', '{"defaultColor":"#475569","description":"Rương Gỗ Đựng Chăn Màn phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-box-garden', 'real-box-garden', 'Bồn Trồng Hoa Sân Vườn', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Box_Garden.glb', NULL, 1.1, 0.45, 0.45, false, false, 'ACTIVE', 1046, 'decor, decor, realistic, pbr, box, garden', '{"defaultColor":"#475569","description":"Bồn Trồng Hoa Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-butt-water', 'real-butt-water', 'Thùng Chứa Nước Mưa Sân Vườn', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Butt_Water.glb', NULL, 0.65, 0.95, 0.65, false, false, 'ACTIVE', 1047, 'decor, decor, realistic, pbr, butt, water', '{"defaultColor":"#475569","description":"Thùng Chứa Nước Mưa Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-bathroom', 'real-cabinet-bathroom', 'Tủ Treo Phòng Tắm Kèm Gương', 'col-modern-realistic', 'bathroom', 'storage', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Bathroom.glb', NULL, 0.75, 0.8, 0.18, false, false, 'ACTIVE', 1048, 'bathroom, storage, realistic, pbr, cabinet, bathroom', '{"defaultColor":"#475569","description":"Tủ Treo Phòng Tắm Kèm Gương phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-bedside', 'real-cabinet-bedside', 'Tủ Đầu Giường 2 Ngăn Kéo', 'col-modern-realistic', 'bedroom', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Bedside.glb', NULL, 0.55, 0.58, 0.42, true, false, 'ACTIVE', 1049, 'bedroom, storage, realistic, pbr, cabinet, bedside', '{"defaultColor":"#475569","description":"Tủ Đầu Giường 2 Ngăn Kéo phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-corner', 'real-cabinet-corner', 'Tủ Góc Tam Giác Tiết Kiệm Diện Tích', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Corner.glb', NULL, 0.7, 0.85, 0.7, true, false, 'ACTIVE', 1050, 'living-room, storage, realistic, pbr, cabinet, corner', '{"defaultColor":"#475569","description":"Tủ Góc Tam Giác Tiết Kiệm Diện Tích phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-display', 'real-cabinet-display', 'Tủ Kính Trưng Bày Rượu & Đồ Cổ', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Cabinet_Display.glb', NULL, 0.9, 1.85, 0.42, false, false, 'ACTIVE', 1051, 'living-room, storage, realistic, pbr, cabinet, display', '{"defaultColor":"#475569","description":"Tủ Kính Trưng Bày Rượu & Đồ Cổ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-drinks', 'real-cabinet-drinks', 'Tủ Quầy Rượu Mini Sang Trọng', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Cabinet_Drinks.glb', NULL, 0.85, 1.15, 0.45, true, false, 'ACTIVE', 1052, 'living-room, storage, realistic, pbr, cabinet, drinks', '{"defaultColor":"#475569","description":"Tủ Quầy Rượu Mini Sang Trọng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-filing', 'real-cabinet-filing', 'Tủ Hồ Sơ Văn Phòng 3 Ngăn', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Filing.glb', NULL, 0.45, 1.05, 0.55, true, false, 'ACTIVE', 1053, 'office, storage, realistic, pbr, cabinet, filing', '{"defaultColor":"#475569","description":"Tủ Hồ Sơ Văn Phòng 3 Ngăn phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-kitchen-base', 'real-cabinet-kitchen-base', 'Tủ Bếp Dưới Mặt Đá', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Kitchen_Base.glb', NULL, 0.9, 0.88, 0.62, true, false, 'ACTIVE', 1054, 'kitchen, storage, realistic, pbr, cabinet, kitchen, base', '{"defaultColor":"#475569","description":"Tủ Bếp Dưới Mặt Đá phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-kitchen-sink', 'real-cabinet-kitchen-sink', 'Tủ Bếp Chậu Rửa Bát Đôi', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Kitchen_Sink.glb', NULL, 1, 0.88, 0.62, true, false, 'ACTIVE', 1055, 'kitchen, storage, realistic, pbr, cabinet, kitchen, sink', '{"defaultColor":"#475569","description":"Tủ Bếp Chậu Rửa Bát Đôi phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-kitchen-wall', 'real-cabinet-kitchen-wall', 'Tủ Bếp Treo Tường', 'col-modern-realistic', 'kitchen', 'storage', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Kitchen_Wall.glb', NULL, 0.9, 0.7, 0.35, false, false, 'ACTIVE', 1056, 'kitchen, storage, realistic, pbr, cabinet, kitchen, wall', '{"defaultColor":"#475569","description":"Tủ Bếp Treo Tường phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-larder', 'real-cabinet-larder', 'Tủ Kho Đồ Khô Nhà Bếp Cao', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Cabinet_Larder.glb', NULL, 0.85, 2.05, 0.6, false, false, 'ACTIVE', 1057, 'kitchen, storage, realistic, pbr, cabinet, larder', '{"defaultColor":"#475569","description":"Tủ Kho Đồ Khô Nhà Bếp Cao phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-lateral', 'real-cabinet-lateral', 'Tủ Ngăn Kéo Ngang Văn Phòng', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Lateral.glb', NULL, 0.95, 0.75, 0.5, true, false, 'ACTIVE', 1058, 'office, storage, realistic, pbr, cabinet, lateral', '{"defaultColor":"#475569","description":"Tủ Ngăn Kéo Ngang Văn Phòng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-shoe', 'real-cabinet-shoe', 'Tủ Giày Dép Cánh Nghiêng Thông Minh', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Shoe.glb', NULL, 0.8, 1.1, 0.28, true, false, 'ACTIVE', 1059, 'living-room, storage, realistic, pbr, cabinet, shoe', '{"defaultColor":"#475569","description":"Tủ Giày Dép Cánh Nghiêng Thông Minh phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-tambour', 'real-cabinet-tambour', 'Tủ Cửa Cuốn Văn Phòng', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_Tambour.glb', NULL, 1, 1.2, 0.45, false, false, 'ACTIVE', 1060, 'office, storage, realistic, pbr, cabinet, tambour', '{"defaultColor":"#475569","description":"Tủ Cửa Cuốn Văn Phòng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cabinet-tv', 'real-cabinet-tv', 'Kệ Tivi Gỗ Tự Nhiên Hiện Đại', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cabinet_TV.glb', NULL, 1.9, 0.52, 0.45, true, false, 'ACTIVE', 1061, 'living-room, storage, realistic, pbr, cabinet, tv', '{"defaultColor":"#475569","description":"Kệ Tivi Gỗ Tự Nhiên Hiện Đại phong cách hiện đại tả thực PBR sắc nét","icon":"Tv"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-candles-pillar', 'real-candles-pillar', 'Bộ Nến Trụ Trang Trí Thư Giãn', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Candles_Pillar.glb', NULL, 0.25, 0.22, 0.2, false, true, 'ACTIVE', 1062, 'living-room, decor, realistic, pbr, candles, pillar', '{"defaultColor":"#475569","description":"Bộ Nến Trụ Trang Trí Thư Giãn phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-canister-set', 'real-canister-set', 'Bộ Hũ Gia Vị Nhà Bếp', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Canister_Set.glb', NULL, 0.35, 0.2, 0.15, false, true, 'ACTIVE', 1063, 'kitchen, decor, realistic, pbr, canister, set', '{"defaultColor":"#475569","description":"Bộ Hũ Gia Vị Nhà Bếp phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cart-bar', 'real-cart-bar', 'Xe Đẩy Rượu Di Động Khung Vàng', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Cart_Bar.glb', NULL, 0.75, 0.85, 0.45, true, false, 'ACTIVE', 1064, 'living-room, storage, realistic, pbr, cart, bar', '{"defaultColor":"#475569","description":"Xe Đẩy Rượu Di Động Khung Vàng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-adirondack', 'real-chair-adirondack', 'Ghế Tựa Thư Giãn Sân Vườn Adirondack', 'col-modern-realistic', 'decor', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Adirondack.glb', NULL, 0.85, 0.9, 0.9, false, false, 'ACTIVE', 1065, 'decor, seating, realistic, pbr, chair, adirondack', '{"defaultColor":"#475569","description":"Ghế Tựa Thư Giãn Sân Vườn Adirondack phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-armchair', 'real-chair-armchair', 'Ghế Bành Nệm Dày Phòng Khách', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Armchair.glb', NULL, 0.95, 0.88, 0.9, false, false, 'ACTIVE', 1066, 'living-room, seating, realistic, pbr, chair, armchair', '{"defaultColor":"#475569","description":"Ghế Bành Nệm Dày Phòng Khách phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-bean', 'real-chair-bean', 'Ghế Lười Hạt Xốp Êm Ái', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Bean.glb', NULL, 0.95, 0.75, 0.95, false, false, 'ACTIVE', 1067, 'living-room, seating, realistic, pbr, chair, bean', '{"defaultColor":"#475569","description":"Ghế Lười Hạt Xốp Êm Ái phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-cafe', 'real-chair-cafe', 'Ghế Gỗ Cafe Tối Giản', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Cafe.glb', NULL, 0.48, 0.82, 0.5, false, false, 'ACTIVE', 1068, 'kitchen, seating, realistic, pbr, chair, cafe', '{"defaultColor":"#475569","description":"Ghế Gỗ Cafe Tối Giản phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-chapel', 'real-chair-chapel', 'Ghế Gỗ Có Ngăn Đựng Sách Sau Lưng', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Chapel.glb', NULL, 0.5, 0.85, 0.52, false, false, 'ACTIVE', 1069, 'living-room, seating, realistic, pbr, chair, chapel', '{"defaultColor":"#475569","description":"Ghế Gỗ Có Ngăn Đựng Sách Sau Lưng phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-deck', 'real-chair-deck', 'Ghế Xếp Nằm Bãi Biển / Ban Công', 'col-modern-realistic', 'decor', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Deck.glb', NULL, 0.65, 0.85, 1.1, false, false, 'ACTIVE', 1070, 'decor, seating, realistic, pbr, chair, deck', '{"defaultColor":"#475569","description":"Ghế Xếp Nằm Bãi Biển / Ban Công phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-dining', 'real-chair-dining', 'Ghế Bàn Ăn Bọc Vải Cao Cấp', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Dining.glb', NULL, 0.52, 0.88, 0.55, false, false, 'ACTIVE', 1071, 'kitchen, seating, realistic, pbr, chair, dining', '{"defaultColor":"#475569","description":"Ghế Bàn Ăn Bọc Vải Cao Cấp phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-dining-arm', 'real-chair-dining-arm', 'Ghế Ăn Có Tay Vịn Sang Trọng', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Chair_Dining_Arm.glb', NULL, 0.6, 0.88, 0.58, false, false, 'ACTIVE', 1072, 'kitchen, seating, realistic, pbr, chair, dining, arm', '{"defaultColor":"#475569","description":"Ghế Ăn Có Tay Vịn Sang Trọng phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-directors', 'real-chair-directors', 'Ghế Đạo Diễn Xếp Gọn', 'col-modern-realistic', 'office', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Directors.glb', NULL, 0.58, 0.85, 0.5, false, false, 'ACTIVE', 1073, 'office, seating, realistic, pbr, chair, directors', '{"defaultColor":"#475569","description":"Ghế Đạo Diễn Xếp Gọn phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-folding', 'real-chair-folding', 'Ghế Xếp Gọn Đa Năng', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Folding.glb', NULL, 0.46, 0.8, 0.48, false, false, 'ACTIVE', 1074, 'kitchen, seating, realistic, pbr, chair, folding', '{"defaultColor":"#475569","description":"Ghế Xếp Gọn Đa Năng phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-glider', 'real-chair-glider', 'Ghế Đung Đưa Thư Giãn', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Glider.glb', NULL, 0.8, 0.95, 0.85, false, false, 'ACTIVE', 1075, 'living-room, seating, realistic, pbr, chair, glider', '{"defaultColor":"#475569","description":"Ghế Đung Đưa Thư Giãn phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-hanging-egg', 'real-chair-hanging-egg', 'Ghế Xích Đu Tổ Chim Mây Tre', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Chair_Hanging_Egg.glb', NULL, 1.05, 1.95, 1.05, false, false, 'ACTIVE', 1076, 'living-room, seating, realistic, pbr, chair, hanging, egg', '{"defaultColor":"#475569","description":"Ghế Xích Đu Tổ Chim Mây Tre phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-high', 'real-chair-high', 'Ghế Ăn Dặm Trẻ Em', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_High.glb', NULL, 0.55, 0.95, 0.55, false, false, 'ACTIVE', 1077, 'kitchen, seating, realistic, pbr, chair, high', '{"defaultColor":"#475569","description":"Ghế Ăn Dặm Trẻ Em phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-office', 'real-chair-office', 'Ghế Xoay Văn Phòng Lưới Công Thái Học', 'col-modern-realistic', 'office', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Office.glb', NULL, 0.65, 1.05, 0.65, false, false, 'ACTIVE', 1078, 'office, seating, realistic, pbr, chair, office', '{"defaultColor":"#475569","description":"Ghế Xoay Văn Phòng Lưới Công Thái Học phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-papasan', 'real-chair-papasan', 'Ghế Thư Giãn Tròn Papasan Đệm Dày', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Papasan.glb', NULL, 1.1, 0.85, 1.1, false, false, 'ACTIVE', 1079, 'living-room, seating, realistic, pbr, chair, papasan', '{"defaultColor":"#475569","description":"Ghế Thư Giãn Tròn Papasan Đệm Dày phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-rattan', 'real-chair-rattan', 'Ghế Mây Tre Đan Tự Nhiên', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Rattan.glb', NULL, 0.65, 0.85, 0.65, false, false, 'ACTIVE', 1080, 'living-room, seating, realistic, pbr, chair, rattan', '{"defaultColor":"#475569","description":"Ghế Mây Tre Đan Tự Nhiên phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-recliner', 'real-chair-recliner', 'Ghế Sofa Đơn Chỉnh Điện Thư Giãn', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Chair_Recliner.glb', NULL, 0.95, 1.02, 1, false, false, 'ACTIVE', 1081, 'living-room, seating, realistic, pbr, chair, recliner', '{"defaultColor":"#475569","description":"Ghế Sofa Đơn Chỉnh Điện Thư Giãn phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-rocking', 'real-chair-rocking', 'Ghế Bập Bênh Gỗ Thư Giãn', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Rocking.glb', NULL, 0.7, 0.95, 0.95, false, false, 'ACTIVE', 1082, 'living-room, seating, realistic, pbr, chair, rocking', '{"defaultColor":"#475569","description":"Ghế Bập Bênh Gỗ Thư Giãn phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-stacking', 'real-chair-stacking', 'Ghế Xếp Chồng Văn Phòng', 'col-modern-realistic', 'office', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Stacking.glb', NULL, 0.5, 0.82, 0.5, false, false, 'ACTIVE', 1083, 'office, seating, realistic, pbr, chair, stacking', '{"defaultColor":"#475569","description":"Ghế Xếp Chồng Văn Phòng phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-tub', 'real-chair-tub', 'Ghế Bành Bo Tròn Tub Chair', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Tub.glb', NULL, 0.75, 0.8, 0.72, false, false, 'ACTIVE', 1084, 'living-room, seating, realistic, pbr, chair, tub', '{"defaultColor":"#475569","description":"Ghế Bành Bo Tròn Tub Chair phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-visitor', 'real-chair-visitor', 'Ghế Chân Quỳ Tiếp Khách', 'col-modern-realistic', 'office', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chair_Visitor.glb', NULL, 0.58, 0.88, 0.58, false, false, 'ACTIVE', 1085, 'office, seating, realistic, pbr, chair, visitor', '{"defaultColor":"#475569","description":"Ghế Chân Quỳ Tiếp Khách phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chair-wingback', 'real-chair-wingback', 'Ghế Bành Tựa Tai Wingback Quý Tộc', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Chair_Wingback.glb', NULL, 0.85, 1.15, 0.88, false, false, 'ACTIVE', 1086, 'living-room, seating, realistic, pbr, chair, wingback', '{"defaultColor":"#475569","description":"Ghế Bành Tựa Tai Wingback Quý Tộc phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chest-drawers', 'real-chest-drawers', 'Tủ Ngăn Kéo Đựng Quần Áo 4 Tầng', 'col-modern-realistic', 'bedroom', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chest_Drawers.glb', NULL, 0.85, 1.05, 0.48, true, false, 'ACTIVE', 1087, 'bedroom, storage, realistic, pbr, chest, drawers', '{"defaultColor":"#475569","description":"Tủ Ngăn Kéo Đựng Quần Áo 4 Tầng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chest-plan', 'real-chest-plan', 'Tủ Ngăn Kéo Bản Vẽ Kiến Trúc', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Chest_Plan.glb', NULL, 1.2, 0.85, 0.85, true, false, 'ACTIVE', 1088, 'office, storage, realistic, pbr, chest, plan', '{"defaultColor":"#475569","description":"Tủ Ngăn Kéo Bản Vẽ Kiến Trúc phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-chest-toy', 'real-chest-toy', 'Rương Đựng Đồ Chơi Trẻ Em', 'col-modern-realistic', 'bedroom', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Chest_Toy.glb', NULL, 0.85, 0.5, 0.45, true, false, 'ACTIVE', 1089, 'bedroom, storage, realistic, pbr, chest, toy', '{"defaultColor":"#475569","description":"Rương Đựng Đồ Chơi Trẻ Em phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-clock-table', 'real-clock-table', 'Đồng Hồ Để Bàn Cổ Điển', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Clock_Table.glb', NULL, 0.18, 0.22, 0.12, false, true, 'ACTIVE', 1090, 'living-room, decor, realistic, pbr, clock, table', '{"defaultColor":"#475569","description":"Đồng Hồ Để Bàn Cổ Điển phong cách hiện đại tả thực PBR sắc nét","icon":"Clock"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-clock-wall', 'real-clock-wall', 'Đồng Hồ Treo Tường Tối Giản', 'col-modern-realistic', 'wall-decor', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Clock_Wall.glb', NULL, 0.45, 0.45, 0.05, false, false, 'ACTIVE', 1091, 'wall-decor, wall-decor, realistic, pbr, clock, wall', '{"defaultColor":"#475569","description":"Đồng Hồ Treo Tường Tối Giản phong cách hiện đại tả thực PBR sắc nét","icon":"Clock"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-coatstand', 'real-coatstand', 'Cây Treo Quần Áo & Mũ Gỗ', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Coatstand.glb', NULL, 0.45, 1.75, 0.45, false, false, 'ACTIVE', 1092, 'living-room, decor, realistic, pbr, coatstand', '{"defaultColor":"#475569","description":"Cây Treo Quần Áo & Mũ Gỗ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cot-baby', 'real-cot-baby', 'Nôi Cũi Em Bé Bằng Gỗ', 'col-modern-realistic', 'bedroom', 'bed', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cot_Baby.glb', NULL, 0.75, 0.95, 1.35, false, false, 'ACTIVE', 1093, 'bedroom, bed, realistic, pbr, cot, baby', '{"defaultColor":"#475569","description":"Nôi Cũi Em Bé Bằng Gỗ phong cách hiện đại tả thực PBR sắc nét","icon":"Bed"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-crate-fruit', 'real-crate-fruit', 'Thùng Gỗ Đựng Trái Cây Vintage', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Crate_Fruit.glb', NULL, 0.45, 0.25, 0.32, false, true, 'ACTIVE', 1094, 'kitchen, decor, realistic, pbr, crate, fruit', '{"defaultColor":"#475569","description":"Thùng Gỗ Đựng Trái Cây Vintage phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-crate-pet', 'real-crate-pet', 'Chuồng Thú Cưng Di Động', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Crate_Pet.glb', NULL, 0.65, 0.55, 0.85, false, false, 'ACTIVE', 1095, 'living-room, decor, realistic, pbr, crate, pet', '{"defaultColor":"#475569","description":"Chuồng Thú Cưng Di Động phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-curtain-pair', 'real-curtain-pair', 'Bộ Rèm Cửa Vải 2 Lớp', 'col-modern-realistic', 'wall-decor', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Curtain_Pair.glb', NULL, 1.8, 2.4, 0.15, false, false, 'ACTIVE', 1096, 'wall-decor, wall-decor, realistic, pbr, curtain, pair', '{"defaultColor":"#475569","description":"Bộ Rèm Cửa Vải 2 Lớp phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cushion-floor', 'real-cushion-floor', 'Đệm Ngồi Bệt Phong Cách Nhật Bản', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cushion_Floor.glb', NULL, 0.55, 0.15, 0.55, false, false, 'ACTIVE', 1097, 'living-room, seating, realistic, pbr, cushion, floor', '{"defaultColor":"#475569","description":"Đệm Ngồi Bệt Phong Cách Nhật Bản phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-cushion-scatter', 'real-cushion-scatter', 'Gối Tựa Lưng Sofa Trang Trí', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Cushion_Scatter.glb', NULL, 0.45, 0.45, 0.18, false, true, 'ACTIVE', 1098, 'living-room, decor, realistic, pbr, cushion, scatter', '{"defaultColor":"#475569","description":"Gối Tựa Lưng Sofa Trang Trí phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-desk-bureau', 'real-desk-bureau', 'Bàn Làm Việc Cổ Điển Nắp Mở', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Desk_Bureau.glb', NULL, 0.95, 1.1, 0.55, true, false, 'ACTIVE', 1099, 'office, table, realistic, pbr, desk, bureau', '{"defaultColor":"#475569","description":"Bàn Làm Việc Cổ Điển Nắp Mở phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-desk-corner', 'real-desk-corner', 'Bàn Làm Việc Góc Chữ L', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Desk_Corner.glb', NULL, 1.6, 0.75, 1.4, true, false, 'ACTIVE', 1100, 'office, table, realistic, pbr, desk, corner', '{"defaultColor":"#475569","description":"Bàn Làm Việc Góc Chữ L phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-desk-office', 'real-desk-office', 'Bàn Làm Việc Văn Phòng Hiện Đại', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Desk_Office.glb', NULL, 1.4, 0.75, 0.7, true, false, 'ACTIVE', 1101, 'office, table, realistic, pbr, desk, office', '{"defaultColor":"#475569","description":"Bàn Làm Việc Văn Phòng Hiện Đại phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-desk-reception', 'real-desk-reception', 'Quầy Lễ Tân Văn Phòng', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Desk_Reception.glb', NULL, 1.8, 1.1, 0.8, true, false, 'ACTIVE', 1102, 'office, table, realistic, pbr, desk, reception', '{"defaultColor":"#475569","description":"Quầy Lễ Tân Văn Phòng phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-desk-school', 'real-desk-school', 'Bàn Ghế Học Sinh Liền Khối', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Desk_School.glb', NULL, 0.75, 0.75, 0.85, true, false, 'ACTIVE', 1103, 'office, table, realistic, pbr, desk, school', '{"defaultColor":"#475569","description":"Bàn Ghế Học Sinh Liền Khối phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-desk-standing', 'real-desk-standing', 'Bàn Làm Việc Đứng Nâng Hạ Điện', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Desk_Standing.glb', NULL, 1.5, 1.05, 0.75, true, false, 'ACTIVE', 1104, 'office, table, realistic, pbr, desk, standing', '{"defaultColor":"#475569","description":"Bàn Làm Việc Đứng Nâng Hạ Điện phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-desk-workbench', 'real-desk-workbench', 'Bàn Thợ Kỹ Thuật Đa Năng', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Desk_Workbench.glb', NULL, 1.5, 0.9, 0.75, true, false, 'ACTIVE', 1105, 'office, table, realistic, pbr, desk, workbench', '{"defaultColor":"#475569","description":"Bàn Thợ Kỹ Thuật Đa Năng phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-dresser-welsh', 'real-dresser-welsh', 'Tủ Búp Phê Trưng Bày Bát Đĩa', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Dresser_Welsh.glb', NULL, 1.2, 1.9, 0.48, true, false, 'ACTIVE', 1106, 'kitchen, storage, realistic, pbr, dresser, welsh', '{"defaultColor":"#475569","description":"Tủ Búp Phê Trưng Bày Bát Đĩa phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-easel-artist', 'real-easel-artist', 'Giá Vẽ Tranh Cho Họa Sĩ', 'col-modern-realistic', 'office', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Easel_Artist.glb', NULL, 0.65, 1.65, 0.65, false, false, 'ACTIVE', 1107, 'office, decor, realistic, pbr, easel, artist', '{"defaultColor":"#475569","description":"Giá Vẽ Tranh Cho Họa Sĩ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-frame-cold', 'real-frame-cold', 'Khung Ươm Mầm Cây Mini', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Frame_Cold.glb', NULL, 1, 0.45, 0.7, false, false, 'ACTIVE', 1108, 'decor, decor, realistic, pbr, frame, cold', '{"defaultColor":"#475569","description":"Khung Ươm Mầm Cây Mini phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-hall-tree', 'real-hall-tree', 'Kệ Tiền Sảnh Treo Áo & Tủ Giày', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Hall_Tree.glb', NULL, 0.95, 1.85, 0.45, true, false, 'ACTIVE', 1109, 'living-room, storage, realistic, pbr, hall, tree', '{"defaultColor":"#475569","description":"Kệ Tiền Sảnh Treo Áo & Tủ Giày phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-hammock-stand', 'real-hammock-stand', 'Võng Xếp Kèm Khung Thép', 'col-modern-realistic', 'decor', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Hammock_Stand.glb', NULL, 2.4, 0.95, 0.9, false, false, 'ACTIVE', 1110, 'decor, seating, realistic, pbr, hammock, stand', '{"defaultColor":"#475569","description":"Võng Xếp Kèm Khung Thép phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-island-kitchen', 'real-island-kitchen', 'Đảo Bếp Kết Hợp Quầy Bar Mặt Đá', 'col-modern-realistic', 'kitchen', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Island_Kitchen.glb', NULL, 1.8, 0.92, 0.9, true, false, 'ACTIVE', 1111, 'kitchen, table, realistic, pbr, island, kitchen', '{"defaultColor":"#475569","description":"Đảo Bếp Kết Hợp Quầy Bar Mặt Đá phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-kettle', 'real-kettle', 'Ấm Đun Nước Siêu Tốc', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Kettle.glb', NULL, 0.22, 0.28, 0.2, false, true, 'ACTIVE', 1112, 'kitchen, decor, realistic, pbr, kettle', '{"defaultColor":"#475569","description":"Ấm Đun Nước Siêu Tốc phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-ladder-blanket', 'real-ladder-blanket', 'Thang Gỗ Treo Khăn & Chăn Decor', 'col-modern-realistic', 'bedroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Ladder_Blanket.glb', NULL, 0.45, 1.6, 0.08, false, false, 'ACTIVE', 1113, 'bedroom, decor, realistic, pbr, ladder, blanket', '{"defaultColor":"#475569","description":"Thang Gỗ Treo Khăn & Chăn Decor phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-ladder-step', 'real-ladder-step', 'Thang Nhôm Xếp 3 Bậc Gia Đình', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Ladder_Step.glb', NULL, 0.48, 0.85, 0.6, false, false, 'ACTIVE', 1114, 'living-room, decor, realistic, pbr, ladder, step', '{"defaultColor":"#475569","description":"Thang Nhôm Xếp 3 Bậc Gia Đình phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lamp-arc', 'real-lamp-arc', 'Đèn Cây Cần Câu Vòm Cong', 'col-modern-realistic', 'living-room', 'lamp', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lamp_Arc.glb', NULL, 1.2, 2.05, 0.45, false, false, 'ACTIVE', 1115, 'living-room, lamp, realistic, pbr, lamp, arc', '{"defaultColor":"#475569","description":"Đèn Cây Cần Câu Vòm Cong phong cách hiện đại tả thực PBR sắc nét","icon":"Lamp"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lamp-desk', 'real-lamp-desk', 'Đèn Bàn Học Chống Cận', 'col-modern-realistic', 'office', 'lamp', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lamp_Desk.glb', NULL, 0.35, 0.48, 0.25, false, true, 'ACTIVE', 1116, 'office, lamp, realistic, pbr, lamp, desk', '{"defaultColor":"#475569","description":"Đèn Bàn Học Chống Cận phong cách hiện đại tả thực PBR sắc nét","icon":"Lamp"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lamp-floor', 'real-lamp-floor', 'Đèn Sàn Đứng Đọc Sách', 'col-modern-realistic', 'living-room', 'lamp', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lamp_Floor.glb', NULL, 0.45, 1.55, 0.45, false, false, 'ACTIVE', 1117, 'living-room, lamp, realistic, pbr, lamp, floor', '{"defaultColor":"#475569","description":"Đèn Sàn Đứng Đọc Sách phong cách hiện đại tả thực PBR sắc nét","icon":"Lamp"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lamp-pendant', 'real-lamp-pendant', 'Đèn Thả Trần Hiện Đại', 'col-modern-realistic', 'kitchen', 'lamp', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lamp_Pendant.glb', NULL, 0.4, 0.9, 0.4, false, false, 'ACTIVE', 1118, 'kitchen, lamp, realistic, pbr, lamp, pendant', '{"defaultColor":"#475569","description":"Đèn Thả Trần Hiện Đại phong cách hiện đại tả thực PBR sắc nét","icon":"Lamp"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lamp-table', 'real-lamp-table', 'Đèn Ngủ Để Bàn Chụp Vải', 'col-modern-realistic', 'bedroom', 'lamp', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lamp_Table.glb', NULL, 0.3, 0.52, 0.3, false, true, 'ACTIVE', 1119, 'bedroom, lamp, realistic, pbr, lamp, table', '{"defaultColor":"#475569","description":"Đèn Ngủ Để Bàn Chụp Vải phong cách hiện đại tả thực PBR sắc nét","icon":"Lamp"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lamp-wall', 'real-lamp-wall', 'Đèn Tường Hắt Sáng Trang Trí', 'col-modern-realistic', 'wall-decor', 'lamp', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lamp_Wall.glb', NULL, 0.22, 0.35, 0.25, false, false, 'ACTIVE', 1120, 'wall-decor, lamp, realistic, pbr, lamp, wall', '{"defaultColor":"#475569","description":"Đèn Tường Hắt Sáng Trang Trí phong cách hiện đại tả thực PBR sắc nét","icon":"Lamp"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-laptop', 'real-laptop', 'Máy Tính Xách Tay Mỏng Nhẹ', 'col-modern-realistic', 'office', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Laptop.glb', NULL, 0.32, 0.18, 0.24, false, true, 'ACTIVE', 1121, 'office, decor, realistic, pbr, laptop', '{"defaultColor":"#475569","description":"Máy Tính Xách Tay Mỏng Nhẹ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lectern', 'real-lectern', 'Bục Phát Biểu Hội Nghị', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lectern.glb', NULL, 0.65, 1.2, 0.5, true, false, 'ACTIVE', 1122, 'office, table, realistic, pbr, lectern', '{"defaultColor":"#475569","description":"Bục Phát Biểu Hội Nghị phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-ledge-picture', 'real-ledge-picture', 'Kệ Gỗ Treo Tường Kê Khung Ảnh', 'col-modern-realistic', 'wall-decor', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Ledge_Picture.glb', NULL, 1, 0.08, 0.12, true, false, 'ACTIVE', 1123, 'wall-decor, wall-decor, realistic, pbr, ledge, picture', '{"defaultColor":"#475569","description":"Kệ Gỗ Treo Tường Kê Khung Ảnh phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-locker-bank', 'real-locker-bank', 'Cụm Tủ Locker 6 Ngăn', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Locker_Bank.glb', NULL, 0.9, 1.85, 0.45, false, false, 'ACTIVE', 1124, 'office, storage, realistic, pbr, locker, bank', '{"defaultColor":"#475569","description":"Cụm Tủ Locker 6 Ngăn phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-lounger-sun', 'real-lounger-sun', 'Giường Nằm Tắm Nắng Bể Bơi', 'col-modern-realistic', 'decor', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Lounger_Sun.glb', NULL, 0.75, 0.65, 1.95, false, false, 'ACTIVE', 1125, 'decor, seating, realistic, pbr, lounger, sun', '{"defaultColor":"#475569","description":"Giường Nằm Tắm Nắng Bể Bơi phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-machine-coffee', 'real-machine-coffee', 'Máy Pha Cà Phê Espresso', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Machine_Coffee.glb', NULL, 0.32, 0.38, 0.35, false, true, 'ACTIVE', 1126, 'kitchen, decor, realistic, pbr, machine, coffee', '{"defaultColor":"#475569","description":"Máy Pha Cà Phê Espresso phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-mat-scraper', 'real-mat-scraper', 'Thảm Chùi Chân Tiền Sảnh', 'col-modern-realistic', 'living-room', 'rug', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Mat_Scraper.glb', NULL, 0.75, 0.02, 0.45, false, false, 'ACTIVE', 1127, 'living-room, rug, realistic, pbr, mat, scraper', '{"defaultColor":"#475569","description":"Thảm Chùi Chân Tiền Sảnh phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-media-wall', 'real-media-wall', 'Hệ Tủ Vách Tivi Phòng Khách Lớn', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Media_Wall.glb', NULL, 2.6, 2.2, 0.45, true, false, 'ACTIVE', 1128, 'living-room, storage, realistic, pbr, media, wall', '{"defaultColor":"#475569","description":"Hệ Tủ Vách Tivi Phòng Khách Lớn phong cách hiện đại tả thực PBR sắc nét","icon":"Tv"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-mirror-cheval', 'real-mirror-cheval', 'Gương Soi Toàn Thân Có Chân Đứng', 'col-modern-realistic', 'bedroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Mirror_Cheval.glb', NULL, 0.55, 1.6, 0.45, false, false, 'ACTIVE', 1129, 'bedroom, decor, realistic, pbr, mirror, cheval', '{"defaultColor":"#475569","description":"Gương Soi Toàn Thân Có Chân Đứng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-mirror-floor', 'real-mirror-floor', 'Gương Lớn Tựa Tường Khung Kim Loại', 'col-modern-realistic', 'bedroom', 'decor', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Mirror_Floor.glb', NULL, 0.8, 1.85, 0.08, false, false, 'ACTIVE', 1130, 'bedroom, decor, realistic, pbr, mirror, floor', '{"defaultColor":"#475569","description":"Gương Lớn Tựa Tường Khung Kim Loại phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-mirror-wall', 'real-mirror-wall', 'Gương Tròn Treo Tường Viền Led', 'col-modern-realistic', 'wall-decor', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Mirror_Wall.glb', NULL, 0.75, 0.75, 0.04, false, false, 'ACTIVE', 1131, 'wall-decor, wall-decor, realistic, pbr, mirror, wall', '{"defaultColor":"#475569","description":"Gương Tròn Treo Tường Viền Led phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-mixer-stand', 'real-mixer-stand', 'Máy Đánh Trứng Để Bàn', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Mixer_Stand.glb', NULL, 0.28, 0.35, 0.32, false, true, 'ACTIVE', 1132, 'kitchen, decor, realistic, pbr, mixer, stand', '{"defaultColor":"#475569","description":"Máy Đánh Trứng Để Bàn phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-parasol-base', 'real-parasol-base', 'Chân Đế Dù Che Nắng', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Parasol_Base.glb', NULL, 0.55, 0.35, 0.55, false, false, 'ACTIVE', 1133, 'decor, decor, realistic, pbr, parasol, base', '{"defaultColor":"#475569","description":"Chân Đế Dù Che Nắng phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-parasol-garden', 'real-parasol-garden', 'Dù Che Nắng Sân Vườn Lệch Tâm', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Parasol_Garden.glb', NULL, 2.5, 2.6, 2.5, false, false, 'ACTIVE', 1134, 'decor, decor, realistic, pbr, parasol, garden', '{"defaultColor":"#475569","description":"Dù Che Nắng Sân Vườn Lệch Tâm phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-pedestal-filing', 'real-pedestal-filing', 'Hộc Tủ Di Động 3 Ngăn Kéo', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Pedestal_Filing.glb', NULL, 0.42, 0.62, 0.5, true, false, 'ACTIVE', 1135, 'office, storage, realistic, pbr, pedestal, filing', '{"defaultColor":"#475569","description":"Hộc Tủ Di Động 3 Ngăn Kéo phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-piano-upright', 'real-piano-upright', 'Đàn Piano Đứng Cơ Cổ Điển', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Piano_Upright.glb', NULL, 1.5, 1.25, 0.65, false, false, 'ACTIVE', 1136, 'living-room, decor, realistic, pbr, piano, upright', '{"defaultColor":"#475569","description":"Đàn Piano Đứng Cơ Cổ Điển phong cách hiện đại tả thực PBR sắc nét","icon":"Music"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-pit-fire', 'real-pit-fire', 'Bếp Lửa Sưởi Ấm Sân Vườn', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Pit_Fire.glb', NULL, 0.85, 0.45, 0.85, false, false, 'ACTIVE', 1137, 'decor, decor, realistic, pbr, pit, fire', '{"defaultColor":"#475569","description":"Bếp Lửa Sưởi Ấm Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-planter-box', 'real-planter-box', 'Chậu Gỗ Trồng Cây Chữ Nhật', 'col-modern-realistic', 'decor', 'plant', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Planter_Box.glb', NULL, 0.95, 0.45, 0.35, false, false, 'ACTIVE', 1138, 'decor, plant, realistic, pbr, planter, box', '{"defaultColor":"#475569","description":"Chậu Gỗ Trồng Cây Chữ Nhật phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-planter-hanging', 'real-planter-hanging', 'Chậu Cây Treo Ban Công', 'col-modern-realistic', 'decor', 'plant', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Planter_Hanging.glb', NULL, 0.35, 0.65, 0.35, false, false, 'ACTIVE', 1139, 'decor, plant, realistic, pbr, planter, hanging', '{"defaultColor":"#475569","description":"Chậu Cây Treo Ban Công phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-plant-small', 'real-plant-small', 'Chậu Cây Mini Để Bàn', 'col-modern-realistic', 'decor', 'plant', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Plant_Small.glb', NULL, 0.25, 0.35, 0.25, false, true, 'ACTIVE', 1140, 'decor, plant, realistic, pbr, plant, small', '{"defaultColor":"#475569","description":"Chậu Cây Mini Để Bàn phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-plant-tall', 'real-plant-tall', 'Chậu Cây Cảnh Lớn Đặt Sàn', 'col-modern-realistic', 'living-room', 'plant', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Plant_Tall.glb', NULL, 0.65, 1.65, 0.65, false, false, 'ACTIVE', 1141, 'living-room, plant, realistic, pbr, plant, tall', '{"defaultColor":"#475569","description":"Chậu Cây Cảnh Lớn Đặt Sàn phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-plinth-display', 'real-plinth-display', 'Bục Trưng Bày Hiện Vật', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Plinth_Display.glb', NULL, 0.45, 0.95, 0.45, true, false, 'ACTIVE', 1142, 'living-room, decor, realistic, pbr, plinth, display', '{"defaultColor":"#475569","description":"Bục Trưng Bày Hiện Vật phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-dish', 'real-rack-dish', 'Giá Úp Bát Đĩa Inox Thoát Nước', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Dish.glb', NULL, 0.48, 0.32, 0.35, false, true, 'ACTIVE', 1143, 'kitchen, decor, realistic, pbr, rack, dish', '{"defaultColor":"#475569","description":"Giá Úp Bát Đĩa Inox Thoát Nước phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-dumbbell', 'real-rack-dumbbell', 'Giá Để Tạ Tay Phòng Gym', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Dumbbell.glb', NULL, 1.1, 0.85, 0.55, false, false, 'ACTIVE', 1144, 'living-room, storage, realistic, pbr, rack, dumbbell', '{"defaultColor":"#475569","description":"Giá Để Tạ Tay Phòng Gym phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-glass', 'real-rack-glass', 'Giá Treo Ly Rượu Vang', 'col-modern-realistic', 'kitchen', 'decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Glass.glb', NULL, 0.65, 0.3, 0.25, false, false, 'ACTIVE', 1145, 'kitchen, decor, realistic, pbr, rack, glass', '{"defaultColor":"#475569","description":"Giá Treo Ly Rượu Vang phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-luggage', 'real-rack-luggage', 'Giá Kê Vali Khách Sạn', 'col-modern-realistic', 'bedroom', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Luggage.glb', NULL, 0.65, 0.55, 0.45, true, false, 'ACTIVE', 1146, 'bedroom, decor, realistic, pbr, rack, luggage', '{"defaultColor":"#475569","description":"Giá Kê Vali Khách Sạn phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-magazine', 'real-rack-magazine', 'Kệ Đựng Tạp Chí Báo Bằng Kim Loại', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Magazine.glb', NULL, 0.38, 0.75, 0.3, false, false, 'ACTIVE', 1147, 'living-room, storage, realistic, pbr, rack, magazine', '{"defaultColor":"#475569","description":"Kệ Đựng Tạp Chí Báo Bằng Kim Loại phong cách hiện đại tả thực PBR sắc nét","icon":"BookOpen"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-peg', 'real-rack-peg', 'Móc Treo Tường Núm Gỗ Đa Năng', 'col-modern-realistic', 'wall-decor', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Peg.glb', NULL, 0.65, 0.12, 0.08, false, false, 'ACTIVE', 1148, 'wall-decor, wall-decor, realistic, pbr, rack, peg', '{"defaultColor":"#475569","description":"Móc Treo Tường Núm Gỗ Đa Năng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-pot', 'real-rack-pot', 'Giá Treo Xoong Chảo Bếp', 'col-modern-realistic', 'kitchen', 'storage', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Pot.glb', NULL, 0.85, 0.25, 0.3, false, false, 'ACTIVE', 1149, 'kitchen, storage, realistic, pbr, rack, pot', '{"defaultColor":"#475569","description":"Giá Treo Xoong Chảo Bếp phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rack-wine', 'real-rack-wine', 'Kệ Đựng Rượu Vang Gỗ Nhiều Tầng', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rack_Wine.glb', NULL, 0.65, 1.15, 0.32, true, false, 'ACTIVE', 1150, 'kitchen, storage, realistic, pbr, rack, wine', '{"defaultColor":"#475569","description":"Kệ Đựng Rượu Vang Gỗ Nhiều Tầng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-radiator-panel', 'real-radiator-panel', 'Tấm Tản Nhiệt Sưởi Ấm Gắn Tường', 'col-modern-realistic', 'wall-decor', 'decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Radiator_Panel.glb', NULL, 1, 0.6, 0.1, false, false, 'ACTIVE', 1151, 'wall-decor, decor, realistic, pbr, radiator, panel', '{"defaultColor":"#475569","description":"Tấm Tản Nhiệt Sưởi Ấm Gắn Tường phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rail-garment', 'real-rail-garment', 'Giá Treo Quần Áo Khung Thép', 'col-modern-realistic', 'bedroom', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rail_Garment.glb', NULL, 1.1, 1.65, 0.45, false, false, 'ACTIVE', 1152, 'bedroom, storage, realistic, pbr, rail, garment', '{"defaultColor":"#475569","description":"Giá Treo Quần Áo Khung Thép phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rail-hooks', 'real-rail-hooks', 'Thanh Móc Treo Đồ Đa Năng', 'col-modern-realistic', 'wall-decor', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rail_Hooks.glb', NULL, 0.6, 0.1, 0.06, false, false, 'ACTIVE', 1153, 'wall-decor, wall-decor, realistic, pbr, rail, hooks', '{"defaultColor":"#475569","description":"Thanh Móc Treo Đồ Đa Năng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rail-towel', 'real-rail-towel', 'Giá Treo Khăn Tắm Inox', 'col-modern-realistic', 'bathroom', 'wall-decor', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rail_Towel.glb', NULL, 0.65, 0.12, 0.15, false, false, 'ACTIVE', 1154, 'bathroom, wall-decor, realistic, pbr, rail, towel', '{"defaultColor":"#475569","description":"Giá Treo Khăn Tắm Inox phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-reel-hose', 'real-reel-hose', 'Cuộn Dây Tưới Cây Sân Vườn', 'col-modern-realistic', 'decor', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Reel_Hose.glb', NULL, 0.45, 0.55, 0.4, false, false, 'ACTIVE', 1155, 'decor, decor, realistic, pbr, reel, hose', '{"defaultColor":"#475569","description":"Cuộn Dây Tưới Cây Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rug-rect', 'real-rug-rect', 'Thảm Trải Sàn Chữ Nhật Dệt Hoạ Tiết', 'col-modern-realistic', 'living-room', 'rug', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rug_Rect.glb', NULL, 2.4, 0.02, 1.6, false, false, 'ACTIVE', 1156, 'living-room, rug, realistic, pbr, rug, rect', '{"defaultColor":"#475569","description":"Thảm Trải Sàn Chữ Nhật Dệt Hoạ Tiết phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-rug-round', 'real-rug-round', 'Thảm Tròn Lông Ngắn Phòng Khách', 'col-modern-realistic', 'living-room', 'rug', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Rug_Round.glb', NULL, 1.8, 0.02, 1.8, false, false, 'ACTIVE', 1157, 'living-room, rug, realistic, pbr, rug, round', '{"defaultColor":"#475569","description":"Thảm Tròn Lông Ngắn Phòng Khách phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-scales-kitchen', 'real-scales-kitchen', 'Cân Điện Tử Nhà Bếp', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Scales_Kitchen.glb', NULL, 0.22, 0.04, 0.18, false, true, 'ACTIVE', 1158, 'kitchen, decor, realistic, pbr, scales, kitchen', '{"defaultColor":"#475569","description":"Cân Điện Tử Nhà Bếp phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-screen-desk', 'real-screen-desk', 'Vách Ngăn Bàn Làm Việc', 'col-modern-realistic', 'office', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Screen_Desk.glb', NULL, 1.2, 0.4, 0.04, false, true, 'ACTIVE', 1159, 'office, decor, realistic, pbr, screen, desk', '{"defaultColor":"#475569","description":"Vách Ngăn Bàn Làm Việc phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-screen-fire', 'real-screen-fire', 'Tấm Chắn Tàn Lửa Lò Sưởi', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Screen_Fire.glb', NULL, 0.85, 0.65, 0.15, false, false, 'ACTIVE', 1160, 'living-room, decor, realistic, pbr, screen, fire', '{"defaultColor":"#475569","description":"Tấm Chắn Tàn Lửa Lò Sưởi phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-screen-folding', 'real-screen-folding', 'Bình Phong Gấp 3 Cánh Ngăn Phòng', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Screen_Folding.glb', NULL, 1.5, 1.75, 0.08, false, false, 'ACTIVE', 1161, 'living-room, decor, realistic, pbr, screen, folding', '{"defaultColor":"#475569","description":"Bình Phong Gấp 3 Cánh Ngăn Phòng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-seating-beam', 'real-seating-beam', 'Băng Ghế Chờ Chân Sắt 4 Chỗ', 'col-modern-realistic', 'office', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Seating_Beam.glb', NULL, 2, 0.82, 0.6, false, false, 'ACTIVE', 1162, 'office, seating, realistic, pbr, seating, beam', '{"defaultColor":"#475569","description":"Băng Ghế Chờ Chân Sắt 4 Chỗ phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-setting-place', 'real-setting-place', 'Bộ Dao Thìa Đĩa Ăn Cao Cấp', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Setting_Place.glb', NULL, 0.45, 0.05, 0.35, false, true, 'ACTIVE', 1163, 'kitchen, decor, realistic, pbr, setting, place', '{"defaultColor":"#475569","description":"Bộ Dao Thìa Đĩa Ăn Cao Cấp phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-set-fire-irons', 'real-set-fire-irons', 'Bộ Dụng Cụ Gắp Than Lò Sưởi', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Set_Fire_Irons.glb', NULL, 0.25, 0.75, 0.25, false, false, 'ACTIVE', 1164, 'living-room, decor, realistic, pbr, set, fire, irons', '{"defaultColor":"#475569","description":"Bộ Dụng Cụ Gắp Than Lò Sưởi phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shelf-corner', 'real-shelf-corner', 'Kệ Góc Tường Đa Tầng', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Shelf_Corner.glb', NULL, 0.45, 1.45, 0.45, true, false, 'ACTIVE', 1165, 'living-room, storage, realistic, pbr, shelf, corner', '{"defaultColor":"#475569","description":"Kệ Góc Tường Đa Tầng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shelf-cube', 'real-shelf-cube', 'Kệ Hộp Vuông Treo Tường Modul', 'col-modern-realistic', 'wall-decor', 'storage', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Shelf_Cube.glb', NULL, 0.38, 0.38, 0.25, true, false, 'ACTIVE', 1166, 'wall-decor, storage, realistic, pbr, shelf, cube', '{"defaultColor":"#475569","description":"Kệ Hộp Vuông Treo Tường Modul phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shelf-etagere', 'real-shelf-etagere', 'Kệ Trưng Bày Đứng Khung Kim Loại', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Shelf_Etagere.glb', NULL, 0.85, 1.75, 0.35, true, false, 'ACTIVE', 1167, 'living-room, storage, realistic, pbr, shelf, etagere', '{"defaultColor":"#475569","description":"Kệ Trưng Bày Đứng Khung Kim Loại phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shelf-garden', 'real-shelf-garden', 'Kệ Để Cây Cảnh Sân Vườn', 'col-modern-realistic', 'decor', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Shelf_Garden.glb', NULL, 0.9, 1.1, 0.4, true, false, 'ACTIVE', 1168, 'decor, storage, realistic, pbr, shelf, garden', '{"defaultColor":"#475569","description":"Kệ Để Cây Cảnh Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shelf-kitchen', 'real-shelf-kitchen', 'Kệ Gia Vị Bếp Đa Năng', 'col-modern-realistic', 'kitchen', 'storage', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Shelf_Kitchen.glb', NULL, 0.75, 0.45, 0.22, true, false, 'ACTIVE', 1169, 'kitchen, storage, realistic, pbr, shelf, kitchen', '{"defaultColor":"#475569","description":"Kệ Gia Vị Bếp Đa Năng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shelf-ladder', 'real-shelf-ladder', 'Kệ Thang Dựa Tường Hiện Đại', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Shelf_Ladder.glb', NULL, 0.65, 1.8, 0.38, true, false, 'ACTIVE', 1170, 'living-room, storage, realistic, pbr, shelf, ladder', '{"defaultColor":"#475569","description":"Kệ Thang Dựa Tường Hiện Đại phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shelf-wall', 'real-shelf-wall', 'Kệ Gỗ Nổi Gắn Tường', 'col-modern-realistic', 'wall-decor', 'storage', 'wall', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Shelf_Wall.glb', NULL, 0.9, 0.05, 0.2, true, false, 'ACTIVE', 1171, 'wall-decor, storage, realistic, pbr, shelf, wall', '{"defaultColor":"#475569","description":"Kệ Gỗ Nổi Gắn Tường phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-shower-enclosure', 'real-shower-enclosure', 'Vách Kính Tắm Đứng Cường Lực', 'col-modern-realistic', 'bathroom', 'decor', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Shower_Enclosure.glb', NULL, 0.95, 2.05, 0.95, false, false, 'ACTIVE', 1172, 'bathroom, decor, realistic, pbr, shower, enclosure', '{"defaultColor":"#475569","description":"Vách Kính Tắm Đứng Cường Lực phong cách hiện đại tả thực PBR sắc nét","icon":"Bath"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-sideboard', 'real-sideboard', 'Tủ Búp Phê Dài Phòng Ăn Sideboard', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Sideboard.glb', NULL, 1.8, 0.82, 0.48, true, false, 'ACTIVE', 1173, 'kitchen, storage, realistic, pbr, sideboard', '{"defaultColor":"#475569","description":"Tủ Búp Phê Dài Phòng Ăn Sideboard phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-sofa-loveseat', 'real-sofa-loveseat', 'Sofa Đôi Loveseat Nhỏ Gọn', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Sofa_Loveseat.glb', NULL, 1.4, 0.82, 0.85, false, false, 'ACTIVE', 1174, 'living-room, seating, realistic, pbr, sofa, loveseat', '{"defaultColor":"#475569","description":"Sofa Đôi Loveseat Nhỏ Gọn phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stack-magazine', 'real-stack-magazine', 'Chồng Tạp Chí Thời Trang Decor', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stack_Magazine.glb', NULL, 0.28, 0.15, 0.22, false, true, 'ACTIVE', 1175, 'living-room, decor, realistic, pbr, stack, magazine', '{"defaultColor":"#475569","description":"Chồng Tạp Chí Thời Trang Decor phong cách hiện đại tả thực PBR sắc nét","icon":"BookOpen"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stand-cake', 'real-stand-cake', 'Khay Đĩa Trưng Bày Bánh Ngọt', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stand_Cake.glb', NULL, 0.3, 0.25, 0.3, false, true, 'ACTIVE', 1176, 'kitchen, decor, realistic, pbr, stand, cake', '{"defaultColor":"#475569","description":"Khay Đĩa Trưng Bày Bánh Ngọt phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stand-music', 'real-stand-music', 'Giá Để Bản Nhạc Bằng Kim Loại', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stand_Music.glb', NULL, 0.45, 1.25, 0.4, false, false, 'ACTIVE', 1177, 'living-room, decor, realistic, pbr, stand, music', '{"defaultColor":"#475569","description":"Giá Để Bản Nhạc Bằng Kim Loại phong cách hiện đại tả thực PBR sắc nét","icon":"Music"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stand-umbrella', 'real-stand-umbrella', 'Ống Cắm Ô Dù Tiền Sảnh', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stand_Umbrella.glb', NULL, 0.25, 0.55, 0.25, false, false, 'ACTIVE', 1178, 'living-room, decor, realistic, pbr, stand, umbrella', '{"defaultColor":"#475569","description":"Ống Cắm Ô Dù Tiền Sảnh phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stool-footstool', 'real-stool-footstool', 'Đôn Gác Chân Sofa Nhỏ Gọn', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stool_Footstool.glb', NULL, 0.45, 0.38, 0.35, false, false, 'ACTIVE', 1179, 'living-room, seating, realistic, pbr, stool, footstool', '{"defaultColor":"#475569","description":"Đôn Gác Chân Sofa Nhỏ Gọn phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stool-piano', 'real-stool-piano', 'Ghế Đàn Piano Đệm Da Cao Cấp', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stool_Piano.glb', NULL, 0.65, 0.5, 0.35, false, false, 'ACTIVE', 1180, 'living-room, seating, realistic, pbr, stool, piano', '{"defaultColor":"#475569","description":"Ghế Đàn Piano Đệm Da Cao Cấp phong cách hiện đại tả thực PBR sắc nét","icon":"Music"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stool-pouffe', 'real-stool-pouffe', 'Đôn Phao Lười Tròn Decor', 'col-modern-realistic', 'living-room', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stool_Pouffe.glb', NULL, 0.55, 0.35, 0.55, false, false, 'ACTIVE', 1181, 'living-room, seating, realistic, pbr, stool, pouffe', '{"defaultColor":"#475569","description":"Đôn Phao Lười Tròn Decor phong cách hiện đại tả thực PBR sắc nét","icon":"Armchair"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stool-step', 'real-stool-step', 'Ghế Đôn Bậc Thang Gỗ Gia Đình', 'col-modern-realistic', 'kitchen', 'seating', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Stool_Step.glb', NULL, 0.42, 0.48, 0.42, false, false, 'ACTIVE', 1182, 'kitchen, seating, realistic, pbr, stool, step', '{"defaultColor":"#475569","description":"Ghế Đôn Bậc Thang Gỗ Gia Đình phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-store-tool', 'real-store-tool', 'Tủ Chứa Dụng Cụ Kỹ Thuật', 'col-modern-realistic', 'office', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Store_Tool.glb', NULL, 0.85, 1.6, 0.45, false, false, 'ACTIVE', 1183, 'office, storage, realistic, pbr, store, tool', '{"defaultColor":"#475569","description":"Tủ Chứa Dụng Cụ Kỹ Thuật phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-stove-wood', 'real-stove-wood', 'Lò Sưởi Đốt Củi Gang Đen Cổ Điển', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Stove_Wood.glb', NULL, 0.75, 0.95, 0.55, false, false, 'ACTIVE', 1184, 'living-room, decor, realistic, pbr, stove, wood', '{"defaultColor":"#475569","description":"Lò Sưởi Đốt Củi Gang Đen Cổ Điển phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-swing-garden', 'real-swing-garden', 'Xích Đu Sân Vườn Có Mái Che', 'col-modern-realistic', 'decor', 'seating', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Swing_Garden.glb', NULL, 1.8, 1.9, 1.2, false, false, 'ACTIVE', 1185, 'decor, seating, realistic, pbr, swing, garden', '{"defaultColor":"#475569","description":"Xích Đu Sân Vườn Có Mái Che phong cách hiện đại tả thực PBR sắc nét","icon":"Sun"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-bar-communal', 'real-table-bar-communal', 'Bàn Bar Dài Tiếp Khách Cộng Đồng', 'col-modern-realistic', 'kitchen', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Table_Bar_Communal.glb', NULL, 2.2, 1.05, 0.7, true, false, 'ACTIVE', 1186, 'kitchen, table, realistic, pbr, table, bar, communal', '{"defaultColor":"#475569","description":"Bàn Bar Dài Tiếp Khách Cộng Đồng phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-bistro', 'real-table-bistro', 'Bàn Tròn Nhỏ Phong Cách Quán Bistro', 'col-modern-realistic', 'kitchen', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Bistro.glb', NULL, 0.7, 0.75, 0.7, true, false, 'ACTIVE', 1187, 'kitchen, table, realistic, pbr, table, bistro', '{"defaultColor":"#475569","description":"Bàn Tròn Nhỏ Phong Cách Quán Bistro phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-cafe-round', 'real-table-cafe-round', 'Bàn Tròn Cafe Chân Kim Loại', 'col-modern-realistic', 'kitchen', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Cafe_Round.glb', NULL, 0.8, 0.75, 0.8, true, false, 'ACTIVE', 1188, 'kitchen, table, realistic, pbr, table, cafe, round', '{"defaultColor":"#475569","description":"Bàn Tròn Cafe Chân Kim Loại phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-cframe', 'real-table-cframe', 'Bàn C Kẹp Cạnh Giường & Sofa', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Cframe.glb', NULL, 0.45, 0.62, 0.35, true, false, 'ACTIVE', 1189, 'living-room, table, realistic, pbr, table, cframe', '{"defaultColor":"#475569","description":"Bàn C Kẹp Cạnh Giường & Sofa phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-changing', 'real-table-changing', 'Bàn Thay Tã Cho Trẻ Sơ Sinh', 'col-modern-realistic', 'bedroom', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Changing.glb', NULL, 0.85, 0.95, 0.55, true, false, 'ACTIVE', 1190, 'bedroom, table, realistic, pbr, table, changing', '{"defaultColor":"#475569","description":"Bàn Thay Tã Cho Trẻ Sơ Sinh phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-conference', 'real-table-conference', 'Bàn Họp Văn Phòng Lớn 12 Người', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Table_Conference.glb', NULL, 3.2, 0.76, 1.2, true, false, 'ACTIVE', 1191, 'office, table, realistic, pbr, table, conference', '{"defaultColor":"#475569","description":"Bàn Họp Văn Phòng Lớn 12 Người phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-console-slab', 'real-table-console-slab', 'Bàn Console Gỗ Nguyên Tấm', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Table_Console_Slab.glb', NULL, 1.4, 0.88, 0.4, true, false, 'ACTIVE', 1192, 'living-room, table, realistic, pbr, table, console, slab', '{"defaultColor":"#475569","description":"Bàn Console Gỗ Nguyên Tấm phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-demilune', 'real-table-demilune', 'Bàn Bán Nguyệt Áp Tường Cổ Điển', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Demilune.glb', NULL, 0.95, 0.8, 0.45, true, false, 'ACTIVE', 1193, 'living-room, table, realistic, pbr, table, demilune', '{"defaultColor":"#475569","description":"Bàn Bán Nguyệt Áp Tường Cổ Điển phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-drafting', 'real-table-drafting', 'Bàn Vẽ Kiến Trúc Nghiêng', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Drafting.glb', NULL, 1.2, 0.95, 0.8, true, false, 'ACTIVE', 1194, 'office, table, realistic, pbr, table, drafting', '{"defaultColor":"#475569","description":"Bàn Vẽ Kiến Trúc Nghiêng phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-drop-leaf', 'real-table-drop-leaf', 'Bàn Ăn Gấp Cánh Tiết Kiệm Diện Tích', 'col-modern-realistic', 'kitchen', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Drop_Leaf.glb', NULL, 1.1, 0.75, 0.8, true, false, 'ACTIVE', 1195, 'kitchen, table, realistic, pbr, table, drop, leaf', '{"defaultColor":"#475569","description":"Bàn Ăn Gấp Cánh Tiết Kiệm Diện Tích phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-folding', 'real-table-folding', 'Bàn Gấp Đa Năng Du Lịch & Hội Thảo', 'col-modern-realistic', 'office', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Folding.glb', NULL, 1.4, 0.74, 0.7, true, false, 'ACTIVE', 1196, 'office, table, realistic, pbr, table, folding', '{"defaultColor":"#475569","description":"Bàn Gấp Đa Năng Du Lịch & Hội Thảo phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-garden', 'real-table-garden', 'Bàn Ăn Sân Vườn Chữ Nhật', 'col-modern-realistic', 'decor', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Garden.glb', NULL, 1.6, 0.75, 0.85, true, false, 'ACTIVE', 1197, 'decor, table, realistic, pbr, table, garden', '{"defaultColor":"#475569","description":"Bàn Ăn Sân Vườn Chữ Nhật phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-garden-round', 'real-table-garden-round', 'Bàn Sân Vườn Tròn Bằng Nhôm Đúc', 'col-modern-realistic', 'decor', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Garden_Round.glb', NULL, 1, 0.75, 1, true, false, 'ACTIVE', 1198, 'decor, table, realistic, pbr, table, garden, round', '{"defaultColor":"#475569","description":"Bàn Sân Vườn Tròn Bằng Nhôm Đúc phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-lift', 'real-table-lift', 'Bàn Trà Nâng Mặt Thông Minh', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Table_Lift.glb', NULL, 1.1, 0.48, 0.6, true, false, 'ACTIVE', 1199, 'living-room, table, realistic, pbr, table, lift', '{"defaultColor":"#475569","description":"Bàn Trà Nâng Mặt Thông Minh phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-nest', 'real-table-nest', 'Bộ Bàn Tam Giác Lồng 3 Chiếc', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Nest.glb', NULL, 0.65, 0.5, 0.65, true, false, 'ACTIVE', 1200, 'living-room, table, realistic, pbr, table, nest', '{"defaultColor":"#475569","description":"Bộ Bàn Tam Giác Lồng 3 Chiếc phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-picnic', 'real-table-picnic', 'Bàn Ghế Picnic Liền Khối Sân Vườn', 'col-modern-realistic', 'decor', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Picnic.glb', NULL, 1.8, 0.75, 1.5, true, false, 'ACTIVE', 1201, 'decor, table, realistic, pbr, table, picnic', '{"defaultColor":"#475569","description":"Bàn Ghế Picnic Liền Khối Sân Vườn phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-pool', 'real-table-pool', 'Bàn Bida Lỗ Chuyên Nghiệp 9ft', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Table_Pool.glb', NULL, 2.8, 0.82, 1.5, true, false, 'ACTIVE', 1202, 'living-room, table, realistic, pbr, table, pool', '{"defaultColor":"#475569","description":"Bàn Bida Lỗ Chuyên Nghiệp 9ft phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-poseur', 'real-table-poseur', 'Bàn Đứng Sự Kiện Cocktail', 'col-modern-realistic', 'kitchen', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Poseur.glb', NULL, 0.65, 1.05, 0.65, true, false, 'ACTIVE', 1203, 'kitchen, table, realistic, pbr, table, poseur', '{"defaultColor":"#475569","description":"Bàn Đứng Sự Kiện Cocktail phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-side', 'real-table-side', 'Bàn Tab Kê Cạnh Sofa Gỗ', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Side.glb', NULL, 0.5, 0.55, 0.5, true, false, 'ACTIVE', 1204, 'living-room, table, realistic, pbr, table, side', '{"defaultColor":"#475569","description":"Bàn Tab Kê Cạnh Sofa Gỗ phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-side-drum', 'real-table-side-drum', 'Bàn Tab Hình Trống Decor', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Side_Drum.glb', NULL, 0.42, 0.48, 0.42, true, false, 'ACTIVE', 1205, 'living-room, table, realistic, pbr, table, side, drum', '{"defaultColor":"#475569","description":"Bàn Tab Hình Trống Decor phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-tennis', 'real-table-tennis', 'Bàn Bóng Bàn Thi Đấu Chuẩn', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'STUDIO', 89000, '/furniture/realistic/FN_Table_Tennis.glb', NULL, 2.74, 0.76, 1.52, true, false, 'ACTIVE', 1206, 'living-room, table, realistic, pbr, table, tennis', '{"defaultColor":"#475569","description":"Bàn Bóng Bàn Thi Đấu Chuẩn phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-trestle', 'real-table-trestle', 'Bàn Ăn Chân Chữ X Phong Cách Mộc', 'col-modern-realistic', 'kitchen', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Trestle.glb', NULL, 1.9, 0.76, 0.9, true, false, 'ACTIVE', 1207, 'kitchen, table, realistic, pbr, table, trestle', '{"defaultColor":"#475569","description":"Bàn Ăn Chân Chữ X Phong Cách Mộc phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-table-tripod', 'real-table-tripod', 'Bàn Tròn 3 Chân Gỗ Sồi', 'col-modern-realistic', 'living-room', 'table', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Table_Tripod.glb', NULL, 0.55, 0.52, 0.55, true, false, 'ACTIVE', 1208, 'living-room, table, realistic, pbr, table, tripod', '{"defaultColor":"#475569","description":"Bàn Tròn 3 Chân Gỗ Sồi phong cách hiện đại tả thực PBR sắc nét","icon":"Table"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-throw-folded', 'real-throw-folded', 'Chăn Len Gấp Trang Trí Sofa', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Throw_Folded.glb', NULL, 0.45, 0.1, 0.35, false, true, 'ACTIVE', 1209, 'living-room, decor, realistic, pbr, throw, folded', '{"defaultColor":"#475569","description":"Chăn Len Gấp Trang Trí Sofa phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-toaster', 'real-toaster', 'Máy Nướng Bánh Mì Lát Để Bàn', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Toaster.glb', NULL, 0.26, 0.2, 0.16, false, true, 'ACTIVE', 1210, 'kitchen, decor, realistic, pbr, toaster', '{"defaultColor":"#475569","description":"Máy Nướng Bánh Mì Lát Để Bàn phong cách hiện đại tả thực PBR sắc nét","icon":"Flame"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-tray-serving', 'real-tray-serving', 'Khay Trà Gỗ Phục Vụ', 'col-modern-realistic', 'kitchen', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Tray_Serving.glb', NULL, 0.45, 0.05, 0.3, false, true, 'ACTIVE', 1211, 'kitchen, decor, realistic, pbr, tray, serving', '{"defaultColor":"#475569","description":"Khay Trà Gỗ Phục Vụ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-tree-cat', 'real-tree-cat', 'Trụ Cào Móng Cây Mèo Nhiều Tầng', 'col-modern-realistic', 'living-room', 'decor', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Tree_Cat.glb', NULL, 0.65, 1.45, 0.65, false, false, 'ACTIVE', 1212, 'living-room, decor, realistic, pbr, tree, cat', '{"defaultColor":"#475569","description":"Trụ Cào Móng Cây Mèo Nhiều Tầng phong cách hiện đại tả thực PBR sắc nét","icon":"Trees"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-trolley-butcher', 'real-trolley-butcher', 'Xe Đẩy Bếp Đảo Thớt Gỗ', 'col-modern-realistic', 'kitchen', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Trolley_Butcher.glb', NULL, 0.85, 0.9, 0.55, true, false, 'ACTIVE', 1213, 'kitchen, storage, realistic, pbr, trolley, butcher', '{"defaultColor":"#475569","description":"Xe Đẩy Bếp Đảo Thớt Gỗ phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-trunk-storage', 'real-trunk-storage', 'Rương Gỗ Lưu Trữ Đồ Vintage', 'col-modern-realistic', 'living-room', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Trunk_Storage.glb', NULL, 0.9, 0.55, 0.5, true, false, 'ACTIVE', 1214, 'living-room, storage, realistic, pbr, trunk, storage', '{"defaultColor":"#475569","description":"Rương Gỗ Lưu Trữ Đồ Vintage phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO furniture_models (id, code, name, collection_id, category, model_type, mount_type, style, tier, required_plan, price, model_path, thumbnail_path, dimension_x, dimension_y, dimension_z, is_surface_host, can_place_on_surface, status, sort_order, tags, metadata_json)
VALUES ('real-wardrobe-single', 'real-wardrobe-single', 'Tủ Quần Áo Đơn 1 Buồng', 'col-modern-realistic', 'bedroom', 'storage', 'floor', 'realistic', 'premium', 'PLUS', 39000, '/furniture/realistic/FN_Wardrobe_Single.glb', NULL, 0.8, 2.05, 0.55, false, false, 'ACTIVE', 1215, 'bedroom, storage, realistic, pbr, wardrobe, single', '{"defaultColor":"#475569","description":"Tủ Quần Áo Đơn 1 Buồng phong cách hiện đại tả thực PBR sắc nét","icon":"Box"}'::jsonb)
ON CONFLICT (code) DO NOTHING;
