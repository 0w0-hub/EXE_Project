/**
 * topViewSnapshotService.js — Sinh và cache ảnh orthographic top-down snapshot 2D cho vật thể
 *
 * Tính năng:
 * - Kiểm tra đã có snapshot 2D cho vật thể (theo catalogId / modelType và color/texture) chưa
 * - Nếu chưa: Tạo hình chiếu kỹ thuật 2D CAD chuẩn xác (tỉ lệ width x depth) với đường nét kiến trúc tinh tế
 * - Hỗ trợ đổi màu sắc / texture linh hoạt:
 *   + Cache được đánh index theo `key = `${catalogId || modelType}_${color || 'default'}_${textureId || 'none'}``
 *   + Khi đổi màu/texture, tự động sinh snapshot mới cho cấu hình đó và cache lại
 */

import * as THREE from 'three';

// Bộ nhớ cache runtime
const snapshotCache = new Map();

/**
 * Sinh ảnh Canvas 2D kỹ thuật CAD nhìn từ trên xuống cho vật thể
 */
function generateCADTopViewDataUrl(item) {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const w = item.dimensions?.width || 1;
  const d = item.dimensions?.depth || 1;
  const color = item.color || '#3b82f6';
  const type = item.modelType || 'decor';

  // Tính tỉ lệ để vừa vặn canvas với padding 12px
  const pad = 16;
  const maxDim = Math.max(w, d);
  const pxPerMeter = (size - pad * 2) / maxDim;

  const rectW = Math.max(20, w * pxPerMeter);
  const rectH = Math.max(20, d * pxPerMeter);
  const cx = size / 2;
  const cy = size / 2;
  const left = cx - rectW / 2;
  const top = cy - rectH / 2;

  ctx.clearRect(0, 0, size, size);

  // 1. Đổ bóng mờ nhẹ 2D
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // 2. Thân chính vật thể
  ctx.fillStyle = color;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;

  const roundRect = (x, y, rw, rh, r) => {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, rw, rh, r);
    } else {
      ctx.rect(x, y, rw, rh);
    }
    ctx.fill();
    ctx.stroke();
  };

  const id = item.catalogId || '';

  if (type === 'plant') {
    // Chậu cây: hình tròn ở giữa + các tán lá vươn ra
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(rectW, rectH) * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Các tán lá
    ctx.fillStyle = '#16a34a';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const lx = cx + Math.cos(angle) * (rectW * 0.35);
      const ly = cy + Math.sin(angle) * (rectH * 0.35);
      ctx.beginPath();
      ctx.ellipse(lx, ly, rectW * 0.2, rectH * 0.12, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (type === 'lamp') {
    // Đèn cây: chân đế tròn + chao đèn
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(rectW, rectH) * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vòng tròn tâm
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(rectW, rectH) * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (id.includes('laptop') || type === 'laptop') {
    // Laptop / Máy tính để bàn
    const screenH = rectH * 0.38;
    const kbH = rectH * 0.58;

    // Màn hình
    ctx.fillStyle = '#0f172a';
    roundRect(left + 2, top, rectW - 4, screenH, 3);

    // Thân máy & bàn phím
    ctx.fillStyle = '#334155';
    roundRect(left, top + screenH + 2, rectW, kbH, 4);

    // Trackpad
    ctx.fillStyle = '#475569';
    roundRect(cx - rectW * 0.16, top + screenH + kbH * 0.65, rectW * 0.32, kbH * 0.25, 2);
  } else if (id.includes('tv') || type === 'tv') {
    // Tivi / Màn hình phẳng
    const screenThick = Math.max(6, rectH * 0.3);
    const standW = Math.min(rectW * 0.45, 40);

    // Chân đế
    ctx.fillStyle = '#475569';
    roundRect(cx - standW / 2, top + rectH * 0.2, standW, rectH * 0.6, 3);

    // Màn hình phẳng
    ctx.fillStyle = '#0f172a';
    roundRect(left, cy - screenThick / 2, rectW, screenThick, 3);

    // Vệt sáng mặt kính
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left + 6, cy);
    ctx.lineTo(left + rectW - 6, cy);
    ctx.stroke();
  } else if (type === 'rug') {
    // Thảm trải sàn
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    roundRect(left, top, rectW, rectH, 6);
    ctx.globalAlpha = 1.0;

    // Viền nét đứt
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(left + 5, top + 5, rectW - 10, rectH - 10);
    ctx.setLineDash([]);
  } else if (type === 'seating' || type === 'armchair' || type === 'sofa' || type === 'chair') {
    // Sofa / Ghế: Thân nệm + Lưng tựa phía sau (-Z) + Tay vịn 2 bên
    roundRect(left, top, rectW, rectH, 8);

    // Lưng tựa (Backrest)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    roundRect(left + 4, top + 4, rectW - 8, rectH * 0.26, 4);

    // Tay vịn 2 bên (Armrests)
    const armW = Math.max(6, rectW * 0.14);
    roundRect(left + 2, top + 4, armW, rectH - 8, 4);
    roundRect(left + rectW - armW - 2, top + 4, armW, rectH - 8, 4);

    // Vạch đệm ngồi
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left + armW + 6, cy + 2);
    ctx.lineTo(left + rectW - armW - 6, cy + 2);
    ctx.stroke();
  } else if (type === 'bed') {
    // Giường ngủ: Đầu giường (Headboard) + 2 Gối nằm + Nệm ga
    roundRect(left, top, rectW, rectH, 6);

    // Đầu giường
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    roundRect(left + 2, top + 2, rectW - 4, rectH * 0.15, 3);

    // 2 Gối ngủ trắng
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    const pillowW = rectW * 0.38;
    const pillowH = rectH * 0.2;
    roundRect(left + rectW * 0.08, top + rectH * 0.2, pillowW, pillowH, 4);
    roundRect(left + rectW * 0.54, top + rectH * 0.2, pillowW, pillowH, 4);

    // Nếp gấp chăn (Quilt fold)
    ctx.beginPath();
    ctx.moveTo(left + 4, top + rectH * 0.5);
    ctx.lineTo(left + rectW - 4, top + rectH * 0.5);
    ctx.stroke();
  } else if (type === 'table' || type === 'desk') {
    // Bàn: Mặt bàn phẳng + vân hoặc viền mép vát
    roundRect(left, top, rectW, rectH, 6);

    // Viền vát trong (Inner border)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left + 6, top + 6, rectW - 12, rectH - 12);
  } else if (
    type === 'kitchen' ||
    type === 'appliance' ||
    type === 'bathroom' ||
    item.name?.toLowerCase().includes('bếp') ||
    item.name?.toLowerCase().includes('chậu') ||
    item.name?.toLowerCase().includes('bồn')
  ) {
    // Thiết bị bếp / Bồn rửa
    roundRect(left, top, rectW, rectH, 6);

    // Lòng chậu âm
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    roundRect(left + 6, top + 6, rectW - 12, rectH - 12, 4);

    // Vòi nước / họng bếp
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(rectW, rectH) * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (item.mountType === 'wall') {
    // Đồ gắn tường
    roundRect(left, top, rectW, rectH, 3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left + 4, top + 4);
    ctx.lineTo(left + rectW - 4, top + rectH - 4);
    ctx.stroke();
  } else {
    // Tủ kệ / Decor: Hộp chữ nhật bo góc với viền ngăn kéo
    roundRect(left, top, rectW, rectH, 6);

    // Nét chia ngăn
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left + 6, cy);
    ctx.lineTo(left + rectW - 6, cy);
    ctx.stroke();
  }

  // 3. Vạch mũi tên chỉ hướng mặt trước (+Z — cạnh dưới của hình chữ nhật)
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const arrowY = top + rectH - 5;
  ctx.moveTo(cx - 14, arrowY);
  ctx.lineTo(cx + 14, arrowY);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export { generateCADTopViewDataUrl };

/**
 * Lấy snapshot 2D top-view từ cache hoặc sinh mới nếu chưa có
 * @param {Object} item Thông tin món đồ nội thất (catalogId, modelType, dimensions, color, textureId)
 * @returns {THREE.Texture} Texture Three.js đã nạp sẵn sàng áp dụng lên Plane 2D
 */
export function getTopViewTexture(item) {
  const catalogId = item.catalogId || item.modelType || 'unknown';
  const color = item.color || '#3b82f6';
  const textureId = item.textureId || 'default';
  const cacheKey = `${catalogId}_${color}_${textureId}_${item.dimensions?.width}_${item.dimensions?.depth}`;

  if (snapshotCache.has(cacheKey)) {
    return snapshotCache.get(cacheKey);
  }

  // Sinh mới snapshot
  const dataUrl = generateCADTopViewDataUrl(item);

  // Nạp vào Three.js Texture
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(dataUrl);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  // Lưu vào cache
  snapshotCache.set(cacheKey, texture);

  return texture;
}
