import { resolveFurniturePositions } from '../../lib/furnitureLayout';
import { FURNITURE_CATALOG } from './features/catalog/furnitureCatalog';

// Model mặc định khi không tìm thấy model khớp chính xác trong catalog
const CATEGORY_DEFAULT_MODELS = {
  seating: {
    catalogId: 'sofa-classic',
    modelPath: '/furniture/seating.glb',
    dimensions: { width: 2.1, height: 0.85, depth: 0.9 },
    modelType: 'seating',
  },
  table: {
    catalogId: 'coffee-table-round',
    modelPath: '/furniture/table.glb',
    dimensions: { width: 1.0, height: 0.45, depth: 1.0 },
    modelType: 'table',
  },
  lighting: {
    catalogId: 'floor-lamp-nordic',
    modelPath: '/furniture/lighting.glb',
    dimensions: { width: 0.45, height: 1.6, depth: 0.45 },
    modelType: 'lamp',
  },
  storage: {
    catalogId: 'tv-stand-wood',
    modelPath: '/furniture/storage.glb',
    dimensions: { width: 1.6, height: 0.55, depth: 0.45 },
    modelType: 'storage',
  },
  plant: {
    catalogId: 'plant-monstera',
    modelPath: '/furniture/decor-plant.glb',
    dimensions: { width: 0.6, height: 1.1, depth: 0.6 },
    modelType: 'plant',
  },
  rug: {
    catalogId: 'rug-living',
    modelPath: '/furniture/decor-rug.glb',
    dimensions: { width: 2.4, height: 0.02, depth: 1.6 },
    modelType: 'rug',
  },
  bed: {
    catalogId: 'bed-double',
    modelPath: '/furniture/decor-bed.glb',
    dimensions: { width: 1.8, height: 1.1, depth: 2.1 },
    modelType: 'bed',
  },
  desk: {
    catalogId: 'study-desk',
    modelPath: '/furniture/decor-desk.glb',
    dimensions: { width: 1.3, height: 0.75, depth: 0.65 },
    modelType: 'desk',
  },
  tv: {
    catalogId: 'tv-screen-flat',
    modelPath: '/furniture/decor-tv.glb',
    dimensions: { width: 1.45, height: 0.85, depth: 0.15 },
    modelType: 'decor',
  },
};

/**
 * Ánh xạ dữ liệu room, furniture AI, colors của Homely sang scene data của 3D Decor Studio
 */
export function mapHomelyToDecorStudio(room, furniture = [], colors = []) {
  const width = Number(room?.widthMeters) || 4;
  const length = Number(room?.lengthMeters) || 4;
  const height = 2.8;

  // Lấy màu sắc gợi ý từ AI
  const wallColor = colors?.find((c) => c.role === 'PRIMARY')?.colorHex || '#f1f5f9';
  const floorColor = colors?.find((c) => c.role === 'SECONDARY')?.colorHex || '#e2e8f0';

  // Tính toán vị trí tương đối cho từng món nội thất
  const positionedItems = resolveFurniturePositions(furniture, width, length);

  const items = positionedItems.map((item, idx) => {
    const cat = (item.category || '').toLowerCase();
    
    // Tìm thử trong FURNITURE_CATALOG
    let matchedCatalog = FURNITURE_CATALOG.find(
      (c) => c.modelType === cat || c.category === cat
    );

    const fallback = CATEGORY_DEFAULT_MODELS[cat] || CATEGORY_DEFAULT_MODELS.seating;
    const modelPath = matchedCatalog?.modelPath || fallback.modelPath;
    const dimensions = matchedCatalog?.dimensions || fallback.dimensions;
    const modelType = matchedCatalog?.modelType || fallback.modelType;
    const catalogId = matchedCatalog?.id || fallback.catalogId;

    return {
      instanceId: `homely-item-${idx}-${Date.now().toString(36)}`,
      catalogId,
      name: item.name || `Nội thất ${idx + 1}`,
      modelPath,
      modelType,
      mountType: 'floor',
      dimensions: { ...dimensions },
      position: [Number(item.x.toFixed(3)), 0, Number(item.z.toFixed(3))],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#3b82f6',
    };
  });

  return {
    room: {
      width,
      length,
      height,
      wallColor,
      floorColor,
      floorTexture: 'wood-light',
    },
    items,
  };
}
