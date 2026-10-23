/**
 * Helper tự động suy luận thông minh và chuẩn hóa metadata mô hình 3D từ tên file và kích thước
 */

/**
 * Chuẩn hóa tên file thành mã định danh code (kebab-case)
 * Ví dụ: 'FN_Sofa_3Seat.glb' -> 'sofa-3seat'
 *        'tableCoffeeGlassSquare.glb' -> 'table-coffee-glass-square'
 */
export function normalizeModelCode(fileName) {
  if (!fileName) return `model-${Date.now()}`;
  let baseName = fileName.replace(/\.[^/.]+$/, ''); // Bỏ đuôi .glb, .gltf
  baseName = baseName.replace(/^(FN_|MD_|Model_|Asset_)/i, ''); // Bỏ tiền tố thông dụng
  
  // Chuyển camelCase thành kebab-case
  baseName = baseName.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
  // Chuyển dấu gạch dưới hoặc khoảng trắng thành dấu gạch ngang
  baseName = baseName.replace(/[_\s]+/g, '-');
  return baseName.toLowerCase().trim();
}

/**
 * Gợi ý tên hiển thị tiếng Việt thân thiện từ tên file
 */
export function inferVietnameseName(fileName) {
  const code = normalizeModelCode(fileName);
  const parts = code.split('-');

  const dictionary = {
    sofa: 'Sofa',
    chair: 'Ghế',
    armchair: 'Ghế Bành',
    stool: 'Ghế Đôn',
    bench: 'Ghế Dài',
    table: 'Bàn',
    desk: 'Bàn Làm Việc',
    coffee: 'Bàn Trà',
    dining: 'Bàn Ăn',
    bed: 'Giường Ngủ',
    cabinet: 'Tủ',
    wardrobe: 'Tủ Quần Áo',
    bookcase: 'Kệ Sách',
    shelf: 'Kệ',
    storage: 'Tủ Kệ',
    lamp: 'Đèn',
    light: 'Đèn',
    lighting: 'Đèn Chiếu Sáng',
    plant: 'Cây Cảnh',
    potted: 'Chậu Cây',
    rug: 'Thảm Trải Sàn',
    tv: 'Kệ Tivi',
    television: 'Tivi',
    kitchen: 'Tủ Bếp',
    fridge: 'Tủ Lạnh',
    sink: 'Bồn Rửa',
    bath: 'Bồn Tắm',
    toilet: 'Bồn Cầu',
    mirror: 'Gương',
    picture: 'Tranh Treo Tường',
    frame: 'Khung Tranh',
    clock: 'Đồng Hồ',
    washer: 'Máy Giặt',
    dryer: 'Máy Sấy',
    pillow: 'Gối Nệm',
    laptop: 'Laptop',
    speaker: 'Loa',
    radio: 'Đài Radio',
    stairs: 'Cầu Thang',
    wall: 'Tường',
    round: 'Tròn',
    square: 'Vuông',
    corner: 'Góc',
    double: 'Đôi',
    single: 'Đơn',
    large: 'Lớn',
    modern: 'Hiện Đại',
    classic: 'Cổ Điển',
    luxury: 'Cao Cấp',
    wood: 'Gỗ',
    glass: 'Kính',
    metal: 'Kim Loại',
    leather: 'Da',
    cloth: 'Vải',
    cushion: 'Nệm',
  };

  const viWords = parts.map((part) => dictionary[part] || part);
  let name = viWords.join(' ');
  // Viết hoa chữ cái đầu
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Tự động suy luận thông minh phân loại phòng và công thái học
 */
export function inferModelMetadata(fileName, dimensions = { width: 1, height: 1, depth: 1 }) {
  const code = normalizeModelCode(fileName);
  const name = inferVietnameseName(fileName);

  let category = 'living-room';
  let modelType = 'decor';
  let mountType = 'floor';
  let isSurfaceHost = false;
  let canPlaceOnSurface = false;
  let defaultElevation = 0;

  // 1. Phân loại modelType & category
  if (code.includes('sofa') || code.includes('lounge')) {
    modelType = 'seating';
    category = 'living-room';
  } else if (code.includes('chair') || code.includes('stool') || code.includes('bench')) {
    modelType = 'seating';
    category = code.includes('desk') ? 'office' : (code.includes('dining') ? 'kitchen' : 'living-room');
  } else if (code.includes('bed')) {
    modelType = 'bed';
    category = 'bedroom';
  } else if (code.includes('table') || code.includes('desk')) {
    modelType = 'table';
    isSurfaceHost = true;
    category = code.includes('desk') ? 'office' : (code.includes('dining') ? 'kitchen' : 'living-room');
  } else if (code.includes('cabinet') || code.includes('storage') || code.includes('wardrobe') || code.includes('bookcase')) {
    modelType = 'storage';
    category = code.includes('wardrobe') ? 'bedroom' : (code.includes('kitchen') ? 'kitchen' : 'living-room');
    if (code.includes('tv') || code.includes('side-table')) isSurfaceHost = true;
  } else if (code.includes('lamp') || code.includes('light')) {
    modelType = 'lamp';
    if (code.includes('wall') || code.includes('sconce')) {
      mountType = 'wall';
      defaultElevation = 1.6;
    } else if (dimensions.height < 0.6) {
      canPlaceOnSurface = true;
    }
  } else if (code.includes('plant') || code.includes('flower')) {
    modelType = 'plant';
    category = 'decor';
    if (dimensions.height < 0.6) canPlaceOnSurface = true;
  } else if (code.includes('rug') || code.includes('carpet') || code.includes('mat')) {
    modelType = 'rug';
    category = 'living-room';
  } else if (code.includes('picture') || code.includes('frame') || code.includes('mirror') || code.includes('clock') || code.includes('poster')) {
    modelType = 'wall-decor';
    category = 'wall-decor';
    mountType = 'wall';
    defaultElevation = 1.4;
  } else if (code.includes('kitchen') || code.includes('fridge') || code.includes('cooker') || code.includes('hood') || code.includes('toaster')) {
    modelType = code.includes('fridge') ? 'storage' : 'decor';
    category = 'kitchen';
    if (code.includes('toaster')) canPlaceOnSurface = true;
  } else if (code.includes('bath') || code.includes('shower') || code.includes('toilet') || code.includes('washer')) {
    modelType = 'decor';
    category = 'bathroom';
  } else if (code.includes('laptop') || code.includes('radio') || code.includes('speaker') || code.includes('pillow')) {
    modelType = 'decor';
    canPlaceOnSurface = true;
  } else if (code.includes('stairs') || code.includes('wall') || code.includes('door') || code.includes('window') || code.includes('floor')) {
    modelType = 'architecture';
    category = 'architecture';
  }

  // 2. Ràng buộc mountType dựa vào kích thước mỏng áp tường
  if (dimensions.depth < 0.15 && dimensions.width > 0.4 && dimensions.height > 0.4) {
    if (mountType !== 'wall') {
      mountType = 'wall';
      defaultElevation = 1.4;
    }
  }

  return {
    code,
    name,
    category,
    modelType,
    mountType,
    defaultElevation,
    isSurfaceHost,
    canPlaceOnSurface,
    style: code.includes('real') ? 'realistic' : 'stylized',
    tier: code.includes('real') || code.includes('luxury') ? 'premium' : 'free',
    requiredPlan: code.includes('corner') || code.includes('luxury') ? 'STUDIO' : (code.includes('real') ? 'PLUS' : 'FREE'),
    price: 0,
    tags: [category, modelType, code.split('-')[0]],
  };
}
