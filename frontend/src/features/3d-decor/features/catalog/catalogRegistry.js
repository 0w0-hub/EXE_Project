/**
 * Registry Quản lý Tập trung Toàn bộ Danh mục Mô hình 3D Homely Studio
 * Tích hợp đa phong cách (Stylized & Realistic), hỗ trợ phân quyền và tìm kiếm đa chiều.
 */

import { STYLIZED_CATALOG } from './collections/stylizedCatalog.js';
import { REALISTIC_CATALOG } from './collections/realisticCatalog.js';
import {
  MODEL_STYLES,
  MODEL_TIERS,
  FURNITURE_CATEGORIES,
  canUserAccessItem,
  validateCatalogItem,
} from './modelSchema.js';

export {
  MODEL_STYLES,
  MODEL_TIERS,
  FURNITURE_CATEGORIES,
  canUserAccessItem,
  validateCatalogItem,
};

/**
 * Toàn bộ danh mục 130+ mô hình chuẩn hóa
 */
export const FULL_CATALOG = [...STYLIZED_CATALOG, ...REALISTIC_CATALOG];

/**
 * Map tra cứu nhanh mô hình theo ID (O(1))
 */
const CATALOG_MAP = new Map(FULL_CATALOG.map((item) => [item.id, item]));

/**
 * Lấy chi tiết mô hình theo ID
 * @param {string} id 
 * @returns {Object|null}
 */
export function getCatalogItemById(id) {
  if (!id) return null;
  return CATALOG_MAP.get(id) || null;
}

/**
 * Bộ lọc danh mục đa tiêu chí thời gian thực
 * @param {Object} filters
 * @param {'all' | 'stylized' | 'realistic'} [filters.style='all'] - Lọc theo phong cách
 * @param {string} [filters.category='all'] - Lọc theo phòng (living-room, bedroom...)
 * @param {'all' | 'free' | 'premium'} [filters.tier='all'] - Lọc theo phân hạng bản quyền
 * @param {string} [filters.searchQuery=''] - Từ khóa tìm kiếm
 * @returns {Array<Object>}
 */
export function getFilteredCatalog({
  style = 'all',
  category = 'all',
  tier = 'all',
  searchQuery = '',
} = {}) {
  const query = (searchQuery || '').trim().toLowerCase();

  return FULL_CATALOG.filter((item) => {
    // 1. Loại bỏ các danh mục đặc biệt (cửa, cầu thang, đồ code) khỏi danh sách kéo thả thông thường
    if (
      item.category === 'doors-windows' ||
      item.category === 'procedural' ||
      item.category === 'architecture'
    ) {
      return false;
    }

    // 2. Lọc theo Style (Stylized vs Realistic)
    if (style !== 'all' && item.style !== style) {
      return false;
    }

    // 3. Lọc theo Category
    if (category !== 'all' && item.category !== category) {
      return false;
    }

    // 4. Lọc theo Tier (Free vs Premium PRO)
    if (tier !== 'all' && item.tier !== tier) {
      return false;
    }

    // 5. Lọc theo từ khóa tìm kiếm (Name, Description, Tags)
    if (query) {
      const matchName = item.name.toLowerCase().includes(query);
      const matchDesc = item.description?.toLowerCase().includes(query);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(query));
      if (!matchName && !matchDesc && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Thống kê tổng quan kho mô hình
 */
export function getCatalogStats() {
  const total = FULL_CATALOG.length;
  const stylizedCount = STYLIZED_CATALOG.length;
  const realisticCount = REALISTIC_CATALOG.length;
  const freeCount = FULL_CATALOG.filter((i) => i.tier === 'free').length;
  const premiumCount = FULL_CATALOG.filter((i) => i.tier === 'premium').length;

  return {
    total,
    stylizedCount,
    realisticCount,
    freeCount,
    premiumCount,
  };
}
