/**
 * Cấu hình mặc định và giới hạn cho căn phòng
 * Đơn vị: mét (m)
 */
export const ROOM_LIMITS = {
  MIN_WIDTH: 2.0,
  MAX_WIDTH: 15.0,
  MIN_LENGTH: 2.0,
  MAX_LENGTH: 15.0,
  MIN_HEIGHT: 2.2,
  MAX_HEIGHT: 5.0,
};

export const DEFAULT_ROOM = {
  width: 6.0,          // Trục X (chiều ngang)
  length: 5.0,         // Trục Z (chiều sâu)
  height: 2.8,         // Trục Y (chiều cao)
  floorColor: '#d6c7b2', // Màu sàn gỗ ấm
  floorMaterialId: 'wood-straight', // ID vật liệu sàn
  floorRepeat: 1.0,     // Tỷ lệ lặp hoa văn sàn (1.0 = kích thước chuẩn thực tế)
  floorRoughness: 0.45, // Độ nhám / độ bóng sàn
  wallColor: '#f1f5f9',  // Màu sơn tường trắng khói sáng
  wallMaterialId: 'wall-paint', // ID vật liệu tường
  wallRepeat: 1.0,      // Tỷ lệ lặp hoa văn tường (1.0 = kích thước chuẩn thực tế)
  wallRoughness: 0.65,  // Độ nhám / độ bóng tường
};

export const PRESET_WALL_COLORS = [
  '#f1f5f9', // Slate Light
  '#ffffff', // Pure White
  '#e2e8f0', // Soft Grey
  '#fef3c7', // Warm Cream
  '#e0f2fe', // Sky Mist
  '#dcfce7', // Mint Soft
  '#fae8ff', // Lavender Soft
  '#fed7aa', // Peach Soft
  '#cbd5e1', // Cool Concrete
  '#334155', // Charcoal Deep
];

export const PRESET_FLOOR_COLORS = [
  '#d6c7b2', // Sàn gỗ sồi sáng (Light Oak)
  '#8c6239', // Sàn gỗ óc chó (Walnut)
  '#543d2b', // Sàn gỗ mun trầm (Espresso)
  '#e2e8f0', // Gạch men trắng xám
  '#334155', // Gạch xám đá phiến (Slate Dark)
  '#cbd5e1', // Bê tông mài sáng
  '#f8fafc', // Đá cẩm thạch trắng
  '#e7e5e4', // Gạch bông cổ điển
];

/**
 * Danh mục các loại vật liệu và hoa văn cho Sàn nhà
 * Kèm thông số kích thước thật (mét) để hệ thống scale chuẩn xác
 */
export const FLOOR_MATERIALS = [
  {
    id: 'wood-straight',
    name: 'Gỗ Ván Thẳng',
    category: 'wood',
    categoryLabel: 'Sàn Gỗ',
    description: 'Ván sàn gỗ sồi so le truyền thống, ấm cúng và tự nhiên',
    dimensionLabel: 'Bản ván 15cm × 120cm',
    unitSizeLabel: '15×120 cm',
    baseUnitW: 15,
    baseUnitL: 120,
    unitType: 'plank',
    physicalWidth: 1.2,  // Khổ lặp ngang 1.2m
    physicalLength: 1.2, // Khổ lặp dọc 1.2m (8 thanh ván 15cm)
    defaultColor: '#d6c7b2',
    defaultRoughness: 0.45,
    defaultRepeat: 1.0,
    bumpScale: 0.02,
    presets: [
      { label: 'Bản 12 cm', scale: 0.8 },
      { label: 'Bản 15 cm (Chuẩn)', scale: 1.0 },
      { label: 'Bản 18 cm', scale: 1.2 },
      { label: 'Bản 20 cm', scale: 1.33 },
    ],
  },
  {
    id: 'wood-herringbone',
    name: 'Gỗ Xương Cá Herringbone',
    category: 'wood',
    categoryLabel: 'Sàn Gỗ',
    description: 'Nan gỗ đan chéo góc 90° kinh điển kiến trúc Châu Âu',
    dimensionLabel: 'Nan 10cm × 50cm (Khổ cụm 40cm)',
    unitSizeLabel: '10×50 cm',
    baseUnitW: 10,
    baseUnitL: 50,
    unitType: 'slat',
    physicalWidth: 1.2,
    physicalLength: 1.2,
    defaultColor: '#c8b293',
    defaultRoughness: 0.40,
    defaultRepeat: 1.0,
    bumpScale: 0.025,
    presets: [
      { label: 'Nan 7.5×40 cm', scale: 0.75 },
      { label: 'Nan 10×50 cm (Chuẩn)', scale: 1.0 },
      { label: 'Nan 12×60 cm', scale: 1.2 },
      { label: 'Nan 15×75 cm', scale: 1.5 },
    ],
  },
  {
    id: 'wood-chevron',
    name: 'Gỗ Xương Cá Chevron',
    category: 'wood',
    categoryLabel: 'Sàn Gỗ',
    description: 'Đầu nan gỗ cắt vát 45° tạo hàng mũi tên chữ V liền mạch',
    dimensionLabel: 'Nan vát 10cm × 50cm (Khổ cụm 40cm)',
    unitSizeLabel: '10×50 cm',
    baseUnitW: 10,
    baseUnitL: 50,
    unitType: 'slat',
    physicalWidth: 1.2,
    physicalLength: 1.2,
    defaultColor: '#bfa07d',
    defaultRoughness: 0.42,
    defaultRepeat: 1.0,
    bumpScale: 0.025,
    presets: [
      { label: 'Nan 7.5×40 cm', scale: 0.75 },
      { label: 'Nan 10×50 cm (Chuẩn)', scale: 1.0 },
      { label: 'Nan 12×60 cm', scale: 1.2 },
      { label: 'Nan 15×75 cm', scale: 1.5 },
    ],
  },
  {
    id: 'tile-ceramic',
    name: 'Gạch Men Vuông 60x60',
    category: 'tile',
    categoryLabel: 'Gạch & Đá',
    description: 'Gạch men viền ron xi măng sắc nét, sạch sẽ và hiện đại',
    dimensionLabel: 'Viên gạch chuẩn 60cm × 60cm',
    unitSizeLabel: '60×60 cm',
    baseUnitW: 60,
    baseUnitL: 60,
    unitType: 'tile',
    physicalWidth: 1.2,  // 2 viên gạch 60cm
    physicalLength: 1.2, // 2 viên gạch 60cm
    defaultColor: '#e2e8f0',
    defaultRoughness: 0.25,
    defaultRepeat: 1.0,
    bumpScale: 0.03,
    presets: [
      { label: '40×40 cm', scale: 0.67 },
      { label: '60×60 cm (Chuẩn)', scale: 1.0 },
      { label: '80×80 cm', scale: 1.33 },
      { label: '100×100 cm', scale: 1.67 },
    ],
  },
  {
    id: 'tile-indochine',
    name: 'Gạch Bông Đông Dương',
    category: 'tile',
    categoryLabel: 'Gạch & Đá',
    description: 'Hoa văn bông hoa 4 cánh cổ điển Đông Dương sang trọng',
    dimensionLabel: 'Viên gạch bông 30cm × 30cm',
    unitSizeLabel: '30×30 cm',
    baseUnitW: 30,
    baseUnitL: 30,
    unitType: 'tile',
    physicalWidth: 0.6,  // 2 viên 30cm = 0.6m
    physicalLength: 0.6, // 2 viên 30cm = 0.6m
    defaultColor: '#f1f5f9',
    defaultRoughness: 0.35,
    defaultRepeat: 1.0,
    bumpScale: 0.02,
    presets: [
      { label: '20×20 cm', scale: 0.67 },
      { label: '30×30 cm (Chuẩn)', scale: 1.0 },
      { label: '40×40 cm', scale: 1.33 },
      { label: '60×60 cm', scale: 2.0 },
    ],
  },
  {
    id: 'stone-marble',
    name: 'Đá Cẩm Thạch Marble',
    category: 'stone',
    categoryLabel: 'Gạch & Đá',
    description: 'Vân mây Calacatta uốn lượn tự nhiên, bề mặt bóng gương',
    dimensionLabel: 'Tấm đá cẩm thạch 1.6m × 1.6m',
    unitSizeLabel: '1.6×1.6 m',
    baseUnitW: 1.6,
    baseUnitL: 1.6,
    unitType: 'slab-m',
    physicalWidth: 1.6,
    physicalLength: 1.6,
    defaultColor: '#f8fafc',
    defaultRoughness: 0.15,
    defaultRepeat: 1.0,
    bumpScale: 0.01,
    presets: [
      { label: 'Tấm 1.2×1.2 m', scale: 0.75 },
      { label: 'Tấm 1.6×1.6 m (Chuẩn)', scale: 1.0 },
      { label: 'Tấm 2.0×2.0 m', scale: 1.25 },
      { label: 'Tấm 2.4×2.4 m', scale: 1.5 },
    ],
  },
  {
    id: 'stone-terrazzo',
    name: 'Đá Mài Terrazzo Đa Sắc',
    category: 'stone',
    categoryLabel: 'Gạch & Đá',
    description: 'Hạt thạch anh và đá mài nhiều màu thời thượng phong cách Retro',
    dimensionLabel: 'Tấm đá mài 1.2m × 1.2m (Hạt 5-20mm)',
    unitSizeLabel: '1.2×1.2 m',
    baseUnitW: 1.2,
    baseUnitL: 1.2,
    unitType: 'slab-m',
    physicalWidth: 1.2,
    physicalLength: 1.2,
    defaultColor: '#f5f5f4',
    defaultRoughness: 0.30,
    defaultRepeat: 1.0,
    bumpScale: 0.015,
    presets: [
      { label: 'Tấm 0.8×0.8 m', scale: 0.67 },
      { label: 'Tấm 1.2×1.2 m (Chuẩn)', scale: 1.0 },
      { label: 'Tấm 1.6×1.6 m', scale: 1.33 },
      { label: 'Tấm 2.0×2.0 m', scale: 1.67 },
    ],
  },
  {
    id: 'concrete-polished',
    name: 'Bê Tông Mài Bóng',
    category: 'concrete',
    categoryLabel: 'Bê Tông',
    description: 'Sàn bê tông mài liền khối phong cách công nghiệp Industrial',
    dimensionLabel: 'Nền bê tông liền mạch 2.4m × 2.4m',
    unitSizeLabel: '2.4×2.4 m',
    baseUnitW: 2.4,
    baseUnitL: 2.4,
    unitType: 'slab-m',
    physicalWidth: 2.4,
    physicalLength: 2.4,
    defaultColor: '#94a3b8',
    defaultRoughness: 0.38,
    defaultRepeat: 1.0,
    bumpScale: 0.01,
    presets: [
      { label: 'Mảng 1.8×1.8 m', scale: 0.75 },
      { label: 'Mảng 2.4×2.4 m (Chuẩn)', scale: 1.0 },
      { label: 'Mảng 3.2×3.2 m', scale: 1.33 },
    ],
  },
];

/**
 * Danh mục các loại vật liệu, hoa văn và giấy dán tường cho Tường nhà
 */
export const WALL_MATERIALS = [
  {
    id: 'wall-paint',
    name: 'Sơn Mịn Mờ Tiêu Chuẩn',
    category: 'paint',
    categoryLabel: 'Sơn & Vữa',
    description: 'Bề mặt sơn mờ phẳng mịn, khuếch tán ánh sáng tự nhiên',
    dimensionLabel: 'Bề mặt sơn phẳng mịn',
    unitSizeLabel: 'Mịn',
    baseUnitW: 1.0,
    baseUnitL: 1.0,
    unitType: 'paint',
    physicalWidth: 1.0,
    physicalLength: 1.0,
    defaultColor: '#f1f5f9',
    defaultRoughness: 0.70,
    defaultRepeat: 1.0,
    bumpScale: 0.005,
    presets: [
      { label: 'Chuẩn (1.0x)', scale: 1.0 },
    ],
  },
  {
    id: 'wall-concrete',
    name: 'Vữa Bê Tông Limewash',
    category: 'paint',
    categoryLabel: 'Sơn & Vữa',
    description: 'Hiệu ứng vữa xoa loang mộc mạc Wabi-sabi cao cấp',
    dimensionLabel: 'Mảng vữa xoa mộc 1.5m',
    unitSizeLabel: '1.5m',
    baseUnitW: 1.5,
    baseUnitL: 1.5,
    unitType: 'concrete-limewash',
    physicalWidth: 1.5,
    physicalLength: 1.5,
    defaultColor: '#cbd5e1',
    defaultRoughness: 0.85,
    defaultRepeat: 1.0,
    bumpScale: 0.02,
    presets: [
      { label: 'Mảng 1.0m', scale: 0.67 },
      { label: 'Mảng 1.5m (Chuẩn)', scale: 1.0 },
      { label: 'Mảng 2.0m', scale: 1.33 },
    ],
  },
  {
    id: 'wallpaper-stripes',
    name: 'Giấy Dán Tường Sọc Dọc',
    category: 'wallpaper',
    categoryLabel: 'Giấy Dán Tường',
    description: 'Sọc thẳng phối màu thanh lịch, tạo cảm giác trần nhà cao thoáng',
    dimensionLabel: 'Bản sọc 10cm (Khổ cuộn 80cm)',
    unitSizeLabel: 'Sọc 10cm',
    baseUnitW: 10,
    baseUnitL: 10,
    unitType: 'stripe',
    physicalWidth: 0.8,
    physicalLength: 0.8,
    defaultColor: '#e0f2fe',
    defaultRoughness: 0.65,
    defaultRepeat: 1.0,
    bumpScale: 0.01,
    presets: [
      { label: 'Sọc 6cm', scale: 0.6 },
      { label: 'Sọc 10cm (Chuẩn)', scale: 1.0 },
      { label: 'Sọc 15cm', scale: 1.5 },
    ],
  },
  {
    id: 'wallpaper-geometric',
    name: 'Giấy Dán Hình Học Bắc Âu',
    category: 'wallpaper',
    categoryLabel: 'Giấy Dán Tường',
    description: 'Mạng lưới tam giác và kim cương phong cách Scandinavian',
    dimensionLabel: 'Họa tiết kim cương 20cm × 20cm',
    unitSizeLabel: '20×20 cm',
    baseUnitW: 20,
    baseUnitL: 20,
    unitType: 'geometric',
    physicalWidth: 0.8,
    physicalLength: 0.8,
    defaultColor: '#fef3c7',
    defaultRoughness: 0.65,
    defaultRepeat: 1.0,
    bumpScale: 0.01,
    presets: [
      { label: 'Khổ 15×15 cm', scale: 0.75 },
      { label: 'Khổ 20×20 cm (Chuẩn)', scale: 1.0 },
      { label: 'Khổ 30×30 cm', scale: 1.5 },
    ],
  },
  {
    id: 'wallpaper-tropical',
    name: 'Giấy Dán Lá Nhiệt Đới',
    category: 'wallpaper',
    categoryLabel: 'Giấy Dán Tường',
    description: 'Họa tiết lá cọ kiểng nhiệt đới và monstera điểm nhấn nghệ thuật',
    dimensionLabel: 'Khóm lá nhiệt đới 50cm',
    unitSizeLabel: '50cm',
    baseUnitW: 50,
    baseUnitL: 50,
    unitType: 'tropical',
    physicalWidth: 1.0,
    physicalLength: 1.0,
    defaultColor: '#ecfdf5',
    defaultRoughness: 0.60,
    defaultRepeat: 1.0,
    bumpScale: 0.015,
    presets: [
      { label: 'Khóm 35cm', scale: 0.7 },
      { label: 'Khóm 50cm (Chuẩn)', scale: 1.0 },
      { label: 'Khóm 70cm', scale: 1.4 },
    ],
  },
  {
    id: 'wall-brick',
    name: 'Tường Gạch Thẻ New York Loft',
    category: 'panel',
    categoryLabel: 'Ốp Kiến Trúc',
    description: 'Gạch thẻ nung thô mộc kèm đường ron rãnh chìm Industrial',
    dimensionLabel: 'Viên gạch thẻ 6.5cm × 20cm',
    unitSizeLabel: '6.5×20 cm',
    baseUnitW: 6.5,
    baseUnitL: 20,
    unitType: 'brick',
    physicalWidth: 0.8,
    physicalLength: 0.8,
    defaultColor: '#b91c1c',
    defaultRoughness: 0.80,
    defaultRepeat: 1.0,
    bumpScale: 0.04,
    presets: [
      { label: 'Thẻ 5×15 cm', scale: 0.75 },
      { label: 'Thẻ 6.5×20 cm (Chuẩn)', scale: 1.0 },
      { label: 'Thẻ 8×25 cm', scale: 1.25 },
    ],
  },
  {
    id: 'wall-wood-slats',
    name: 'Nan Gỗ Sọc Tiêu Âm',
    category: 'panel',
    categoryLabel: 'Ốp Kiến Trúc',
    description: 'Các thanh lam gỗ song song trên nền nỉ đen hiện đại sang trọng',
    dimensionLabel: 'Bản nan 3.5cm (Khoảng cách 1.5cm)',
    unitSizeLabel: 'Nan 3.5cm',
    baseUnitW: 3.5,
    baseUnitL: 3.5,
    unitType: 'wood-slats',
    physicalWidth: 0.8,
    physicalLength: 0.8,
    defaultColor: '#a16207',
    defaultRoughness: 0.45,
    defaultRepeat: 1.0,
    bumpScale: 0.04,
    presets: [
      { label: 'Nan 2.5 cm', scale: 0.7 },
      { label: 'Nan 3.5 cm (Chuẩn)', scale: 1.0 },
      { label: 'Nan 5.0 cm', scale: 1.4 },
    ],
  },
  {
    id: 'wall-subway',
    name: 'Gạch Gốm Subway Bóng',
    category: 'panel',
    categoryLabel: 'Ốp Kiến Trúc',
    description: 'Gạch thẻ trắng gốm sứ vát cạnh, lý tưởng cho mảng tường bếp & tắm',
    dimensionLabel: 'Gạch thẻ Subway 10cm × 20cm',
    unitSizeLabel: '10×20 cm',
    baseUnitW: 10,
    baseUnitL: 20,
    unitType: 'subway',
    physicalWidth: 0.6,
    physicalLength: 0.6,
    defaultColor: '#f8fafc',
    defaultRoughness: 0.20,
    defaultRepeat: 1.0,
    bumpScale: 0.035,
    presets: [
      { label: 'Thẻ 7.5×15 cm', scale: 0.75 },
      { label: 'Thẻ 10×20 cm (Chuẩn)', scale: 1.0 },
      { label: 'Thẻ 12×25 cm', scale: 1.25 },
    ],
  },
];

/**
 * Tính toán chuỗi kích thước thực tế sau khi nhân với tỷ lệ người dùng chọn
 */
export function getMaterialScaledDimensionText(mat, scale = 1.0) {
  if (!mat) return '';
  const s = scale || 1.0;
  if (mat.unitType === 'plank') {
    const w = Math.round(mat.baseUnitW * s);
    const l = Math.round(mat.baseUnitL * s);
    return `Bản ván ${w}cm × ${l}cm`;
  }
  if (mat.unitType === 'slat') {
    const w = (mat.baseUnitW * s).toFixed(1).replace(/\.0$/, '');
    const l = Math.round(mat.baseUnitL * s);
    return `Nan ${w}cm × ${l}cm`;
  }
  if (mat.unitType === 'tile') {
    const w = Math.round(mat.baseUnitW * s);
    const l = Math.round(mat.baseUnitL * s);
    return `Viên gạch ${w}cm × ${l}cm`;
  }
  if (mat.unitType === 'slab-m') {
    const w = (mat.baseUnitW * s).toFixed(1).replace(/\.0$/, '');
    const l = (mat.baseUnitL * s).toFixed(1).replace(/\.0$/, '');
    return `Tấm ${w}m × ${l}m`;
  }
  if (mat.unitType === 'paint') {
    return 'Bề mặt sơn phẳng mịn';
  }
  if (mat.unitType === 'concrete-limewash') {
    const w = (mat.baseUnitW * s).toFixed(1).replace(/\.0$/, '');
    return `Mảng vữa ${w}m`;
  }
  if (mat.unitType === 'stripe') {
    const w = Math.round(mat.baseUnitW * s);
    return `Bản sọc ${w}cm`;
  }
  if (mat.unitType === 'geometric') {
    const w = Math.round(mat.baseUnitW * s);
    const l = Math.round(mat.baseUnitL * s);
    return `Họa tiết ${w}cm × ${l}cm`;
  }
  if (mat.unitType === 'tropical') {
    const w = Math.round(mat.baseUnitW * s);
    return `Khóm lá ${w}cm`;
  }
  if (mat.unitType === 'brick') {
    const w = (mat.baseUnitW * s).toFixed(1).replace(/\.0$/, '');
    const l = Math.round(mat.baseUnitL * s);
    return `Viên thẻ ${w}cm × ${l}cm`;
  }
  if (mat.unitType === 'wood-slats') {
    const w = (mat.baseUnitW * s).toFixed(1).replace(/\.0$/, '');
    return `Nan gỗ ${w}cm`;
  }
  if (mat.unitType === 'subway') {
    const w = Math.round(mat.baseUnitW * s);
    const l = Math.round(mat.baseUnitL * s);
    return `Viên gạch ${w}cm × ${l}cm`;
  }
  return `${(mat.physicalWidth * s).toFixed(2)}m × ${(mat.physicalLength * s).toFixed(2)}m`;
}
