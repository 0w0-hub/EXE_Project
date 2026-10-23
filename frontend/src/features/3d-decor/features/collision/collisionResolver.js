import * as THREE from 'three';
import { getSegmentWorld } from '../room/wallGraphUtils.js';

/**
 * Tính 4 đỉnh của hình chữ nhật đã xoay (Oriented Bounding Box) trên mặt phẳng sàn (XZ)
 */
function getRectangleCorners(item, padding = 0) {
  const [cx, , cz] = item.position || [0, 0, 0];
  const w = (item.dimensions?.width || 1) + padding;
  const d = (item.dimensions?.depth || 1) + padding;
  const angle = item.rotation ? item.rotation[1] : 0;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const hw = Math.max(0.05, w / 2);
  const hd = Math.max(0.05, d / 2);

  return [
    { x: cx + (hw * cos - hd * sin), z: cz + (hw * sin + hd * cos) },
    { x: cx + (-hw * cos - hd * sin), z: cz + (-hw * sin + hd * cos) },
    { x: cx + (-hw * cos + hd * sin), z: cz + (-hw * sin - hd * cos) },
    { x: cx + (hw * cos + hd * sin), z: cz + (hw * sin - hd * cos) },
  ];
}

/**
 * Chiếu các đỉnh lên 1 trục vector 2D (trục phân tách)
 */
function projectCorners(corners, axis) {
  let min = corners[0].x * axis.x + corners[0].z * axis.z;
  let max = min;
  for (let i = 1; i < corners.length; i++) {
    const val = corners[i].x * axis.x + corners[i].z * axis.z;
    if (val < min) min = val;
    if (val > max) max = val;
  }
  return { min, max };
}

/**
 * Thuật toán kiểm tra va chạm chuẩn xác 100%: Separating Axis Theorem (SAT) trên mặt phẳng XZ
 * - Tính đúng góc xoay của từng vật thể
 * - Bounding box trên màn hình chạm nhau thì mới báo va chạm, chưa chạm thì KHÔNG báo
 * - padding = -0.02: Cho phép chạm sát mép nhau (dung sai 2cm) mà không báo lỗi giả
 */
export function checkCollisionOBB2D(itemA, itemB, padding = -0.02) {
  if (!itemA || !itemB || itemA.instanceId === itemB.instanceId) return false;

  // Nếu một trong 2 vật thể là vật đỡ của vật kia (Parent - Child) -> Không coi là va chạm
  if (itemA.attachedTo === itemB.instanceId || itemB.attachedTo === itemA.instanceId) {
    return false;
  }

  // 1. Kiểm tra theo trục đứng Y: Nếu một vật thể trên cao (đèn trần) và một vật thể dưới đất thì không va chạm
  const yA = itemA.position?.[1] || 0;
  const hA = itemA.dimensions?.height || 1;
  const yB = itemB.position?.[1] || 0;
  const hB = itemB.dimensions?.height || 1;

  if (yA + hA <= yB + 0.05 || yB + hB <= yA + 0.05) {
    return false;
  }

  // 2. Tính 4 đỉnh của 2 hình chữ nhật đã xoay trên mặt sàn
  const cornersA = getRectangleCorners(itemA, padding);
  const cornersB = getRectangleCorners(itemB, padding);

  const angleA = itemA.rotation ? itemA.rotation[1] : 0;
  const angleB = itemB.rotation ? itemB.rotation[1] : 0;

  // 3. Bốn trục pháp tuyến cần kiểm tra (2 trục vuông góc của A và 2 trục của B)
  const axes = [
    { x: Math.cos(angleA), z: Math.sin(angleA) },
    { x: -Math.sin(angleA), z: Math.cos(angleA) },
    { x: Math.cos(angleB), z: Math.sin(angleB) },
    { x: -Math.sin(angleB), z: Math.cos(angleB) },
  ];

  // 4. Kiểm tra từng trục chiếu
  for (const axis of axes) {
    const projA = projectCorners(cornersA, axis);
    const projB = projectCorners(cornersB, axis);

    // Tồn tại trục phân tách -> Hai hình chữ nhật KHÔNG GIAO NHAU
    if (projA.max <= projB.min || projB.max <= projA.min) {
      return false;
    }
  }

  // Trên mọi trục đều giao nhau -> HAI VẬT THỂ THỰC SỰ VA CHẠM!
  return true;
}

/**
 * Tạo THREE.Box3 AABB bao quanh vật thể sau khi áp dụng ma trận xoay và dịch chuyển
 */
export function getItemBox3(item) {
  if (!item) return new THREE.Box3();

  const { width = 1, height = 1, depth = 1 } = item.dimensions || {};
  const [x, y, z] = item.position || [0, 0, 0];
  const rotY = item.rotation ? item.rotation[1] : 0;

  // Tạo local box tại gốc
  const localBox = new THREE.Box3(
    new THREE.Vector3(-width / 2, 0, -depth / 2),
    new THREE.Vector3(width / 2, height, depth / 2)
  );

  // Tạo ma trận xoay và tịnh tiến
  const matrix = new THREE.Matrix4();
  const rotM = new THREE.Matrix4().makeRotationY(rotY);
  const transM = new THREE.Matrix4().makeTranslation(x, y, z);
  matrix.multiplyMatrices(transM, rotM);

  return localBox.applyMatrix4(matrix);
}

/**
 * Tìm tất cả các vật thể đang va chạm với vật thể mục tiêu bằng thuật toán SAT OBB chuẩn xác
 */
export function findCollisionsFor(targetItem, allItems) {
  if (!targetItem || !allItems || allItems.length <= 1) return [];

  return allItems.filter((item) => {
    if (item.instanceId === targetItem.instanceId) return false;
    return checkCollisionOBB2D(targetItem, item, -0.02);
  });
}

/**
 * Kiểm tra xem vật thể có va chạm với bất kỳ vật thể nào khác không
 */
export function isItemColliding(targetItem, allItems) {
  return findCollisionsFor(targetItem, allItems).length > 0;
}

/**
 * Tính khoảng cách từ các mặt của vật thể tới 4 bức tường xung quanh phòng (có tính góc xoay)
 */
export function calculateWallDistances(item, room) {
  if (!item || !room) return null;
  const box = getItemBox3(item);
  const halfRoomW = (room.width || 5) / 2;
  const halfRoomL = (room.length || 5) / 2;

  return {
    backWall: Math.max(0, Number((box.min.z - (-halfRoomL)).toFixed(2))),
    frontWall: Math.max(0, Number((halfRoomL - box.max.z).toFixed(2))),
    leftWall: Math.max(0, Number((box.min.x - (-halfRoomW)).toFixed(2))),
    rightWall: Math.max(0, Number((halfRoomW - box.max.x).toFixed(2))),
  };
}

/**
 * Giới hạn vị trí (X, Z) của vật thể sao cho toàn bộ hình hộp chữ nhật (kể cả khi xoay)
 * luôn luôn nằm hoàn toàn bên trong 4 bức tường của căn phòng.
 */
export function clampItemInsideRoom(itemPosition, itemDimensions, rotationY, room) {
  const roomW = room?.width || 5;
  const roomL = room?.length || 5;
  const w = itemDimensions?.width || 1;
  const d = itemDimensions?.depth || 1;
  const angle = rotationY || 0;

  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));

  // Bán kính bao hình chữ nhật chiếu lên trục X và Z khi xoay OBB
  const halfExtentX = (w * cos + d * sin) / 2;
  const halfExtentZ = (w * sin + d * cos) / 2;

  const minX = -roomW / 2 + halfExtentX;
  const maxX = roomW / 2 - halfExtentX;
  const minZ = -roomL / 2 + halfExtentZ;
  const maxZ = roomL / 2 - halfExtentZ;

  let x = itemPosition[0];
  let z = itemPosition[2];

  if (minX <= maxX) {
    x = Math.max(minX, Math.min(maxX, x));
  } else {
    x = 0; // Nếu vật to hơn phòng thì đặt tại tâm
  }

  if (minZ <= maxZ) {
    z = Math.max(minZ, Math.min(maxZ, z));
  } else {
    z = 0;
  }

  return [x, 0, z];
}

/**
 * Kẹp biên trong tường và làm tròn theo bước lưới snap (nếu bật)
 */
export function snapAndClampPosition(pos, dimensions, rotationY, room, gridSnap = false, snapStep = 0.25) {
  let [x, , z] = clampItemInsideRoom(pos, dimensions, rotationY, room);

  if (gridSnap && snapStep > 0) {
    x = Math.round(x / snapStep) * snapStep;
    z = Math.round(z / snapStep) * snapStep;
    // Re-clamp sau khi làm tròn để đảm bảo snap không làm văng ra ngoài tường
    [x, , z] = clampItemInsideRoom([x, 0, z], dimensions, rotationY, room);
  }

  return [x, 0, z];
}

/**
 * Kiểm tra xem một vật thể có thể đóng vai trò làm bề mặt đỡ (Surface Host: bàn, kệ, tủ thấp,...) hay không
 */
export function isItemSurfaceHost(item) {
  if (!item || !item.dimensions) return false;
  if (item.isSurfaceHost === false) return false;
  if (item.isSurfaceHost === true) return true;

  const type = item.modelType || '';
  const id = item.catalogId || '';

  // Bàn (bàn trà, bàn ăn, bàn làm việc, bàn cafe, quầy bar)
  if (
    type === 'table' ||
    id.includes('table') ||
    id.includes('desk') ||
    id.includes('bar-counter') ||
    id.includes('barcounter')
  ) {
    return true;
  }

  // Kệ tivi, tab đầu giường, tủ thấp bếp (chiều cao <= 1.15m, bề mặt đủ lớn)
  if (
    (type === 'storage' || id.includes('tv') || id.includes('nightstand') || id.includes('sink') || id.includes('kitchen')) &&
    item.dimensions.height <= 1.15 &&
    item.dimensions.width >= 0.4 &&
    item.dimensions.depth >= 0.35
  ) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem một vật thể có thể được đặt lên bề mặt đỡ (bàn, kệ,...) hay không
 */
export function isItemPlaceableOnSurface(item) {
  if (!item || !item.dimensions) return false;
  if (item.canPlaceOnSurface === false) return false;
  if (item.canPlaceOnSurface === true) return true;

  const type = item.modelType || '';
  const id = item.catalogId || '';

  // Đồ trang trí decor, laptop, PC màn hình, TV để bàn, đèn bàn, cây cảnh nhỏ
  if (
    type === 'decor' ||
    id.includes('laptop') ||
    id.includes('computer') ||
    id.includes('tv-screen') ||
    id.includes('plant-succulent') ||
    id.includes('table-lamp')
  ) {
    return true;
  }

  // Đèn hoặc cây cảnh có kích thước nhỏ/vừa
  if (type === 'lamp' && item.dimensions.height <= 0.8) return true;
  if (type === 'plant' && item.dimensions.height <= 0.7) return true;

  // Bất kỳ đồ vật nhỏ nào có thể đặt lên bàn (không phải giường, thảm, sofa lớn, tủ đứng cao)
  if (
    type !== 'bed' &&
    type !== 'rug' &&
    type !== 'sofa' &&
    type !== 'seating' &&
    item.dimensions.height <= 1.2 &&
    item.dimensions.width <= 1.5 &&
    item.dimensions.depth <= 1.0
  ) {
    return true;
  }

  return false;
}

/**
 * Tìm bề mặt đỡ cao nhất bên dưới tọa độ mục tiêu (X, Z)
 * Thuật toán: Chuyển đổi tọa độ mục tiêu về hệ tọa độ cục bộ của vật đỡ (đã bỏ góc xoay Y)
 * để kiểm tra chính xác điểm có nằm trong hình chữ nhật bề mặt của vật đỡ hay không.
 */
export function findSupportingSurface(targetPos, targetDims, allItems, ignoreInstanceId = null) {
  if (!targetPos || !allItems || allItems.length === 0) return null;

  const [x, , z] = targetPos;
  let highestSurface = null;
  let maxSurfaceY = -Infinity;

  for (const host of allItems) {
    if (host.instanceId === ignoreInstanceId) continue;
    if (!isItemSurfaceHost(host)) continue;

    // Tránh vòng lặp phụ thuộc (cha không thể đặt lên con của chính nó)
    if (host.attachedTo === ignoreInstanceId) continue;

    const [hx, hy = 0, hz] = host.position || [0, 0, 0];
    const hw = host.dimensions?.width || 1;
    const hd = host.dimensions?.depth || 1;
    const hh = host.dimensions?.height || 0.5;
    const angle = host.rotation ? host.rotation[1] : 0;

    const dx = x - hx;
    const dz = z - hz;

    // Chiếu ngược vector (dx, dz) theo góc xoay -angle về hệ tọa độ cục bộ của host
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;

    // Cho phép dung sai 4cm sát viền mép bàn để dễ đặt đồ
    const halfW = hw / 2 + 0.04;
    const halfD = hd / 2 + 0.04;

    if (Math.abs(localX) <= halfW && Math.abs(localZ) <= halfD) {
      const surfaceY = hy + hh;
      if (surfaceY > maxSurfaceY) {
        maxSurfaceY = surfaceY;
        highestSurface = {
          hostItem: host,
          surfaceY: Number(surfaceY.toFixed(3)),
          localOffset: [Number(localX.toFixed(3)), hh, Number(localZ.toFixed(3))],
        };
      }
    }
  }

  return highestSurface;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * CHẾ ĐỘ 1: Tách va chạm an toàn (Symmetrical Push-apart)
 * Chỉ đẩy tách các món đang thực sự va quẹt nhau
 */
export function resolveCollisionsBox3(items, room, minGap = 0.1) {
  if (!items || items.length <= 1) return items;

  // Tách riêng đồ trên sàn (root), đồ gắn tường (wall), và đồ con trên mặt bàn (attached)
  const rootItems = items.filter((item) => !item.attachedTo && item.mountType !== 'wall');
  const wallItems = items.filter((item) => item.mountType === 'wall');
  const childItems = items.filter((item) => !!item.attachedTo);

  const halfW = (room.width || 5) / 2;
  const halfL = (room.length || 5) / 2;

  const resolvedRoots = rootItems.map((item) => ({
    ...item,
    position: [...item.position],
  }));

  for (let pass = 0; pass < 25; pass++) {
    let hadCollision = false;

    for (let i = 0; i < resolvedRoots.length; i++) {
      for (let j = i + 1; j < resolvedRoots.length; j++) {
        const a = resolvedRoots[i];
        const b = resolvedRoots[j];

        if (checkCollisionOBB2D(a, b, 0)) {
          hadCollision = true;

          const boxA = getItemBox3(a);
          const boxB = getItemBox3(b);

          const overlapX = Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x);
          const overlapZ = Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z);

          const wA = boxA.max.x - boxA.min.x;
          const wB = boxB.max.x - boxB.min.x;
          const dA = boxA.max.z - boxA.min.z;
          const dB = boxB.max.z - boxB.min.z;

          if (overlapX < overlapZ) {
            const push = Math.max(0.05, overlapX + minGap);
            const dir = b.position[0] >= a.position[0] ? 1 : -1;
            const half = push / 2;

            const boundA = halfW - wA / 2;
            const boundB = halfW - wB / 2;

            a.position[0] = clamp(a.position[0] - half * dir, -boundA, boundA);
            b.position[0] = clamp(b.position[0] + half * dir, -boundB, boundB);
          } else {
            const push = Math.max(0.05, overlapZ + minGap);
            const dir = b.position[2] >= a.position[2] ? 1 : -1;
            const half = push / 2;

            const boundA = halfL - dA / 2;
            const boundB = halfL - dB / 2;

            a.position[2] = clamp(a.position[2] - half * dir, -boundA, boundA);
            b.position[2] = clamp(b.position[2] + half * dir, -boundB, boundB);
          }
        }
      }
    }

    if (!hadCollision) break;
  }

  // Đồng bộ vị trí đồ con theo độ dời của bàn
  const resolvedChildren = childItems.map((child) => {
    const parentOld = items.find((i) => i.instanceId === child.attachedTo);
    const parentNew = resolvedRoots.find((i) => i.instanceId === child.attachedTo);
    if (!parentOld || !parentNew) return child;

    const dx = parentNew.position[0] - parentOld.position[0];
    const dz = parentNew.position[2] - parentOld.position[2];

    return {
      ...child,
      position: [
        Number((child.position[0] + dx).toFixed(4)),
        child.position[1],
        Number((child.position[2] + dz).toFixed(4)),
      ],
    };
  });

  return [...resolvedRoots, ...resolvedChildren, ...wallItems];
}

/**
 * CHẾ ĐỘ 2: Bố trí Công thái học thông minh (Ergonomic Space Planning)
 * Căn chỉnh khoảng cách theo chuẩn kiến trúc:
 * - Sofa cách Bàn trà: 0.45m
 * - Bàn trà cách Kệ Tivi: 1.8m - 2.2m
 * - Giường ngủ bám tường, chừa lối đi 2 bên 0.6m
 * - Đèn & Cây vào các góc phòng
 */
/**
 * Đồng bộ vị trí của tất cả các vật thể con theo độ dời của vật thể cha tương ứng
 */
export function syncChildrenWithParents(newParents, childItems, originalItems) {
  return childItems.map((child) => {
    const parentOld = originalItems.find((i) => i.instanceId === child.attachedTo);
    const parentNew = newParents.find((i) => i.instanceId === child.attachedTo);
    if (!parentOld || !parentNew) return child;

    const dx = parentNew.position[0] - parentOld.position[0];
    const dz = parentNew.position[2] - parentOld.position[2];

    return {
      ...child,
      position: [
        Number((child.position[0] + dx).toFixed(4)),
        child.position[1],
        Number((child.position[2] + dz).toFixed(4)),
      ],
    };
  });
}

/**
 * CHẾ ĐỘ 2: Bố trí Công thái học thông minh (Ergonomic Space Planning)
 * Căn chỉnh khoảng cách theo chuẩn kiến trúc:
 * - Sofa cách Bàn trà: 0.45m
 * - Bàn trà cách Kệ Tivi: 1.8m - 2.2m
 * - Giường ngủ bám tường, chừa lối đi 2 bên 0.6m
 * - Đèn & Cây vào các góc phòng
 */
export function layoutErgonomics(items, room) {
  if (!items || items.length === 0) return items;

  const rootItems = items.filter((i) => !i.attachedTo);
  const childItems = items.filter((i) => !!i.attachedTo);

  const halfW = (room.width || 5) / 2;
  const halfL = (room.length || 5) / 2;

  const arrangedRoots = rootItems.map((item) => ({ ...item, position: [...item.position] }));

  const seating = arrangedRoots.filter((i) => i.modelType === 'seating' || i.modelType === 'sofa');
  const tables = arrangedRoots.filter((i) => i.modelType === 'table');
  const storage = arrangedRoots.filter((i) => i.modelType === 'storage');
  const beds = arrangedRoots.filter((i) => i.modelType === 'bed');
  const lamps = arrangedRoots.filter((i) => i.modelType === 'lamp');
  const plants = arrangedRoots.filter((i) => i.modelType === 'plant');

  // 1. Giường ngủ: Kê đầu giường sát tường sau
  beds.forEach((bed, idx) => {
    const bedW = bed.dimensions.width;
    const bedD = bed.dimensions.depth;
    const posX = beds.length > 1 ? -halfW * 0.4 + idx * (bedW + 0.8) : 0;
    bed.position = [
      clamp(posX, -halfW + bedW / 2 + 0.5, halfW - bedW / 2 - 0.5),
      0,
      -halfL + bedD / 2 + 0.15,
    ];
    bed.rotation = [0, 0, 0];
  });

  // 2. Kệ Tivi / Tủ lưu trữ: Kê sát tường sau (hoặc đối diện giường)
  storage.forEach((item, idx) => {
    const itemW = item.dimensions.width;
    const itemD = item.dimensions.depth;
    const targetZ = beds.length > 0 ? halfL * 0.7 : -halfL + itemD / 2 + 0.15;
    const offset = (idx - (storage.length - 1) / 2) * (itemW + 0.3);
    item.position = [
      clamp(offset, -halfW + itemW / 2 + 0.2, halfW - itemW / 2 - 0.2),
      0,
      clamp(targetZ, -halfL + itemD / 2 + 0.1, halfL - itemD / 2 - 0.1),
    ];
  });

  // 3. Sofa: Đặt đối diện kệ tivi
  seating.forEach((seat, idx) => {
    const seatW = seat.dimensions.width;
    const seatD = seat.dimensions.depth;
    const targetZ = halfL * 0.35;
    const offset = (idx - (seating.length - 1) / 2) * (seatW + 0.4);
    seat.position = [
      clamp(offset, -halfW + seatW / 2 + 0.2, halfW - seatW / 2 - 0.2),
      0,
      clamp(targetZ, -halfL + seatD / 2 + 0.2, halfL - seatD / 2 - 0.2),
    ];
  });

  // 4. Bàn trà: Đặt trước Sofa cách 0.45m
  tables.forEach((table) => {
    const mainSeat = seating[0];
    const tableD = table.dimensions.depth;
    const tableW = table.dimensions.width;

    if (mainSeat) {
      const seatD = mainSeat.dimensions.depth;
      const targetZ = mainSeat.position[2] - seatD / 2 - tableD / 2 - 0.45;
      table.position = [
        clamp(mainSeat.position[0], -halfW + tableW / 2 + 0.2, halfW - tableW / 2 - 0.2),
        0,
        clamp(targetZ, -halfL + tableD / 2 + 0.2, halfL - tableD / 2 - 0.2),
      ];
    } else {
      table.position = [0, 0, 0];
    }
  });

  // 5. Đèn & Cây: Đặt vào các góc phòng
  const corners = [
    [-halfW + 0.4, -halfL + 0.4],
    [halfW - 0.4, -halfL + 0.4],
    [-halfW + 0.4, halfL - 0.4],
    [halfW - 0.4, halfL - 0.4],
  ];

  [...lamps, ...plants].forEach((item, idx) => {
    const corner = corners[idx % corners.length];
    item.position = [corner[0], 0, corner[1]];
  });

  const resolvedRoots = resolveCollisionsBox3(arrangedRoots, room, 0.15);
  const syncedChildren = syncChildrenWithParents(resolvedRoots, childItems, items);
  return [...resolvedRoots, ...syncedChildren, ...wallItems];
}

/**
 * CHẾ ĐỘ 3: Dàn đều khoảng cách (Distribute Evenly Spacing)
 */
export function layoutDistribute(items, room) {
  if (!items || items.length <= 1) return items;

  const rootItems = items.filter((i) => !i.attachedTo);
  const childItems = items.filter((i) => !!i.attachedTo);

  const halfW = (room.width || 5) / 2 - 0.4;
  const halfL = (room.length || 5) / 2 - 0.4;

  const count = rootItems.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const stepX = (halfW * 2) / Math.max(1, cols - 1 || 1);
  const stepZ = (halfL * 2) / Math.max(1, rows - 1 || 1);

  const distributedRoots = rootItems.map((item, index) => {
    const c = index % cols;
    const r = Math.floor(index / cols);

    const x = cols === 1 ? 0 : -halfW + c * stepX;
    const z = rows === 1 ? 0 : -halfL + r * stepZ;

    return {
      ...item,
      position: [Number(x.toFixed(2)), 0, Number(z.toFixed(2))],
    };
  });

  const resolvedRoots = resolveCollisionsBox3(distributedRoots, room, 0.15);
  const syncedChildren = syncChildrenWithParents(resolvedRoots, childItems, items);
  return [...resolvedRoots, ...syncedChildren, ...wallItems];
}

/**
 * =========================================================================
 * MÔ HÌNH HÓA MẶT TƯỜNG THẲNG ĐỨNG (VERTICAL WALL SURFACES)
 * Thiết kế kiến trúc mở: Tường là các đoạn thẳng 2D trên sàn XZ song song
 * với trục đứng Y, hỗ trợ tường 4 góc hiện tại và phòng đa giác tùy biến.
 * =========================================================================
 */

/**
 * Lấy danh sách các mặt tường thẳng đứng của phòng.
 * Ưu tiên trích xuất từ mô hình đồ thị tường wallGraph (tùy ý góc, hình học đa giác).
 * Nếu không có wallGraph hoặc rỗng, tự động lùi về 4 bức tường chữ nhật chuẩn (Bắc, Đông, Nam, Tây).
 */
export function getRoomWallSurfaces(room, wallGraph = null) {
  if (wallGraph && wallGraph.segments && wallGraph.vertices) {
    const segList = Object.values(wallGraph.segments);
    if (segList.length > 0) {
      const surfaces = [];
      for (const seg of segList) {
        const sw = getSegmentWorld(seg, wallGraph.vertices);
        if (!sw) continue;
        surfaces.push({
          id: seg.id,
          name: seg.label || `Đoạn tường ${seg.id.slice(-4)}`,
          start: sw.start,
          end: sw.end,
          dir: sw.dir,
          normal: sw.normal,
          length: Number(sw.length.toFixed(3)),
          height: Number(sw.height.toFixed(3)),
          thickness: Number(sw.thickness.toFixed(3)),
          segmentId: seg.id,
        });
      }
      if (surfaces.length > 0) {
        return surfaces;
      }
    }
  }

  const w = room?.width || 5;
  const l = room?.length || 5;
  const h = room?.height || 2.8;

  const halfW = w / 2;
  const halfL = l / 2;
  const thickness = room?.wallThickness || 0.15;

  // 4 bức tường theo thứ tự ngược chiều kim đồng hồ (CCW)
  // để vector pháp tuyến normal luôn chỉ chính xác vào tâm phòng:
  return [
    {
      id: 'wall-north',
      name: 'Tường Sau (Bắc)',
      start: { x: -halfW, z: -halfL },
      end: { x: halfW, z: -halfL },
      dir: { x: 1, z: 0 },
      normal: { x: 0, z: 1 },
      length: w,
      height: h,
      thickness,
    },
    {
      id: 'wall-east',
      name: 'Tường Phải (Đông)',
      start: { x: halfW, z: -halfL },
      end: { x: halfW, z: halfL },
      dir: { x: 0, z: 1 },
      normal: { x: -1, z: 0 },
      length: l,
      height: h,
      thickness,
    },
    {
      id: 'wall-south',
      name: 'Tường Trước (Nam)',
      start: { x: halfW, z: halfL },
      end: { x: -halfW, z: halfL },
      dir: { x: -1, z: 0 },
      normal: { x: 0, z: -1 },
      length: w,
      height: h,
      thickness,
    },
    {
      id: 'wall-west',
      name: 'Tường Trái (Tây)',
      start: { x: -halfW, z: halfL },
      end: { x: -halfW, z: -halfL },
      dir: { x: 0, z: -1 },
      normal: { x: 1, z: 0 },
      length: l,
      height: h,
      thickness,
    },
  ];
}

/**
 * Chiếu một điểm (X, Z) lên đoạn thẳng của một mặt tường thẳng đứng
 * Kẹp biên để vật phẩm không vượt quá mép bức tường
 */
export function projectPointToWall(point, wall, itemWidth = 1) {
  const px = point[0] !== undefined ? point[0] : point.x;
  const pz = point[2] !== undefined ? point[2] : (point.z !== undefined ? point.z : point[1]);

  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const lenSq = dx * dx + dz * dz;

  if (lenSq === 0) {
    return { t: 0.5, u: 0, projX: wall.start.x, projZ: wall.start.z, dist: 0 };
  }

  const apx = px - wall.start.x;
  const apz = pz - wall.start.z;
  const t = (apx * dx + apz * dz) / lenSq;

  // Giới hạn t để vật phẩm không tràn khỏi 2 mép tường (chừa đệm góc bằng độ dày tường vuông góc)
  const wallThick = wall.thickness || 0.15;
  const halfW = (itemWidth || 1) / 2;
  const cornerMargin = wallThick / 2 + halfW;
  const marginT = wall.length > 0 ? Math.min(0.5, cornerMargin / wall.length) : 0;
  const minT = marginT;
  const maxT = 1 - marginT;
  const clampedT = Math.max(minT, Math.min(maxT, t));

  const projX = wall.start.x + clampedT * dx;
  const projZ = wall.start.z + clampedT * dz;

  const distSq = (px - projX) ** 2 + (pz - projZ) ** 2;

  return {
    t: clampedT,
    u: clampedT * wall.length,
    projX,
    projZ,
    dist: Math.sqrt(distSq),
  };
}

/**
 * Tìm mặt tường gần nhất với một tọa độ bất kỳ
 */
export function findNearestWallSurface(point, wallSurfaces, itemWidth = 1) {
  if (!wallSurfaces || wallSurfaces.length === 0) return null;

  let bestWall = null;
  let bestProj = null;
  let minDist = Infinity;

  for (const wall of wallSurfaces) {
    const proj = projectPointToWall(point, wall, itemWidth);
    if (proj.dist < minDist) {
      minDist = proj.dist;
      bestWall = wall;
      bestProj = proj;
    }
  }

  return {
    wall: bestWall,
    ...bestProj,
  };
}

/**
 * Tính toán trọn vẹn Transform thế giới [Position, Rotation] cho vật thể gắn tường.
 * Bắt dính chính xác vào mặt phẳng trong của tường, tự xoay vuông góc hướng mặt vào lòng phòng.
 * Hỗ trợ hệ tường linh hoạt wallGraph và 4 bức tường cơ bản.
 */
export function snapWallItemTransform(
  point,
  dimensions = { width: 1, height: 1, depth: 0.1 },
  room,
  currentElevation = null,
  specificWallId = null,
  wallGraph = null
) {
  const walls = getRoomWallSurfaces(room, wallGraph);
  let wallMatch = null;

  if (specificWallId) {
    const found = walls.find((w) => w.id === specificWallId);
    if (found) {
      const proj = projectPointToWall(point, found, dimensions.width);
      wallMatch = { wall: found, ...proj };
    }
  }

  if (!wallMatch) {
    wallMatch = findNearestWallSurface(point, walls, dimensions.width);
  }

  if (!wallMatch || !wallMatch.wall) {
    const fallbackWall = walls && walls[0] ? walls[0] : null;
    return {
      position: [0, currentElevation || 0, 0],
      rotation: [0, 0, 0],
      wallId: fallbackWall ? fallbackWall.id : 'wall-north',
      wallName: fallbackWall ? fallbackWall.name : 'Tường Sau (Bắc)',
      wallU: 0,
      wallT: 0.5,
      wallLength: fallbackWall ? fallbackWall.length : (room?.width || 5),
      elevation: currentElevation || 0,
    };
  }

  const { wall, projX, projZ, u, t } = wallMatch;
  const depth = dimensions.depth || 0.1;
  const wallThickness = wall.thickness || room?.wallThickness || 0.15;
  const wallHalfThickness = wallThickness / 2;
  // Đệm nhỏ 2mm để mặt lưng vật thể áp sát chuẩn xác mặt trong của tường mà không bị z-fighting hay chìm vào tường
  const gap = 0.002;
  const offset = wallHalfThickness + depth / 2 + gap;

  const worldX = projX + wall.normal.x * offset;
  const worldZ = projZ + wall.normal.z * offset;

  // Giới hạn độ cao Y trong khoảng từ 0 đến trần nhà trừ chiều cao vật thể
  const roomH = wall.height || room?.height || 2.8;
  const itemH = dimensions.height || 1;
  const maxElevation = Math.max(0, roomH - itemH);
  const inputElevation =
    currentElevation !== null && currentElevation !== undefined
      ? currentElevation
      : point[1] !== undefined
      ? point[1]
      : 0;
  const elev = Math.max(0, Math.min(maxElevation, inputElevation));

  // Góc xoay hướng mặt vật thể vào lòng phòng (dựa theo normal vector của tường)
  const rotY = Math.atan2(wall.normal.x, wall.normal.z);

  return {
    position: [Number(worldX.toFixed(4)), Number(elev.toFixed(4)), Number(worldZ.toFixed(4))],
    rotation: [0, Number(rotY.toFixed(4)), 0],
    wallId: wall.id,
    wallName: wall.name,
    wallU: Number(u.toFixed(3)),
    wallT: Number((t !== undefined ? t : (wall.length > 0 ? u / wall.length : 0.5)).toFixed(4)),
    wallLength: wall.length,
    elevation: Number(elev.toFixed(4)),
  };
}

/**
 * Cập nhật vị trí, góc xoay của một vật thể và đồng bộ tất cả các vật thể con đang gắn trên nó
 */
export function cascadeItemTransform(items, targetId, transformProps) {
  const target = items.find((i) => i.instanceId === targetId);
  if (!target) return items;

  const {
    position,
    rotation,
    scale,
    attachedTo,
    wallId,
    wallName,
    wallU,
    wallT,
    wallLength,
    elevation,
  } = transformProps;

  const oldPos = target.position || [0, 0, 0];
  const oldRot = target.rotation || [0, 0, 0];

  const newPos = position !== undefined ? position : oldPos;
  const newRot = rotation !== undefined ? rotation : oldRot;
  const newScale = scale !== undefined ? scale : target.scale;
  const newAttachedTo = attachedTo !== undefined ? attachedTo : target.attachedTo;

  const deltaAngle = (newRot[1] || 0) - (oldRot[1] || 0);

  // Map lưu trữ thay đổi của target và toàn bộ các hậu duệ (children, grandchildren,...)
  const updatesMap = new Map();
  const targetUpdates = {
    position: newPos,
    rotation: newRot,
    scale: newScale,
    attachedTo: newAttachedTo,
  };
  if (wallId !== undefined) targetUpdates.wallId = wallId;
  if (wallName !== undefined) targetUpdates.wallName = wallName;
  if (wallU !== undefined) targetUpdates.wallU = wallU;
  if (wallT !== undefined) targetUpdates.wallT = wallT;
  if (wallLength !== undefined) targetUpdates.wallLength = wallLength;
  if (elevation !== undefined) targetUpdates.elevation = elevation;

  updatesMap.set(targetId, targetUpdates);

  // Hàng đợi duyệt qua cây phân cấp cha - con
  const queue = [{ parentId: targetId, parentOldPos: oldPos, parentNewPos: newPos, dAngle: deltaAngle }];

  while (queue.length > 0) {
    const { parentId, parentOldPos, parentNewPos, dAngle } = queue.shift();
    const children = items.filter((i) => i.attachedTo === parentId);

    for (const child of children) {
      const cOldPos = child.position || [0, 0, 0];
      const cOldRot = child.rotation || [0, 0, 0];

      // Vector tương đối từ tâm cha cũ tới con
      const relX = cOldPos[0] - parentOldPos[0];
      const relZ = cOldPos[2] - parentOldPos[2];

      // Xoay vector tương đối theo deltaAngle của cha
      const cos = Math.cos(dAngle);
      const sin = Math.sin(dAngle);
      const newRelX = relX * cos - relZ * sin;
      const newRelZ = relX * sin + relZ * cos;

      const cNewPos = [
        Number((parentNewPos[0] + newRelX).toFixed(4)),
        Number((cOldPos[1] + (parentNewPos[1] - parentOldPos[1])).toFixed(4)),
        Number((parentNewPos[2] + newRelZ).toFixed(4)),
      ];
      const cNewRot = [
        cOldRot[0],
        Number((cOldRot[1] + dAngle).toFixed(4)),
        cOldRot[2],
      ];

      updatesMap.set(child.instanceId, {
        position: cNewPos,
        rotation: cNewRot,
      });

      queue.push({
        parentId: child.instanceId,
        parentOldPos: cOldPos,
        parentNewPos: cNewPos,
        dAngle,
      });
    }
  }

  return items.map((item) => {
    if (updatesMap.has(item.instanceId)) {
      return {
        ...item,
        ...updatesMap.get(item.instanceId),
      };
    }
    return item;
  });
}

/**
 * Tự động đồng bộ toàn bộ vật thể gắn tường (mountType === 'wall') theo hệ tường wallGraph.
 * Khi đỉnh tường di chuyển, xoay hoặc tường đổi độ dài, các vật thể gắn trên tường đó
 * sẽ bám sát mặt trong tường, xoay đúng hướng vuông góc vào phòng và bảo toàn vị trí tương đối (wallT).
 */
export function syncWallItemsWithGraph(items, wallGraph, room) {
  if (!items || items.length === 0) return items;
  const wallSurfaces = getRoomWallSurfaces(room, wallGraph);
  if (!wallSurfaces || wallSurfaces.length === 0) return items;

  let currentItems = [...items];
  for (const item of items) {
    if (item.mountType !== 'wall') continue;

    let targetWall = wallSurfaces.find((w) => w.id === item.wallId);
    let proj = null;

    if (!targetWall) {
      const nearest = findNearestWallSurface(item.position, wallSurfaces, item.dimensions?.width);
      if (nearest && nearest.wall) {
        targetWall = nearest.wall;
        proj = nearest;
      } else {
        targetWall = wallSurfaces[0];
      }
    }

    const wallThick = targetWall.thickness || room?.wallThickness || 0.15;
    const halfW = (item.dimensions?.width || 1) / 2;
    const cornerMargin = wallThick / 2 + halfW;
    const marginT = targetWall.length > 0 ? Math.min(0.5, cornerMargin / targetWall.length) : 0;
    const minT = marginT;
    const maxT = 1 - minT;

    let t;
    if (proj) {
      t = proj.t;
    } else if (item.wallT !== undefined && item.wallT !== null) {
      t = item.wallT;
    } else if (item.wallU !== undefined && item.wallU !== null) {
      const prevLen = item.wallLength || targetWall.length;
      t = item.wallU / (prevLen || 1);
    } else {
      const p = projectPointToWall(item.position, targetWall, item.dimensions?.width);
      t = p.t;
    }

    const clampedT = Math.max(minT, Math.min(maxT, t));
    const projX = targetWall.start.x + clampedT * (targetWall.end.x - targetWall.start.x);
    const projZ = targetWall.start.z + clampedT * (targetWall.end.z - targetWall.start.z);
    const u = clampedT * targetWall.length;

    const depth = item.dimensions?.depth || 0.1;
    const gap = 0.002;
    const offset = wallThick / 2 + depth / 2 + gap;
    const worldX = projX + targetWall.normal.x * offset;
    const worldZ = projZ + targetWall.normal.z * offset;

    const roomH = targetWall.height || room?.height || 2.8;
    const itemH = item.dimensions?.height || 1;
    const maxElevation = Math.max(0, roomH - itemH);
    const inputElevation =
      item.elevation !== undefined && item.elevation !== null
        ? item.elevation
        : (item.position ? item.position[1] : 0);
    const elev = Math.max(0, Math.min(maxElevation, inputElevation));

    const rotY = Math.atan2(targetWall.normal.x, targetWall.normal.z);

    const newPos = [Number(worldX.toFixed(4)), Number(elev.toFixed(4)), Number(worldZ.toFixed(4))];
    const newRot = [0, Number(rotY.toFixed(4)), 0];

    currentItems = cascadeItemTransform(currentItems, item.instanceId, {
      position: newPos,
      rotation: newRot,
      wallId: targetWall.id,
      wallName: targetWall.name,
      wallU: Number(u.toFixed(3)),
      wallT: Number(clampedT.toFixed(4)),
      wallLength: targetWall.length,
      elevation: Number(elev.toFixed(4)),
    });
  }

  return currentItems;
}

