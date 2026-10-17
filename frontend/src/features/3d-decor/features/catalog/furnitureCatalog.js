/**
 * Facade Danh mục Mô hình Nội thất Homely Studio
 * Tích hợp toàn bộ kho mô hình Stylized (Kenney) và Realistic PBR qua catalogRegistry.
 * Đảm bảo tương thích ngược 100% với các component và dữ liệu cũ.
 */

import {
  FULL_CATALOG,
  FURNITURE_CATEGORIES,
  MODEL_STYLES,
  MODEL_TIERS,
  getCatalogItemById,
  getFilteredCatalog,
  canUserAccessItem,
  getCatalogStats,
} from './catalogRegistry.js';

export const FURNITURE_CATALOG = FULL_CATALOG;
export {
  FURNITURE_CATEGORIES,
  MODEL_STYLES,
  MODEL_TIERS,
  getCatalogItemById,
  getFilteredCatalog,
  canUserAccessItem,
  getCatalogStats,
};
