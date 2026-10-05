import * as THREE from 'three';
import { FLOOR_MATERIALS, WALL_MATERIALS } from '../../constants/roomDefaults';

// Cache data URL cho texture sàn 2D
const floorDataUrlCache = new Map();

// Cache các bộ bundle Three.js CanvasTexture (map, bumpMap) cho 3D
const materialBundleCache = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// 1. Hàm Tiện Ích Đồ Họa Canvas 2D
// ─────────────────────────────────────────────────────────────────────────────

function createNoiseOverlay(ctx, size, opacity = 0.04, step = 3) {
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      if ((x + y * 7) % 5 === 0) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function getColorLuminance(color) {
  if (!color) return 0.5;
  const r = color.r ?? 0.5;
  const g = color.g ?? 0.5;
  const b = color.b ?? 0.5;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Các Hàm Vẽ Chi Tiết Cho Từng Loại Vật Liệu Sàn (Floor Generators)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sàn gỗ ván thẳng (Straight Wood Planks)
 */
function drawStraightWood(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  const plankRows = 8;
  const rowH = size / plankRows;

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#d0d0d0';
    bumpCtx.fillRect(0, 0, size, size);
  }

  for (let r = 0; r < plankRows; r++) {
    // Sắc độ chênh lệch giữa các hàng ván
    const shade = r % 2 === 0 ? 1.04 : 0.96;
    const pCol = base.clone().multiplyScalar(shade);
    ctx.fillStyle = `#${pCol.getHexString()}`;
    ctx.fillRect(0, r * rowH, size, rowH);

    // Mối nối dọc ngẫu nhiên
    const seams = [size * 0.33 + (r % 3) * 40, size * 0.66 + ((r + 1) % 3) * 35];
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    for (const sx of seams) {
      const realX = sx % size;
      ctx.beginPath();
      ctx.moveTo(realX, r * rowH);
      ctx.lineTo(realX, (r + 1) * rowH);
      ctx.stroke();

      if (bumpCtx) {
        bumpCtx.strokeStyle = '#222222';
        bumpCtx.lineWidth = 2;
        bumpCtx.beginPath();
        bumpCtx.moveTo(realX, r * rowH);
        bumpCtx.lineTo(realX, (r + 1) * rowH);
        bumpCtx.stroke();
      }
    }

    // Đường ron ngang giữa 2 hàng ván
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * rowH);
    ctx.lineTo(size, r * rowH);
    ctx.stroke();

    if (bumpCtx) {
      bumpCtx.strokeStyle = '#111111';
      bumpCtx.lineWidth = 2.5;
      bumpCtx.beginPath();
      bumpCtx.moveTo(0, r * rowH);
      bumpCtx.lineTo(size, r * rowH);
      bumpCtx.stroke();
    }
  }

  // Thêm thớ gỗ nhẹ
  createNoiseOverlay(ctx, size, 0.05, 4);
}

/**
 * Gỗ xương cá Herringbone (90° Interlocking Slats)
 */
function drawHerringbone(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#cccccc';
    bumpCtx.fillRect(0, 0, size, size);
  }

  const cols = 3;
  const colW = size / cols;
  const slatL = colW * 1.25;
  const slatW = colW * 0.3;

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;

  if (bumpCtx) {
    bumpCtx.strokeStyle = '#1a1a1a';
    bumpCtx.lineWidth = 2;
  }

  // Vẽ mạng lưới zigzag xương cá
  for (let c = -1; c <= cols + 1; c++) {
    const isLeft = (c + 10) % 2 === 0;
    const xBase = c * colW;
    const shade = isLeft ? 1.05 : 0.94; // Tạo phản xạ ánh sáng lệch hướng thớ
    const colColor = base.clone().multiplyScalar(shade);

    for (let y = -slatL; y < size + slatL; y += slatW * 2) {
      ctx.fillStyle = `#${colColor.getHexString()}`;
      ctx.save();
      ctx.translate(xBase, y);
      ctx.rotate(isLeft ? Math.PI / 4 : -Math.PI / 4);
      ctx.fillRect(-slatL / 2, -slatW / 2, slatL, slatW);
      ctx.strokeRect(-slatL / 2, -slatW / 2, slatL, slatW);

      if (bumpCtx) {
        bumpCtx.save();
        bumpCtx.translate(xBase, y);
        bumpCtx.rotate(isLeft ? Math.PI / 4 : -Math.PI / 4);
        bumpCtx.strokeRect(-slatL / 2, -slatW / 2, slatL, slatW);
        bumpCtx.restore();
      }

      ctx.restore();
    }
  }

  createNoiseOverlay(ctx, size, 0.04, 3);
}

/**
 * Gỗ vát xương cá Chevron (45° Inverted V)
 */
function drawChevron(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#cccccc';
    bumpCtx.fillRect(0, 0, size, size);
  }

  const chevronRows = 4;
  const rowH = size / chevronRows;
  const cols = 3;
  const colW = size / cols;

  for (let r = 0; r < chevronRows; r++) {
    const yTop = r * rowH;
    const yBot = (r + 1) * rowH;

    for (let c = 0; c < cols; c++) {
      const xL = c * colW;
      const xM = xL + colW / 2;
      const xR = xL + colW;

      // Nửa trái
      const shadeL = (r + c) % 2 === 0 ? 1.04 : 0.96;
      ctx.fillStyle = `#${base.clone().multiplyScalar(shadeL).getHexString()}`;
      ctx.beginPath();
      ctx.moveTo(xL, yTop + rowH * 0.35);
      ctx.lineTo(xM, yTop);
      ctx.lineTo(xM, yBot);
      ctx.lineTo(xL, yBot + rowH * 0.35);
      ctx.closePath();
      ctx.fill();

      // Nửa phải
      const shadeR = shadeL === 1.04 ? 0.94 : 1.06;
      ctx.fillStyle = `#${base.clone().multiplyScalar(shadeR).getHexString()}`;
      ctx.beginPath();
      ctx.moveTo(xM, yTop);
      ctx.lineTo(xR, yTop + rowH * 0.35);
      ctx.lineTo(xR, yBot + rowH * 0.35);
      ctx.lineTo(xM, yBot);
      ctx.closePath();
      ctx.fill();

      // Đường viền
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (bumpCtx) {
        bumpCtx.strokeStyle = '#151515';
        bumpCtx.lineWidth = 2;
        bumpCtx.stroke();
      }
    }
  }

  createNoiseOverlay(ctx, size, 0.04, 3);
}

/**
 * Gạch men vuông 60x60 (Ceramic Grid Tiles - 2x2 viên trong khổ 1.2m)
 */
function drawCeramicTile(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = '#94a3b8'; // Màu đường ron xi măng xám
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#111111'; // Rãnh ron tối màu trong bump
    bumpCtx.fillRect(0, 0, size, size);
  }

  const grid = 2; // 2x2 viên gạch 60x60 cm trong khổ lặp 1.2m
  const tileS = size / grid;
  const grout = 5;

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const x = c * tileS + grout / 2;
      const y = r * tileS + grout / 2;
      const w = tileS - grout;
      const h = tileS - grout;

      // Màu mặt gạch với hiệu ứng viền đệm nhẹ (bevel)
      const tShade = 0.98 + ((r * 3 + c * 5) % 5) * 0.01;
      const tColor = base.clone().multiplyScalar(tShade);

      ctx.fillStyle = `#${tColor.getHexString()}`;
      ctx.fillRect(x, y, w, h);

      // Hiệu ứng bóng viền đệm (subtle cushion bevel)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

      if (bumpCtx) {
        bumpCtx.fillStyle = '#e8e8e8'; // Mặt gạch nổi cao
        bumpCtx.fillRect(x, y, w, h);
      }
    }
  }
}

/**
 * Gạch bông Indochine cổ điển (Indochine Encaustic Pattern)
 */
function drawIndochineTile(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#d0d0d0';
    bumpCtx.fillRect(0, 0, size, size);
  }

  const tiles = 2; // 2x2 viên gạch bông lớn trong 1 tile 512
  const tSize = size / tiles;
  const motifColor = getColorLuminance(base) > 0.5 ? '#1e293b' : '#f8fafc';

  for (let tr = 0; tr < tiles; tr++) {
    for (let tc = 0; tc < tiles; tc++) {
      const cx = tc * tSize + tSize / 2;
      const cy = tr * tSize + tSize / 2;
      const r = tSize * 0.42;

      ctx.save();
      ctx.translate(cx, cy);

      // Đường viền góc bo tròn
      ctx.strokeStyle = motifColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Hoa văn 4 cánh hoa đối xứng
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.4, r * 0.4, 0, r * 0.85);
        ctx.quadraticCurveTo(-r * 0.4, r * 0.4, 0, 0);
        ctx.fillStyle = `${motifColor}22`;
        ctx.fill();
        ctx.stroke();
      }

      // Tâm hoa
      ctx.fillStyle = motifColor;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // 4 góc họa tiết cánh phụ
      for (let j = 0; j < 4; j++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.arc(tSize / 2, tSize / 2, r * 0.35, Math.PI, Math.PI * 1.5);
        ctx.stroke();
      }

      ctx.restore();

      // Đường ron giữa 2 viên gạch
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 3;
      ctx.strokeRect(tc * tSize, tr * tSize, tSize, tSize);

      if (bumpCtx) {
        bumpCtx.strokeStyle = '#111111';
        bumpCtx.lineWidth = 3;
        bumpCtx.strokeRect(tc * tSize, tr * tSize, tSize, tSize);
      }
    }
  }
}

/**
 * Đá cẩm thạch Marble Calacatta (Soft Organic Veins)
 */
function drawMarble(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#e8e8e8';
    bumpCtx.fillRect(0, 0, size, size);
  }

  // Lớp mây mềm nền loang nhẹ
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, 'rgba(0,0,0,0.02)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.03)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Vân đá cẩm thạch chính uốn lượn tự nhiên
  const isLight = getColorLuminance(base) > 0.5;
  const veinColor = isLight ? 'rgba(71, 85, 105, 0.28)' : 'rgba(255, 255, 255, 0.25)';
  const thinVein = isLight ? 'rgba(100, 116, 139, 0.16)' : 'rgba(255, 255, 255, 0.15)';

  ctx.strokeStyle = veinColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, 0);
  ctx.bezierCurveTo(size * 0.3, size * 0.35, size * 0.45, size * 0.5, size * 0.85, size);
  ctx.stroke();

  // Nhánh rẽ 1
  ctx.strokeStyle = thinVein;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size * 0.35, size * 0.38);
  ctx.bezierCurveTo(size * 0.6, size * 0.3, size * 0.75, size * 0.45, size, size * 0.4);
  ctx.stroke();

  // Nhánh rẽ 2
  ctx.beginPath();
  ctx.moveTo(0, size * 0.6);
  ctx.bezierCurveTo(size * 0.25, size * 0.65, size * 0.45, size * 0.8, size * 0.6, size);
  ctx.stroke();

  // Đốm vân mây mờ ảo
  createNoiseOverlay(ctx, size, 0.02, 5);
}

/**
 * Đá mài Terrazzo đa sắc (Multi-color Terrazzo Chips)
 */
function drawTerrazzo(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#e0e0e0';
    bumpCtx.fillRect(0, 0, size, size);
  }

  // Bảng màu các hạt đá thạch anh / cẩm thạch
  const chipColors = ['#f97316', '#3b82f6', '#10b981', '#64748b', '#78350f', '#0f172a', '#e2e8f0'];

  const chipCount = 140;
  for (let i = 0; i < chipCount; i++) {
    const cx = (i * 37) % size + ((i * 17) % 20);
    const cy = (i * 73) % size + ((i * 29) % 20);
    const rad = 2 + (i % 7) * 1.5;
    const col = chipColors[i % chipColors.length];

    ctx.fillStyle = col;
    ctx.beginPath();
    // Vẽ hạt dạng đa giác bất quy tắc 4-5 đỉnh
    const sides = 4 + (i % 3);
    for (let s = 0; s < sides; s++) {
      const angle = (s * Math.PI * 2) / sides;
      const dist = rad * (0.7 + ((s * i) % 5) * 0.1);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    if (bumpCtx && i % 3 === 0) {
      bumpCtx.fillStyle = '#f8f8f8';
      bumpCtx.fill();
    }
  }

  createNoiseOverlay(ctx, size, 0.03, 3);
}

/**
 * Bê tông mài bóng công nghiệp (Polished Concrete)
 */
function drawPolishedConcrete(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#cccccc';
    bumpCtx.fillRect(0, 0, size, size);
  }

  // Các vệt xoa nền công nghiệp (trowel arcs)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 14;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(size * (0.2 + i * 0.15), size * (0.3 + (i % 2) * 0.4), size * 0.45, 0, Math.PI * 0.7);
    ctx.stroke();
  }

  // Mảng loang sắc thái xi măng
  for (let j = 0; j < 8; j++) {
    const gx = (j * 113) % size;
    const gy = (j * 157) % size;
    const rad = 40 + (j % 4) * 20;
    const radial = ctx.createRadialGradient(gx, gy, 5, gx, gy, rad);
    radial.addColorStop(0, j % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(gx, gy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  createNoiseOverlay(ctx, size, 0.05, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Các Hàm Vẽ Cho Từng Loại Vật Liệu Tường (Wall Generators)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sơn mịn mờ tiêu chuẩn (Matte Wall Paint)
 */
function drawWallPaint(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#dddddd';
    bumpCtx.fillRect(0, 0, size, size);
  }

  // Hạt gai mịn stipple nhẹ
  createNoiseOverlay(ctx, size, 0.03, 2);
  if (bumpCtx) {
    createNoiseOverlay(bumpCtx, size, 0.08, 2);
  }
}

/**
 * Vữa bê tông mộc / Limewash (Concrete / Plaster)
 */
function drawWallConcrete(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#cccccc';
    bumpCtx.fillRect(0, 0, size, size);
  }

  // Các vệt cọ quét loang Wabi-sabi
  for (let k = 0; k < 12; k++) {
    const y = (k / 12) * size;
    ctx.fillStyle = k % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + (k % 3) * 15, size * 0.7, y - (k % 4) * 10, size, y + 5);
    ctx.lineTo(size, y + size / 12);
    ctx.lineTo(0, y + size / 12);
    ctx.closePath();
    ctx.fill();

    if (bumpCtx) {
      bumpCtx.fillStyle = k % 2 === 0 ? '#dedede' : '#b8b8b8';
      bumpCtx.fill();
    }
  }

  createNoiseOverlay(ctx, size, 0.06, 3);
}

/**
 * Giấy dán tường sọc dọc (Vertical Stripes)
 */
function drawWallpaperStripes(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  const stripes = 8;
  const sW = size / stripes;

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#d5d5d5';
    bumpCtx.fillRect(0, 0, size, size);
  }

  for (let i = 0; i < stripes; i++) {
    if (i % 2 === 1) {
      const altColor = base.clone().multiplyScalar(0.92);
      ctx.fillStyle = `#${altColor.getHexString()}`;
      ctx.fillRect(i * sW, 0, sW, size);
    }

    // Đường pinstripe chỉ viền thanh mảnh giữa các sọc
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(i * sW, 0);
    ctx.lineTo(i * sW, size);
    ctx.stroke();

    if (bumpCtx) {
      bumpCtx.strokeStyle = '#444444';
      bumpCtx.lineWidth = 1.5;
      bumpCtx.beginPath();
      bumpCtx.moveTo(i * sW, 0);
      bumpCtx.lineTo(i * sW, size);
      bumpCtx.stroke();
    }
  }
}

/**
 * Giấy dán tường hình học Bắc Âu (Scandinavian Geometric)
 */
function drawWallpaperGeometric(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#d0d0d0';
    bumpCtx.fillRect(0, 0, size, size);
  }

  const grid = 4;
  const gS = size / grid;

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const x = c * gS;
      const y = r * gS;

      // Tam giác nửa trên
      const colA = base.clone().multiplyScalar((r + c) % 2 === 0 ? 1.06 : 0.94);
      ctx.fillStyle = `#${colA.getHexString()}`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + gS, y);
      ctx.lineTo(x + gS / 2, y + gS / 2);
      ctx.closePath();
      ctx.fill();

      // Tam giác đáy
      const colB = base.clone().multiplyScalar((r + c) % 2 === 0 ? 0.92 : 1.08);
      ctx.fillStyle = `#${colB.getHexString()}`;
      ctx.beginPath();
      ctx.moveTo(x, y + gS);
      ctx.lineTo(x + gS, y + gS);
      ctx.lineTo(x + gS / 2, y + gS / 2);
      ctx.closePath();
      ctx.fill();

      // Đường viền kim loại ánh kim thanh mảnh
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)'; // Gold line accent
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, gS, gS);

      if (bumpCtx) {
        bumpCtx.strokeStyle = '#333333';
        bumpCtx.lineWidth = 1.5;
        bumpCtx.strokeRect(x, y, gS, gS);
      }
    }
  }
}

/**
 * Giấy dán tường lá nhiệt đới (Tropical Botanical)
 */
function drawWallpaperTropical(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#dddddd';
    bumpCtx.fillRect(0, 0, size, size);
  }

  const leafColor = getColorLuminance(base) > 0.4 ? 'rgba(5, 150, 105, 0.35)' : 'rgba(52, 211, 153, 0.35)';

  // Vẽ 4 khóm lá Monstera / cọ nhiệt đới phong cách tối giản
  const positions = [
    { x: size * 0.25, y: size * 0.25, scale: 0.9, rot: 0.3 },
    { x: size * 0.75, y: size * 0.75, scale: 1.0, rot: -0.4 },
    { x: size * 0.75, y: size * 0.25, scale: 0.8, rot: 1.8 },
    { x: size * 0.25, y: size * 0.75, scale: 0.85, rot: -1.2 },
  ];

  for (const pos of positions) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.rot);
    ctx.scale(pos.scale, pos.scale);

    ctx.fillStyle = leafColor;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.bezierCurveTo(45, -30, 40, 40, 0, 70);
    ctx.bezierCurveTo(-40, 40, -45, -30, 0, -60);
    ctx.fill();

    // Sống gân lá
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, 60);
    ctx.stroke();

    ctx.restore();
  }

  createNoiseOverlay(ctx, size, 0.03, 3);
}

/**
 * Tường gạch thẻ New York Loft (Exposed Brick)
 */
function drawWallBrick(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = '#334155'; // Mạch vữa xi măng xám đậm
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#111111'; // Rãnh vữa lún sâu trong bump
    bumpCtx.fillRect(0, 0, size, size);
  }

  const brickRows = 8;
  const rH = size / brickRows;
  const brickCols = 4;
  const bW = size / brickCols;
  const mortar = 5;

  for (let r = 0; r < brickRows; r++) {
    const offset = (r % 2) * (bW / 2);
    for (let c = -1; c <= brickCols + 1; c++) {
      const bx = c * bW + offset + mortar / 2;
      const by = r * rH + mortar / 2;
      const bw = bW - mortar;
      const bh = rH - mortar;

      // Độ loang màu của từng viên gạch nung
      const seed = (r * 7 + c * 13) % 9;
      const bColor = base.clone().multiplyScalar(0.88 + seed * 0.03);

      ctx.fillStyle = `#${bColor.getHexString()}`;
      ctx.fillRect(bx, by, bw, bh);

      // Vân gồ ghề thô mộc trên viên gạch
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let p = 0; p < 12; p++) {
        const px = bx + ((p * 23) % bw);
        const py = by + ((p * 17) % bh);
        ctx.fillRect(px, py, 3, 2);
      }

      if (bumpCtx) {
        bumpCtx.fillStyle = '#e5e5e5'; // Mặt viên gạch nhô cao
        bumpCtx.fillRect(bx, by, bw, bh);
      }
    }
  }
}

/**
 * Nan gỗ sọc tiêu âm (Acoustic Wood Slats)
 */
function drawWallWoodSlats(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = '#0f172a'; // Nền nỉ đen tiêu âm giữa các nan
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#050505'; // Rãnh nỉ chìm hoàn toàn
    bumpCtx.fillRect(0, 0, size, size);
  }

  const slats = 16;
  const slotW = size / slats;
  const slatW = slotW * 0.65; // Độ rộng nan gỗ
  const gapW = slotW - slatW;

  for (let i = 0; i < slats; i++) {
    const x = i * slotW + gapW / 2;
    // Sắc thái thớ gỗ giữa các nan
    const slatColor = base.clone().multiplyScalar(0.96 + (i % 3) * 0.03);
    ctx.fillStyle = `#${slatColor.getHexString()}`;
    ctx.fillRect(x, 0, slatW, size);

    // Vân thớ gỗ dọc theo nan
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + slatW * 0.35, 0);
    ctx.lineTo(x + slatW * 0.35, size);
    ctx.moveTo(x + slatW * 0.7, 0);
    ctx.lineTo(x + slatW * 0.7, size);
    ctx.stroke();

    if (bumpCtx) {
      bumpCtx.fillStyle = '#ffffff'; // Nan gỗ nổi 3D cao rõ rệt
      bumpCtx.fillRect(x, 0, slatW, size);
    }
  }
}

/**
 * Gạch gốm Subway bóng (Glossy Subway Tiles)
 */
function drawWallSubway(ctx, bumpCtx, size, baseColor) {
  const base = new THREE.Color(baseColor);
  ctx.fillStyle = '#94a3b8'; // Đường ron xám nhạt
  ctx.fillRect(0, 0, size, size);

  if (bumpCtx) {
    bumpCtx.fillStyle = '#111111';
    bumpCtx.fillRect(0, 0, size, size);
  }

  const rows = 6;
  const rH = size / rows;
  const cols = 3;
  const cW = size / cols;
  const grout = 4;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cW / 2);
    for (let c = -1; c <= cols + 1; c++) {
      const bx = c * cW + offset + grout / 2;
      const by = r * rH + grout / 2;
      const bw = cW - grout;
      const bh = rH - grout;

      ctx.fillStyle = `#${base.getHexString()}`;
      ctx.fillRect(bx, by, bw, bh);

      // Hiệu ứng vát cạnh men bóng (bevel)
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

      if (bumpCtx) {
        bumpCtx.fillStyle = '#f0f0f0';
        bumpCtx.fillRect(bx, by, bw, bh);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bộ Điều Phối & Sinh Texture Trung Tâm (Central Texture Factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vẽ hoa văn theo ID vật liệu
 */
export function drawPatternCanvas(canvas, bumpCanvas, type, materialId, hexColor) {
  const size = canvas.width;
  const ctx = canvas.getContext('2d');
  const bumpCtx = bumpCanvas ? bumpCanvas.getContext('2d') : null;

  if (type === 'floor') {
    switch (materialId) {
      case 'wood-straight':
        drawStraightWood(ctx, bumpCtx, size, hexColor);
        break;
      case 'wood-herringbone':
        drawHerringbone(ctx, bumpCtx, size, hexColor);
        break;
      case 'wood-chevron':
        drawChevron(ctx, bumpCtx, size, hexColor);
        break;
      case 'tile-ceramic':
        drawCeramicTile(ctx, bumpCtx, size, hexColor);
        break;
      case 'tile-indochine':
        drawIndochineTile(ctx, bumpCtx, size, hexColor);
        break;
      case 'stone-marble':
        drawMarble(ctx, bumpCtx, size, hexColor);
        break;
      case 'stone-terrazzo':
        drawTerrazzo(ctx, bumpCtx, size, hexColor);
        break;
      case 'concrete-polished':
        drawPolishedConcrete(ctx, bumpCtx, size, hexColor);
        break;
      default:
        drawStraightWood(ctx, bumpCtx, size, hexColor);
    }
  } else {
    // Wall materials
    switch (materialId) {
      case 'wall-paint':
        drawWallPaint(ctx, bumpCtx, size, hexColor);
        break;
      case 'wall-concrete':
        drawWallConcrete(ctx, bumpCtx, size, hexColor);
        break;
      case 'wallpaper-stripes':
        drawWallpaperStripes(ctx, bumpCtx, size, hexColor);
        break;
      case 'wallpaper-geometric':
        drawWallpaperGeometric(ctx, bumpCtx, size, hexColor);
        break;
      case 'wallpaper-tropical':
        drawWallpaperTropical(ctx, bumpCtx, size, hexColor);
        break;
      case 'wall-brick':
        drawWallBrick(ctx, bumpCtx, size, hexColor);
        break;
      case 'wall-wood-slats':
        drawWallWoodSlats(ctx, bumpCtx, size, hexColor);
        break;
      case 'wall-subway':
        drawWallSubway(ctx, bumpCtx, size, hexColor);
        break;
      default:
        drawWallPaint(ctx, bumpCtx, size, hexColor);
    }
  }
}

/**
 * Lấy chuỗi DataURL PNG của bất kỳ hoa văn sàn hoặc tường để hiển thị preview / SVG
 */
export function getPatternDataUrl(type = 'floor', materialId = 'wood-straight', hexColor = '#d6c7b2') {
  const key = `${type}_${materialId}_${hexColor}`;
  if (floorDataUrlCache.has(key)) {
    return floorDataUrlCache.get(key);
  }

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  drawPatternCanvas(canvas, null, type, materialId, hexColor);
  const dataUrl = canvas.toDataURL('image/png');
  floorDataUrlCache.set(key, dataUrl);
  return dataUrl;
}

/**
 * Lấy chuỗi DataURL PNG của texture sàn để hiển thị trên SVG 2D View
 * Tương thích ngược cả: getFloorTextureCanvasDataUrl(materialId, hexColor)
 * và getFloorTextureCanvasDataUrl('#d6c7b2')
 */
export function getFloorTextureCanvasDataUrl(arg1 = 'wood-straight', arg2 = '#d6c7b2') {
  let materialId = arg1;
  let hexColor = arg2;

  if (typeof arg1 === 'string' && arg1.startsWith('#')) {
    hexColor = arg1;
    materialId = 'wood-straight';
  }

  return getPatternDataUrl('floor', materialId, hexColor);
}

/**
 * Lấy bộ Texture Three.js (map, bumpMap, roughness, metalness) cho 3D
 */
export function getMaterialTextureBundle(type = 'floor', materialId, hexColor) {
  const matList = type === 'floor' ? FLOOR_MATERIALS : WALL_MATERIALS;
  const matDef = matList.find((m) => m.id === materialId) || matList[0];
  const color = hexColor || matDef.defaultColor;

  const key = `${type}_${matDef.id}_${color}`;
  if (materialBundleCache.has(key)) {
    return materialBundleCache.get(key);
  }

  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;

  drawPatternCanvas(colorCanvas, bumpCanvas, type, matDef.id, color);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const bundle = {
    map,
    bumpMap,
    roughness: matDef.defaultRoughness ?? 0.5,
    metalness: matDef.id === 'stone-marble' ? 0.08 : 0.02,
    bumpScale: matDef.bumpScale ?? 0.02,
    defaultRepeat: matDef.defaultRepeat ?? 1.0,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
    },
  };

  materialBundleCache.set(key, bundle);
  return bundle;
}

/**
 * Tương thích ngược với hàm makeFloorTexture cũ
 */
export function makeFloorTexture(hexColor = '#e2e8f0', _plankRows = 8) {
  const bundle = getMaterialTextureBundle('floor', 'wood-straight', hexColor);
  return bundle.map;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Thớ Gỗ & Vải Cho Mô Hình GLB Đồ Nội Thất (Giữ Nguyên Hoạt Động)
// ─────────────────────────────────────────────────────────────────────────────

export function makeWoodGrainTexture(baseColorInput) {
  const baseColor = baseColorInput instanceof THREE.Color ? baseColorInput : new THREE.Color(baseColorInput || '#8b5a2b');
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = `#${baseColor.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 28; i++) {
    const y = (i / 28) * size + (Math.random() - 0.5) * 6;
    ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.1})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      size * 0.3,
      y + (Math.random() - 0.5) * 8,
      size * 0.7,
      y + (Math.random() - 0.5) * 8,
      size,
      y
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeFabricTexture(baseColorInput) {
  const baseColor = baseColorInput instanceof THREE.Color ? baseColorInput : new THREE.Color(baseColorInput || '#3b82f6');
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = `#${baseColor.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 0; y < size; y += 3) {
    for (let x = 0; x < size; x += 3) {
      if ((x + y) % 6 === 0) ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function enhanceMaterial(material, tintColor, modelType = '') {
  if (!material) return;
  const name = (material.name || '').toLowerCase();

  const isMetal =
    name.includes('metal') ||
    name.includes('chrome') ||
    name.includes('iron') ||
    name.includes('steel') ||
    name.includes('gold') ||
    name.includes('brass') ||
    name.includes('leg') ||
    name.includes('handle');

  const isGlass = name.includes('glass') || name.includes('mirror');
  const isLight =
    name.includes('lamp') ||
    name.includes('light') ||
    name.includes('bulb') ||
    name.includes('glow');
  const isScreen =
    name.includes('screen') || name.includes('display') || name.includes('tv');
  const isLeaf =
    name.includes('leaf') || name.includes('leaves') || name.includes('foliage');
  const isSoil = name.includes('soil') || name.includes('dirt');

  // 1. Giữ nguyên vật liệu kim loại
  if (isMetal) {
    material.roughness = 0.35;
    material.metalness = 0.8;
    material.needsUpdate = true;
    return;
  }

  // 2. Vật liệu kính
  if (isGlass) {
    material.roughness = 0.08;
    material.metalness = 0.1;
    material.transparent = true;
    material.opacity = 0.45;
    material.needsUpdate = true;
    return;
  }

  // 3. Đèn phát sáng
  if (isLight) {
    material.roughness = 0.3;
    material.emissive = new THREE.Color('#fff7ed');
    material.emissiveIntensity = 0.5;
    material.needsUpdate = true;
    return;
  }

  // 4. Màn hình điện tử
  if (isScreen) {
    material.color.set('#0f172a');
    material.roughness = 0.15;
    material.needsUpdate = true;
    return;
  }

  // 5. Cây cối / Đất
  if (isLeaf) {
    material.roughness = 0.6;
    material.needsUpdate = true;
    return;
  }
  if (isSoil) {
    material.color.set('#3e2723');
    material.roughness = 0.9;
    material.needsUpdate = true;
    return;
  }

  // 6. Nhuộm màu thông minh
  const isFabric =
    name.includes('carpet') ||
    name.includes('fabric') ||
    name.includes('cushion') ||
    name.includes('cloth') ||
    name.includes('leather') ||
    name.includes('seat') ||
    name.includes('pillow') ||
    name.includes('bed') ||
    name.includes('linen') ||
    modelType === 'seating' ||
    modelType === 'rug' ||
    modelType === 'bed';

  const isWood =
    name.includes('wood') ||
    name.includes('timber') ||
    name.includes('plank') ||
    name.includes('board') ||
    modelType === 'table' ||
    modelType === 'storage';

  if (tintColor) {
    if (isWood) {
      material.map = makeWoodGrainTexture(tintColor);
      material.color.set(0xffffff);
      material.roughness = 0.55;
      material.metalness = 0.04;
    } else if (isFabric) {
      material.map = makeFabricTexture(tintColor);
      material.color.set(0xffffff);
      material.roughness = 0.88;
      material.metalness = 0.0;
    } else {
      material.map = null;
      material.color.set(tintColor);
      material.roughness = 0.6;
      material.metalness = 0.05;
    }
  }

  material.needsUpdate = true;
}
