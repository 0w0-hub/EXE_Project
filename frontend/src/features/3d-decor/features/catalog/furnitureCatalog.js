/**
 * Danh mục đồ nội thất chuẩn ánh xạ trực tiếp tới kho 87+ mô hình 3D thực tế .glb
 */
export const FURNITURE_CATEGORIES = [
  { id: 'all', name: 'Tất cả' },
  { id: 'doors-windows', name: 'Cửa & Cửa Sổ', hidden: true },
  { id: 'wall-decor', name: 'Trang Trí Gắn Tường' },
  { id: 'living-room', name: 'Phòng Khách' },
  { id: 'bedroom', name: 'Phòng Ngủ' },
  { id: 'kitchen', name: 'Bếp & Bàn Ăn' },
  { id: 'office', name: 'Góc Làm Việc' },
  { id: 'bathroom', name: 'Phòng Tắm & Giặt' },
  { id: 'decor', name: 'Đèn & Trang Trí' },
  { id: 'procedural', name: 'Đồ Code (Đổi Màu)', hidden: true },
];

export const FURNITURE_CATALOG = [
  // --- PHÒNG KHÁCH ---
  {
    id: 'sofa-classic',
    name: 'Sofa Văng Dài 3 Chỗ',
    category: 'living-room',
    modelPath: '/furniture/seating.glb',
    dimensions: { width: 2.1, height: 0.85, depth: 0.9 },
    defaultColor: '#3b82f6',
    icon: 'Armchair',
    modelType: 'seating',
    description: 'Sofa văng bọc nỉ êm ái cho phòng khách'
  },
  {
    id: 'sofa-corner-l',
    name: 'Sofa Góc Chữ L Hiện Đại',
    category: 'living-room',
    modelPath: '/furniture/seating-2.glb',
    dimensions: { width: 2.5, height: 0.85, depth: 1.6 },
    defaultColor: '#475569',
    icon: 'Armchair',
    modelType: 'seating',
    description: 'Sofa góc rộng rãi tối ưu góc phòng'
  },
  {
    id: 'armchair-accent',
    name: 'Ghế Bành Thư Giãn',
    category: 'living-room',
    modelPath: '/furniture/seating-3.glb',
    dimensions: { width: 0.9, height: 0.9, depth: 0.85 },
    defaultColor: '#f59e0b',
    icon: 'Armchair',
    modelType: 'seating',
    description: 'Ghế bành đơn nệm dày bọc vải cao cấp'
  },
  {
    id: 'lounge-chair',
    name: 'Ghế Tựa Lưng Bắc Âu',
    category: 'living-room',
    modelPath: '/furniture/seating-4.glb',
    dimensions: { width: 0.8, height: 0.85, depth: 0.8 },
    defaultColor: '#10b981',
    icon: 'Armchair',
    modelType: 'seating',
    description: 'Ghế thư giãn phong cách Scandinavian'
  },
  {
    id: 'coffee-table-wood',
    name: 'Bàn Trà Gỗ Chữ Nhật',
    category: 'living-room',
    modelPath: '/furniture/table.glb',
    dimensions: { width: 1.2, height: 0.45, depth: 0.6 },
    defaultColor: '#78350f',
    icon: 'Table',
    modelType: 'table',
    isSurfaceHost: true,
    description: 'Bàn trà mặt gỗ tự nhiên sang trọng'
  },
  {
    id: 'coffee-table-glass',
    name: 'Bàn Trà Mặt Kính Hiện Đại',
    category: 'living-room',
    modelPath: '/furniture/table-2.glb',
    dimensions: { width: 1.1, height: 0.42, depth: 0.55 },
    defaultColor: '#334155',
    icon: 'Table',
    modelType: 'table',
    isSurfaceHost: true,
    description: 'Bàn trà khung kim loại mặt kính cường lực'
  },
  {
    id: 'coffee-table-round',
    name: 'Bàn Tròn Cafe Nhỏ',
    category: 'living-room',
    modelPath: '/furniture/table-3.glb',
    dimensions: { width: 0.7, height: 0.5, depth: 0.7 },
    defaultColor: '#a16207',
    icon: 'Table',
    modelType: 'table',
    isSurfaceHost: true,
    description: 'Bàn tròn cafe đặt cạnh sofa'
  },
  {
    id: 'tv-console-modern',
    name: 'Kệ Tivi Hiện Đại',
    category: 'living-room',
    modelPath: '/furniture/storage-3.glb',
    dimensions: { width: 1.8, height: 0.5, depth: 0.42 },
    defaultColor: '#1e293b',
    icon: 'Tv',
    modelType: 'storage',
    isSurfaceHost: true,
    description: 'Kệ tivi phòng khách có ngăn lưu trữ'
  },
  {
    id: 'tv-screen-flat',
    name: 'Tivi Màn Hình Phẳng 65 inch',
    category: 'living-room',
    modelPath: '/furniture/decor-tv.glb',
    dimensions: { width: 1.45, height: 0.85, depth: 0.15 },
    defaultColor: '#0f172a',
    icon: 'Tv',
    modelType: 'decor',
    canPlaceOnSurface: true,
    description: 'Smart TV màn hình lớn gắn tường hoặc kệ'
  },
  {
    id: 'bookshelf-tall',
    name: 'Kệ Sách Gỗ Đứng Cao',
    category: 'living-room',
    modelPath: '/furniture/storage.glb',
    dimensions: { width: 0.9, height: 1.85, depth: 0.35 },
    defaultColor: '#854d0e',
    icon: 'BookOpen',
    modelType: 'storage',
    description: 'Kệ sách nhiều tầng trưng bày sách & đồ trang trí'
  },

  // --- PHÒNG NGỦ ---
  {
    id: 'bed-master-queen',
    name: 'Giường Ngủ Đôi Queen Size',
    category: 'bedroom',
    modelPath: '/furniture/decor-bed.glb',
    dimensions: { width: 1.8, height: 1.0, depth: 2.1 },
    defaultColor: '#475569',
    icon: 'Bed',
    modelType: 'bed',
    description: 'Giường đôi nệm êm có tựa đầu giường bọc nỉ'
  },
  {
    id: 'bed-single',
    name: 'Giường Đơn Nhỏ Gọn',
    category: 'bedroom',
    modelPath: '/furniture/decor-bed-2.glb',
    dimensions: { width: 1.1, height: 0.9, depth: 2.0 },
    defaultColor: '#3b82f6',
    icon: 'Bed',
    modelType: 'bed',
    description: 'Giường đơn cho phòng ngủ phụ hoặc trẻ em'
  },
  {
    id: 'bed-bunk',
    name: 'Giường Tầng Tiết Kiệm Diện Tích',
    category: 'bedroom',
    modelPath: '/furniture/decor-bed-3.glb',
    dimensions: { width: 1.1, height: 1.7, depth: 2.0 },
    defaultColor: '#94a3b8',
    icon: 'Layers',
    modelType: 'bed',
    description: 'Giường tầng gỗ vững chãi cho 2 người'
  },
  {
    id: 'nightstand-wood',
    name: 'Tủ Đầu Giường 2 Ngăn',
    category: 'bedroom',
    modelPath: '/furniture/decor-nightstand.glb',
    dimensions: { width: 0.5, height: 0.55, depth: 0.45 },
    defaultColor: '#b45309',
    icon: 'Box',
    modelType: 'storage',
    isSurfaceHost: true,
    description: 'Tab đầu giường để đèn ngủ và điện thoại'
  },
  {
    id: 'wardrobe-storage',
    name: 'Tủ Quần Áo Đứng',
    category: 'bedroom',
    modelPath: '/furniture/storage-2.glb',
    dimensions: { width: 1.2, height: 1.9, depth: 0.55 },
    defaultColor: '#f8fafc',
    icon: 'Box',
    modelType: 'storage',
    description: 'Tủ quần áo 2 cánh đứng sát tường'
  },

  // --- BẾP & BÀN ĂN ---
  {
    id: 'dining-table-wood',
    name: 'Bàn Ăn Gia Đình 6 Ghế',
    category: 'kitchen',
    modelPath: '/furniture/table-6.glb',
    dimensions: { width: 1.6, height: 0.76, depth: 0.85 },
    defaultColor: '#78350f',
    icon: 'Table',
    modelType: 'table',
    isSurfaceHost: true,
    description: 'Bàn ăn chữ nhật chân gỗ tự nhiên chắc chắn'
  },
  {
    id: 'kitchen-cabinet',
    name: 'Tủ Bếp Liên Hoàn',
    category: 'kitchen',
    modelPath: '/furniture/storage-8.glb',
    dimensions: { width: 1.5, height: 0.85, depth: 0.6 },
    defaultColor: '#f1f5f9',
    icon: 'Box',
    modelType: 'storage',
    description: 'Tủ kệ bếp có ngăn kéo và cánh tủ'
  },
  {
    id: 'kitchen-sink',
    name: 'Bồn Rửa Bát Tủ Gỗ',
    category: 'kitchen',
    modelPath: '/furniture/decor-kitchensink.glb',
    dimensions: { width: 1.0, height: 0.85, depth: 0.6 },
    defaultColor: '#e2e8f0',
    icon: 'Box',
    modelType: 'storage',
    description: 'Bồn rửa chén inox có hộc tủ phía dưới'
  },
  {
    id: 'fridge-double',
    name: 'Tủ Lạnh 2 Cánh Hiện Đại',
    category: 'kitchen',
    modelPath: '/furniture/decor-fridge.glb',
    dimensions: { width: 0.8, height: 1.8, depth: 0.75 },
    defaultColor: '#cbd5e1',
    icon: 'Box',
    modelType: 'appliance',
    description: 'Tủ lạnh dung tích lớn mặt thép xước'
  },
  {
    id: 'gas-stove',
    name: 'Bếp Kèm Lò Nướng',
    category: 'kitchen',
    modelPath: '/furniture/decor-stove.glb',
    dimensions: { width: 0.75, height: 0.85, depth: 0.65 },
    defaultColor: '#334155',
    icon: 'Flame',
    modelType: 'appliance',
    description: 'Cụm bếp nấu và lò nướng tiện dụng'
  },
  {
    id: 'bar-counter',
    name: 'Quầy Bar Đảo Bếp',
    category: 'kitchen',
    modelPath: '/furniture/decor-barcounter.glb',
    dimensions: { width: 1.5, height: 1.05, depth: 0.5 },
    defaultColor: '#78350f',
    icon: 'Layers',
    modelType: 'table',
    isSurfaceHost: true,
    description: 'Quầy bar ngăn cách phòng khách và bếp'
  },
  {
    id: 'bar-stool',
    name: 'Ghế Quầy Bar Cao',
    category: 'kitchen',
    modelPath: '/furniture/decor-barstool.glb',
    dimensions: { width: 0.45, height: 0.95, depth: 0.45 },
    defaultColor: '#d97706',
    icon: 'Armchair',
    modelType: 'seating',
    description: 'Ghế chân cao cho bàn đảo quầy bar'
  },

  // --- GÓC LÀM VIỆC ---
  {
    id: 'office-desk',
    name: 'Bàn Làm Việc Studio',
    category: 'office',
    modelPath: '/furniture/decor-desk.glb',
    dimensions: { width: 1.4, height: 0.75, depth: 0.7 },
    defaultColor: '#475569',
    icon: 'Laptop',
    modelType: 'table',
    isSurfaceHost: true,
    description: 'Bàn làm việc phong cách tối giản hiện đại'
  },
  {
    id: 'computer-desktop',
    name: 'Máy Tính Bàn PC Trọn Bộ',
    category: 'office',
    modelPath: '/furniture/decor-computer.glb',
    dimensions: { width: 0.6, height: 0.45, depth: 0.3 },
    defaultColor: '#0f172a',
    icon: 'Monitor',
    modelType: 'decor',
    canPlaceOnSurface: true,
    description: 'Bộ máy tính bàn màn hình và case làm việc'
  },
  {
    id: 'laptop-work',
    name: 'Laptop Mỏng Nhẹ',
    category: 'office',
    modelPath: '/furniture/decor-laptop.glb',
    dimensions: { width: 0.35, height: 0.22, depth: 0.25 },
    defaultColor: '#64748b',
    icon: 'Laptop',
    modelType: 'decor',
    canPlaceOnSurface: true,
    description: 'Máy tính xách tay để trên bàn'
  },
  {
    id: 'desk-chair',
    name: 'Ghế Làm Việc Đệm Êm',
    category: 'office',
    modelPath: '/furniture/seating-6.glb',
    dimensions: { width: 0.55, height: 0.85, depth: 0.55 },
    defaultColor: '#1e293b',
    icon: 'Armchair',
    modelType: 'seating',
    description: 'Ghế xoay ngồi học và làm việc thoải mái'
  },

  // --- PHÒNG TẮM & GIẶT ---
  {
    id: 'bath-toilet',
    name: 'Bồn Cầu Sứ Trắng Khối Liền',
    category: 'bathroom',
    modelPath: '/furniture/decor-toilet.glb',
    dimensions: { width: 0.5, height: 0.75, depth: 0.7 },
    defaultColor: '#f8fafc',
    icon: 'Box',
    modelType: 'bathroom',
    description: 'Bồn cầu sứ tráng men cao cấp'
  },
  {
    id: 'bath-tub',
    name: 'Bồn Tắm Nằm Thư Giãn',
    category: 'bathroom',
    modelPath: '/furniture/decor-bathtub.glb',
    dimensions: { width: 0.85, height: 0.6, depth: 1.7 },
    defaultColor: '#ffffff',
    icon: 'Layers',
    modelType: 'bathroom',
    description: 'Bồn tắm nằm phong cách spa sang trọng'
  },
  {
    id: 'bath-shower',
    name: 'Buồng Vòi Sen Đứng',
    category: 'bathroom',
    modelPath: '/furniture/decor-shower.glb',
    dimensions: { width: 0.9, height: 2.1, depth: 0.9 },
    defaultColor: '#e2e8f0',
    icon: 'Layers',
    modelType: 'bathroom',
    description: 'Buồng tắm kính đứng chống văng nước'
  },
  {
    id: 'washing-machine',
    name: 'Máy Giặt Cửa Ngang',
    category: 'bathroom',
    modelPath: '/furniture/decor-washer.glb',
    dimensions: { width: 0.6, height: 0.85, depth: 0.6 },
    defaultColor: '#e2e8f0',
    icon: 'Box',
    modelType: 'appliance',
    description: 'Máy giặt cửa trước thông minh'
  },

  // --- ĐÈN & TRANG TRÍ ---
  {
    id: 'floor-lamp-nordic',
    name: 'Đèn Cây Đứng Đèn Vàng',
    category: 'decor',
    modelPath: '/furniture/lighting.glb',
    dimensions: { width: 0.45, height: 1.6, depth: 0.45 },
    defaultColor: '#eab308',
    icon: 'Sun',
    modelType: 'lamp',
    description: 'Đèn cây góc sofa phát sáng ấm áp ban đêm'
  },
  {
    id: 'table-lamp-night',
    name: 'Đèn Bàn Chụp Tròn',
    category: 'decor',
    modelPath: '/furniture/lighting-3.glb',
    dimensions: { width: 0.3, height: 0.5, depth: 0.3 },
    defaultColor: '#f59e0b',
    icon: 'Sun',
    modelType: 'lamp',
    canPlaceOnSurface: true,
    description: 'Đèn ngủ để bàn phòng ngủ'
  },
  {
    id: 'ceiling-lamp',
    name: 'Đèn Ốp Trần Trang Trí',
    category: 'decor',
    modelPath: '/furniture/lighting-5.glb',
    dimensions: { width: 0.45, height: 0.15, depth: 0.45 },
    defaultColor: '#fef08a',
    icon: 'Sun',
    modelType: 'lamp',
    description: 'Đèn trần tỏa ánh sáng dịu nhẹ khắp phòng'
  },
  {
    id: 'plant-monstera',
    name: 'Chậu Cây Trầu Bà Chậu Sứ',
    category: 'decor',
    modelPath: '/furniture/decor-plant.glb',
    dimensions: { width: 0.6, height: 1.1, depth: 0.6 },
    defaultColor: '#16a34a',
    icon: 'Trees',
    modelType: 'plant',
    description: 'Chậu cây cảnh xanh mát góc phòng'
  },
  {
    id: 'plant-succulent',
    name: 'Chậu Cây Nhỏ Để Bàn',
    category: 'decor',
    modelPath: '/furniture/decor-plant-2.glb',
    dimensions: { width: 0.35, height: 0.45, depth: 0.35 },
    defaultColor: '#15803d',
    icon: 'Trees',
    modelType: 'plant',
    canPlaceOnSurface: true,
    description: 'Cây cảnh mini để trên bàn trà hoặc kệ'
  },
  {
    id: 'decor-rug-round',
    name: 'Thảm Trải Sàn Nỉ Tròn',
    category: 'decor',
    modelPath: '/furniture/decor-rug.glb',
    dimensions: { width: 1.8, height: 0.02, depth: 1.8 },
    defaultColor: '#d97706',
    icon: 'Circle',
    modelType: 'rug',
    description: 'Thảm trải sàn sofa hoa văn nhã nhặn'
  },
  {
    id: 'decor-ceiling-fan',
    name: 'Quạt Trần Gỗ 4 Cánh',
    category: 'decor',
    modelPath: '/furniture/decor-ceilingfan.glb',
    dimensions: { width: 1.2, height: 0.45, depth: 1.2 },
    defaultColor: '#78350f',
    icon: 'Wind',
    modelType: 'decor',
    description: 'Quạt trần cổ điển làm mát phòng khách'
  },

  // --- MÔ HÌNH TỰ SINH TỪ CODE (HỖ TRỢ ĐỔI MÀU 100%) ---
  {
    id: 'proc-sofa',
    name: 'Sofa Khối (Đổi Màu)',
    category: 'procedural',
    modelPath: null,
    dimensions: { width: 2.1, height: 0.85, depth: 0.9 },
    defaultColor: '#3b82f6',
    icon: 'Armchair',
    modelType: 'sofa',
    description: 'Mô hình sofa dựng từ code, tự do đổi màu tùy biến'
  },
  {
    id: 'proc-chair',
    name: 'Ghế Tựa Lưng (Đổi Màu)',
    category: 'procedural',
    modelPath: null,
    dimensions: { width: 0.5, height: 0.85, depth: 0.5 },
    defaultColor: '#ef4444',
    icon: 'Armchair',
    modelType: 'chair',
    description: 'Ghế ăn / ghế tựa dựng từ code, tự do đổi màu tùy biến'
  },
  {
    id: 'proc-table',
    name: 'Bàn Trà Gỗ (Đổi Màu)',
    category: 'procedural',
    modelPath: null,
    dimensions: { width: 1.2, height: 0.45, depth: 0.6 },
    defaultColor: '#78350f',
    icon: 'Table',
    modelType: 'table',
    isSurfaceHost: true,
    description: 'Bàn trà mặt gỗ 4 chân dựng từ code, tự do đổi màu tùy biến'
  },
  {
    id: 'proc-bed',
    name: 'Giường Ngủ Nệm (Đổi Màu)',
    category: 'procedural',
    modelPath: null,
    dimensions: { width: 1.8, height: 0.95, depth: 2.1 },
    defaultColor: '#8b5cf6',
    icon: 'Bed',
    modelType: 'bed',
    description: 'Giường ngủ vách bọc nỉ dựng từ code, tự do đổi màu tùy biến'
  },
  {
    id: 'proc-cabinet',
    name: 'Tủ Quần Áo Đứng (Đổi Màu)',
    category: 'procedural',
    modelPath: null,
    dimensions: { width: 1.4, height: 2.0, depth: 0.6 },
    defaultColor: '#10b981',
    icon: 'Archive',
    modelType: 'cabinet',
    description: 'Tủ quần áo đứng dựng từ code, tự do đổi màu tùy biến'
  },
  {
    id: 'proc-lamp',
    name: 'Đèn Cây Đứng (Đổi Màu & Công Tắc)',
    category: 'procedural',
    modelPath: null,
    dimensions: { width: 0.45, height: 1.6, depth: 0.45 },
    defaultColor: '#f59e0b',
    icon: 'Sun',
    modelType: 'lamp',
    description: 'Đèn cây đứng chao nón dựng từ code, có công tắc bật tắt và đổi màu'
  },
  {
    id: 'proc-plant',
    name: 'Chậu Cây Xanh (Đổi Màu)',
    category: 'procedural',
    modelPath: null,
    dimensions: { width: 0.6, height: 1.1, depth: 0.6 },
    defaultColor: '#15803d',
    icon: 'Trees',
    modelType: 'plant',
    description: 'Chậu cây cảnh lá tròn dựng từ code, tự do đổi màu tùy biến'
  },

  // --- CỬA & CỬA SỔ (DOORS & WINDOWS - GẮN MẶT TƯỜNG) ---
  {
    id: 'door-wood-standard',
    name: 'Cửa Đi Gỗ Mở Đơn',
    category: 'doors-windows',
    modelPath: '/furniture/doorway.glb',
    dimensions: { width: 1.1, height: 2.15, depth: 0.16 },
    defaultColor: '#78350f',
    icon: 'DoorOpen',
    modelType: 'door',
    mountType: 'wall',
    defaultElevation: 0,
    description: 'Cửa đi một cánh khung gỗ cao cấp bám sát mặt tường'
  },
  {
    id: 'door-glass-modern',
    name: 'Cửa Đi Kính Khung Nhôm',
    category: 'doors-windows',
    modelPath: '/furniture/doorwayFront.glb',
    dimensions: { width: 1.1, height: 2.15, depth: 0.16 },
    defaultColor: '#0f172a',
    icon: 'DoorOpen',
    modelType: 'door',
    mountType: 'wall',
    defaultElevation: 0,
    description: 'Cửa ra vào kính hiện đại khung nhôm xingfa'
  },
  {
    id: 'doorway-arch-open',
    name: 'Cổng Vòm Thông Phòng',
    category: 'doors-windows',
    modelPath: '/furniture/doorwayOpen.glb',
    dimensions: { width: 1.1, height: 2.15, depth: 0.16 },
    defaultColor: '#475569',
    icon: 'DoorOpen',
    modelType: 'door',
    mountType: 'wall',
    defaultElevation: 0,
    description: 'Cổng vòm không cánh phân chia không gian mở'
  },
  {
    id: 'window-sliding-glass',
    name: 'Cửa Sổ Kính Lùa 2 Cánh',
    category: 'doors-windows',
    modelPath: '/furniture/wallWindowSlide.glb',
    dimensions: { width: 1.1, height: 1.25, depth: 0.16 },
    defaultColor: '#38bdf8',
    icon: 'Square',
    modelType: 'window',
    mountType: 'wall',
    defaultElevation: 0.9,
    description: 'Cửa sổ lùa kính lấy sáng chuẩn cao độ bậu cửa 0.9m'
  },
  {
    id: 'window-panoramic-view',
    name: 'Cửa Sổ Kính Khung Lớn',
    category: 'doors-windows',
    modelPath: '/furniture/wallWindow.glb',
    dimensions: { width: 1.1, height: 1.25, depth: 0.16 },
    defaultColor: '#0284c7',
    icon: 'Square',
    modelType: 'window',
    mountType: 'wall',
    defaultElevation: 0.9,
    description: 'Cửa sổ kính cố định tầm nhìn rộng'
  },

  // --- TRANG TRÍ GẮN TƯỜNG (WALL DECOR) ---
  {
    id: 'wall-mirror-framed',
    name: 'Gương Treo Tường Khung Viền',
    category: 'wall-decor',
    modelPath: '/furniture/decor-mirror.glb',
    dimensions: { width: 0.65, height: 0.9, depth: 0.08 },
    defaultColor: '#94a3b8',
    icon: 'Maximize2',
    modelType: 'decor',
    mountType: 'wall',
    defaultElevation: 1.4,
    description: 'Gương soi gắn tường phản chiếu không gian phòng'
  },
  {
    id: 'wall-lamp-sconce',
    name: 'Đèn Vách Tường Hiện Đại',
    category: 'wall-decor',
    modelPath: '/furniture/lampWall.glb',
    dimensions: { width: 0.28, height: 0.38, depth: 0.25 },
    defaultColor: '#f59e0b',
    icon: 'Sun',
    modelType: 'lamp',
    mountType: 'wall',
    defaultElevation: 1.8,
    isLightOn: true,
    description: 'Đèn vách gắn tường tỏa ánh sáng ấm cúng'
  },
  {
    id: 'wall-art-canvas',
    name: 'Tranh Nghệ Thuật Khung Gỗ (Đổi Màu)',
    category: 'wall-decor',
    modelPath: null,
    dimensions: { width: 1.2, height: 0.8, depth: 0.05 },
    defaultColor: '#3b82f6',
    icon: 'Image',
    modelType: 'wall-art',
    mountType: 'wall',
    defaultElevation: 1.5,
    description: 'Tranh treo tường nghệ thuật phong cách Scandinavian, tự do đổi màu canvas'
  },
  {
    id: 'wall-clock-modern',
    name: 'Đồng Hồ Treo Tường Kim Loại',
    category: 'wall-decor',
    modelPath: null,
    dimensions: { width: 0.45, height: 0.45, depth: 0.05 },
    defaultColor: '#0f172a',
    icon: 'Clock',
    modelType: 'wall-clock',
    mountType: 'wall',
    defaultElevation: 1.8,
    description: 'Đồng hồ treo tường phong cách tối giản thanh lịch'
  },
  {
    id: 'wall-shelf-floating',
    name: 'Kệ Gỗ Treo Tường Tối Giản',
    category: 'wall-decor',
    modelPath: null,
    dimensions: { width: 0.9, height: 0.16, depth: 0.22 },
    defaultColor: '#78350f',
    icon: 'Layers',
    modelType: 'wall-shelf',
    mountType: 'wall',
    defaultElevation: 1.3,
    isSurfaceHost: true,
    description: 'Kệ gỗ gắn tường vững chãi, cho phép đặt thêm đồ decor lên trên'
  },
];
