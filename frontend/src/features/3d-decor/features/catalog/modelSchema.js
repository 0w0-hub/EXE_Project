/**
 * Chuẩn hóa Schema và Hằng số cho Danh mục Mô hình 3D (Model Data Contract)
 */

export const MODEL_STYLES = [
  { id: 'all', name: 'Tất cả phong cách', icon: 'Sparkles' },
  { id: 'stylized', name: 'Hoạt họa (Stylized)', icon: 'Palette', description: 'Phong cách tối giản, nhẹ, tươi sáng' },
  { id: 'realistic', name: '✨ Chân thực (Realistic)', icon: 'Crown', description: 'Vật liệu PBR cao cấp, vân thực tế' },
];

export const MODEL_TIERS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'free', name: 'Miễn phí' },
  { id: 'premium', name: 'Cao cấp (PRO)' },
];

export const USER_PLANS = {
  FREE: { level: 0, label: 'Gói Cơ Bản (Free)' },
  PLUS: { level: 1, label: 'Gói Plus (Cá Nhân)' },
  STUDIO: { level: 2, label: 'Gói Studio (Chuyên Nghiệp)' },
};

export const FURNITURE_CATEGORIES = [
  { id: 'all', name: 'Tất cả' },
  { id: 'doors-windows', name: 'Cửa & Cửa Sổ', hidden: true },
  { id: 'architecture', name: 'Kiến Trúc & Cầu Thang', hidden: true },
  { id: 'wall-decor', name: 'Trang Trí Gắn Tường' },
  { id: 'living-room', name: 'Phòng Khách' },
  { id: 'bedroom', name: 'Phòng Ngủ' },
  { id: 'kitchen', name: 'Bếp & Bàn Ăn' },
  { id: 'office', name: 'Góc Làm Việc' },
  { id: 'bathroom', name: 'Phòng Tắm & Giặt' },
  { id: 'decor', name: 'Đèn & Trang Trí' },
  { id: 'procedural', name: 'Đồ Code (Đổi Màu)', hidden: true },
];

/**
 * Kiểm tra xem người dùng có quyền sử dụng mô hình hay không
 * @param {Object} item - Thông tin món đồ từ catalog
 * @param {string} userRole - 'user' | 'admin' | 'designer'
 * @param {string} userPlan - 'FREE' | 'PLUS' | 'STUDIO'
 * @returns {boolean}
 */
export function canUserAccessItem(item, userRole = 'user', userPlan = 'FREE') {
  if (!item) return false;
  // Admin hoặc Designer luôn có toàn quyền
  const normalizedRole = (userRole || '').toLowerCase();
  if (normalizedRole === 'admin' || normalizedRole === 'designer') {
    return true;
  }

  // Nếu món đồ miễn phí -> mọi người đều dùng được
  if (item.tier === 'free' || !item.tier) {
    return true;
  }

  // Nếu là đồ Premium PRO:
  const requiredPlan = item.requiredPlan || 'PLUS';
  const userPlanLevel = USER_PLANS[userPlan]?.level ?? 0;
  const requiredPlanLevel = USER_PLANS[requiredPlan]?.level ?? 1;

  return userPlanLevel >= requiredPlanLevel;
}

/**
 * Validate một đối tượng mô hình theo đúng quy chuẩn Schema
 * @param {Object} item 
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCatalogItem(item) {
  const errors = [];
  if (!item.id || typeof item.id !== 'string') errors.push('Thiếu id hoặc id không hợp lệ');
  if (!item.name || typeof item.name !== 'string') errors.push('Thiếu tên món đồ');
  if (!item.modelPath && item.category !== 'procedural' && item.category !== 'wall-decor') {
    errors.push('Thiếu modelPath');
  }
  if (!item.dimensions || typeof item.dimensions !== 'object') {
    errors.push('Thiếu thông số dimensions');
  } else {
    if (typeof item.dimensions.width !== 'number' || item.dimensions.width <= 0) errors.push('dimensions.width phải > 0');
    if (typeof item.dimensions.height !== 'number' || item.dimensions.height <= 0) errors.push('dimensions.height phải > 0');
    if (typeof item.dimensions.depth !== 'number' || item.dimensions.depth <= 0) errors.push('dimensions.depth phải > 0');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
