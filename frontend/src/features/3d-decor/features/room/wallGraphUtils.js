/**
 * wallGraphUtils.js — Pure utility functions cho hệ thống tường và sơ đồ mặt bằng
 *
 * Áp dụng thuật toán Miter Bisector Offset:
 * Tại mỗi đỉnh V, đường phân giác của 2 cạnh kề được dùng để tính 2 điểm:
 *   V_outer và V_inner = V ± (thickness / 2 / cos(angle / 2)) * n_bisector
 * Nhờ đó, các đoạn tường kề nhau tại đỉnh V dùng chung chính xác cạnh nối [V_inner, V_outer],
 * triệt tiêu hoàn toàn khe hở và chồng chéo góc tường.
 */

import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ID Generators
// ─────────────────────────────────────────────────────────────────────────────

export function generateVertexId() {
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function generateSegmentId() {
  return `seg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function generateOpeningId() {
  return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build Default Wall Graph từ room.width / room.length
// ─────────────────────────────────────────────────────────────────────────────

export function buildDefaultWallGraph(room) {
  const hw = (room?.width || 6) / 2;
  const hl = (room?.length || 5) / 2;
  const thickness = 0.15;
  const height = room?.height || 2.8;

  const vIds = [generateVertexId(), generateVertexId(), generateVertexId(), generateVertexId()];

  // Đỉnh theo thứ tự ngược chiều kim đồng hồ (CCW)
  const vertices = {
    [vIds[0]]: { id: vIds[0], x: -hw, z: -hl }, // Góc Tây-Bắc (Tây: -X, Bắc: -Z)
    [vIds[1]]: { id: vIds[1], x: hw, z: -hl },  // Góc Đông-Bắc
    [vIds[2]]: { id: vIds[2], x: hw, z: hl },   // Góc Đông-Nam
    [vIds[3]]: { id: vIds[3], x: -hw, z: hl },  // Góc Tây-Nam
  };

  const mkSeg = (v1, v2, label) => {
    const id = generateSegmentId();
    return {
      [id]: { id, v1, v2, thickness, height, materialId: 'wall-default', label },
    };
  };

  const segments = {
    ...mkSeg(vIds[0], vIds[1], 'Tường Bắc'),
    ...mkSeg(vIds[1], vIds[2], 'Tường Đông'),
    ...mkSeg(vIds[2], vIds[3], 'Tường Nam'),
    ...mkSeg(vIds[3], vIds[0], 'Tường Tây'),
  };

  return { vertices, segments, openings: {} };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Miter Bisector Offset Algorithm (Thuật toán phân giác tạo tường dày)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính toán outer vertex và inner vertex cho toàn bộ các đỉnh trong wallGraph.
 *
 * Công thức hình học:
 * Cho đỉnh V có cạnh tới u1 (từ V_prev tới V) và cạnh đi u2 (từ V tới V_next):
 * Pháp tuyến 2D (hướng sang trái/inward):
 *   n1 = (-u1.z, u1.x)
 *   n2 = (-u2.z, u2.x)
 * Vector phân giác:
 *   n_bisector = normalize(n1 + n2)
 * Khoảng cách offset dọc theo đường phân giác:
 *   L = (thickness / 2) / (n_bisector · n1) = (thickness / 2) / cos(theta / 2)
 * Do đó:
 *   V_outer = V + L * n_bisector
 *   V_inner = V - L * n_bisector
 */
export function computeVertexMiterOffsets(wallGraph) {
  const { vertices, segments } = wallGraph;
  const offsets = {}; // vertexId -> { outer: {x, z}, inner: {x, z}, bisector: {x, z} }

  // 1. Tạo bản đồ kết nối cho mỗi đỉnh
  const connections = {}; // vertexId -> { incoming: [seg], outgoing: [seg] }
  for (const vId of Object.keys(vertices)) {
    connections[vId] = { incoming: [], outgoing: [] };
  }

  for (const seg of Object.values(segments)) {
    if (connections[seg.v1]) connections[seg.v1].outgoing.push(seg);
    if (connections[seg.v2]) connections[seg.v2].incoming.push(seg);
  }

  // 2. Với mỗi đỉnh, tính vector phân giác
  for (const [vId, v] of Object.entries(vertices)) {
    const conn = connections[vId];
    const incomingSeg = conn.incoming[0];
    const outgoingSeg = conn.outgoing[0];

    // Mặc định độ dày tường
    const thickness = outgoingSeg?.thickness || incomingSeg?.thickness || 0.15;
    const halfT = thickness / 2;

    if (incomingSeg && outgoingSeg && incomingSeg.id !== outgoingSeg.id) {
      // Đỉnh nối 2 đoạn tường (góc phòng)
      const vPrev = vertices[incomingSeg.v1];
      const vNext = vertices[outgoingSeg.v2];

      if (!vPrev || !vNext) {
        offsets[vId] = { inner: { x: v.x, z: v.z + halfT }, outer: { x: v.x, z: v.z - halfT } };
        continue;
      }

      // Vector hướng cạnh đến và cạnh đi
      const d1x = v.x - vPrev.x;
      const d1z = v.z - vPrev.z;
      const len1 = Math.sqrt(d1x * d1x + d1z * d1z) || 1;
      const u1x = d1x / len1;
      const u1z = d1z / len1;

      const d2x = vNext.x - v.x;
      const d2z = vNext.z - v.z;
      const len2 = Math.sqrt(d2x * d2x + d2z * d2z) || 1;
      const u2x = d2x / len2;
      const u2z = d2z / len2;

      // Pháp tuyến 2D (hướng sang trái của vector chuyển động CCW: hướng vào trong phòng)
      const n1x = -u1z;
      const n1z = u1x;
      const n2x = -u2z;
      const n2z = u2x;

      // Vector phân giác (hướng vào trong phòng)
      let bisectX = n1x + n2x;
      let bisectZ = n1z + n2z;
      let bisectLen = Math.sqrt(bisectX * bisectX + bisectZ * bisectZ);

      if (bisectLen < 1e-4) {
        // Hai cạnh thẳng hàng ngược chiều (gập 180 độ)
        bisectX = n1x;
        bisectZ = n1z;
        bisectLen = 1;
      }

      bisectX /= bisectLen;
      bisectZ /= bisectLen;

      // cos(góc / 2) = n_bisector · n1
      const cosHalfAngle = bisectX * n1x + bisectZ * n1z;

      // Giới hạn miter limit để góc nhọn không bung quá đà
      const safeCos = Math.max(0.2, Math.abs(cosHalfAngle));
      const miterDist = Math.min(halfT / safeCos, halfT * 2.8);

      // bisector hướng inward vào trong phòng:
      // inner = v + bisector * dist (mặt trong phòng)
      // outer = v - bisector * dist (mặt ngoài phòng)
      offsets[vId] = {
        inner: { x: v.x + bisectX * miterDist, z: v.z + bisectZ * miterDist },
        outer: { x: v.x - bisectX * miterDist, z: v.z - bisectZ * miterDist },
        bisector: { x: bisectX, z: bisectZ },
      };
    } else {
      // Đỉnh đầu mút (chỉ có 1 cạnh nối)
      const seg = outgoingSeg || incomingSeg;
      if (!seg) {
        offsets[vId] = { inner: { x: v.x - halfT, z: v.z }, outer: { x: v.x + halfT, z: v.z } };
        continue;
      }

      const isStart = !!outgoingSeg;
      const otherV = isStart ? vertices[seg.v2] : vertices[seg.v1];
      if (!otherV) {
        offsets[vId] = { inner: { x: v.x - halfT, z: v.z }, outer: { x: v.x + halfT, z: v.z } };
        continue;
      }

      const dx = isStart ? (otherV.x - v.x) : (v.x - otherV.x);
      const dz = isStart ? (otherV.z - v.z) : (v.z - otherV.z);
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      const ux = dx / len;
      const uz = dz / len;

      const nx = -uz;
      const nz = ux;

      offsets[vId] = {
        inner: { x: v.x + nx * halfT, z: v.z + nz * halfT },
        outer: { x: v.x - nx * halfT, z: v.z - nz * halfT },
        bisector: { x: nx, z: nz },
      };
    }
  }

  return offsets;
}

/**
 * Trả về 4 đỉnh đáy tứ giác [P1, P2, P3, P4] của một đoạn tường
 * khớp miter hoàn hảo với các đoạn tường liền kề.
 */
export function getSegmentQuadCorners(seg, vertices, miterOffsets) {
  const v1Offset = miterOffsets[seg.v1];
  const v2Offset = miterOffsets[seg.v2];
  if (!v1Offset || !v2Offset) return null;

  return [
    v1Offset.outer, // P1: ngoài đầu
    v2Offset.outer, // P2: ngoài cuối
    v2Offset.inner, // P3: trong cuối
    v1Offset.inner, // P4: trong đầu
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Floor Shape Generator (Mặt sàn hình phẳng tạo từ chu trình các đỉnh tường)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo THREE.Shape cho mặt sàn từ chu trình các đỉnh tường.
 */
export function buildFloorShape(wallGraph) {
  const { vertices, segments } = wallGraph;
  const vList = Object.values(vertices);
  if (vList.length < 3) return null;

  // Sắp xếp các đỉnh theo thứ tự nối của segments
  const segList = Object.values(segments);
  const orderedVertices = [];
  const visited = new Set();

  if (segList.length > 0) {
    let currentVId = segList[0].v1;
    for (let i = 0; i < segList.length; i++) {
      if (visited.has(currentVId)) break;
      const v = vertices[currentVId];
      if (v) {
        orderedVertices.push(v);
        visited.add(currentVId);
      }
      const nextSeg = segList.find((s) => s.v1 === currentVId && !visited.has(s.v2));
      if (nextSeg) {
        currentVId = nextSeg.v2;
      } else {
        break;
      }
    }
  }

  const pts = orderedVertices.length >= 3 ? orderedVertices : vList;

  const shape = new THREE.Shape();
  // Map toạ độ (x, z) vào Shape (X, Y) với Y = -z
  // Vì khi ShapeGeometry xoay quanh trục X góc -90deg, toạ độ Z sẽ là -Y = -(-z) = z (không bị lật đối xứng Ox)
  shape.moveTo(pts[0].x, -pts[0].z);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i].x, -pts[i].z);
  }
  shape.closePath();

  return shape;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Build 3D Wall Mesh Geometry with Door/Window Cutouts (CSG-Free & Robust)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dựng BufferGeometry 3D khối đặc cho một tứ giác đáy [P1, P2, P3, P4] từ yMin đến yMax.
 * P1 -> P2 -> P3 -> P4 trên mặt phẳng XZ (CCW).
 */
function createPrismGeometry(
  p1, p2, p3, p4,
  yMin, yMax,
  hasStartCap = true,
  hasEndCap = true,
  segLength = null,
  u0Ratio = 0,
  u1Ratio = 1
) {
  const positions = [];
  const normals = [];
  const uvs = [];

  const addQuad = (v0, v1, v2, v3, norm, uv0, uv1, uv2, uv3) => {
    // 2 tam giác tạo thành tứ giác: (v0, v1, v2) và (v0, v2, v3)
    positions.push(
      v0.x, v0.y, v0.z,
      v1.x, v1.y, v1.z,
      v2.x, v2.y, v2.z,
      v0.x, v0.y, v0.z,
      v2.x, v2.y, v2.z,
      v3.x, v3.y, v3.z
    );
    for (let i = 0; i < 6; i++) {
      normals.push(norm.x, norm.y, norm.z);
    }
    uvs.push(
      uv0.u, uv0.v,
      uv1.u, uv1.v,
      uv2.u, uv2.v,
      uv0.u, uv0.v,
      uv2.u, uv2.v,
      uv3.u, uv3.v
    );
  };

  // Tính tọa độ UV thực tế theo mét dọc theo đoạn tường
  const actualLen = segLength ?? (Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2) || 1);
  const uStart = u0Ratio * actualLen;
  const uEnd = u1Ratio * actualLen;
  const thickness = Math.sqrt((p4.x - p1.x) ** 2 + (p4.z - p1.z) ** 2) || 0.15;

  // Đỉnh dưới
  const b0 = { x: p1.x, y: yMin, z: p1.z };
  const b1 = { x: p2.x, y: yMin, z: p2.z };
  const b2 = { x: p3.x, y: yMin, z: p3.z };
  const b3 = { x: p4.x, y: yMin, z: p4.z };

  // Đỉnh trên
  const t0 = { x: p1.x, y: yMax, z: p1.z };
  const t1 = { x: p2.x, y: yMax, z: p2.z };
  const t2 = { x: p3.x, y: yMax, z: p3.z };
  const t3 = { x: p4.x, y: yMax, z: p4.z };

  // Mặt trên (Y = yMax, norm: [0, 1, 0])
  addQuad(
    t0, t3, t2, t1,
    { x: 0, y: 1, z: 0 },
    { u: uStart, v: 0 },
    { u: uStart, v: thickness },
    { u: uEnd, v: thickness },
    { u: uEnd, v: 0 }
  );

  // Mặt dưới (Y = yMin, norm: [0, -1, 0])
  addQuad(
    b0, b1, b2, b3,
    { x: 0, y: -1, z: 0 },
    { u: uStart, v: 0 },
    { u: uEnd, v: 0 },
    { u: uEnd, v: thickness },
    { u: uStart, v: thickness }
  );

  // Mặt ngoài (P1 -> P2, nhìn từ ngoài: b1 -> b0 -> t0 -> t1)
  const normOutX = p2.z - p1.z;
  const normOutZ = -(p2.x - p1.x);
  const lenOut = Math.sqrt(normOutX * normOutX + normOutZ * normOutZ) || 1;
  addQuad(
    b1, b0, t0, t1,
    { x: normOutX / lenOut, y: 0, z: normOutZ / lenOut },
    { u: uEnd, v: yMin },
    { u: uStart, v: yMin },
    { u: uStart, v: yMax },
    { u: uEnd, v: yMax }
  );

  // Mặt trong (P3 -> P4, nhìn từ trong phòng: b3 -> b2 -> t2 -> t3)
  const normInX = p4.z - p3.z;
  const normInZ = -(p4.x - p3.x);
  const lenIn = Math.sqrt(normInX * normInX + normInZ * normInZ) || 1;
  addQuad(
    b3, b2, t2, t3,
    { x: normInX / lenIn, y: 0, z: normInZ / lenIn },
    { u: uStart, v: yMin },
    { u: uEnd, v: yMin },
    { u: uEnd, v: yMax },
    { u: uStart, v: yMax }
  );

  // Mặt đầu (P4 -> P1, nhìn từ ngoài đầu: b0 -> b3 -> t3 -> t0)
  if (hasStartCap) {
    const normStartX = p1.z - p4.z;
    const normStartZ = -(p1.x - p4.x);
    const lenStart = Math.sqrt(normStartX * normStartX + normStartZ * normStartZ) || 1;
    addQuad(
      b0, b3, t3, t0,
      { x: normStartX / lenStart, y: 0, z: normStartZ / lenStart },
      { u: 0, v: yMin },
      { u: thickness, v: yMin },
      { u: thickness, v: yMax },
      { u: 0, v: yMax }
    );
  }

  // Mặt cuối (P2 -> P3, nhìn từ ngoài cuối: b2 -> b1 -> t1 -> t2)
  if (hasEndCap) {
    const normEndX = p3.z - p2.z;
    const normEndZ = -(p3.x - p2.x);
    const lenEnd = Math.sqrt(normEndX * normEndX + normEndZ * normEndZ) || 1;
    addQuad(
      b2, b1, t1, t2,
      { x: normEndX / lenEnd, y: 0, z: normEndZ / lenEnd },
      { u: 0, v: yMin },
      { u: thickness, v: yMin },
      { u: thickness, v: yMax },
      { u: 0, v: yMax }
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  return geo;
}

/**
 * Tạo một chuỗi BufferGeometries hoàn chỉnh cho đoạn tường có lỗ khoét cửa/cửa sổ.
 */
export function buildThickWallGeometries(seg, vertices, miterOffsets, openingsOnSeg = [], _wallGraph = null) {
  const corners = getSegmentQuadCorners(seg, vertices, miterOffsets);
  if (!corners) return [];

  const [p1, p2, p3, p4] = corners;
  const H = seg.height || 2.8;

  // Tính chiều dài đoạn tường thực tế
  const v1 = vertices[seg.v1];
  const v2 = vertices[seg.v2];
  const dx = (v2?.x ?? 0) - (v1?.x ?? 0);
  const dz = (v2?.z ?? 0) - (v1?.z ?? 0);
  const segLength = Math.sqrt(dx * dx + dz * dz) || 1;

  const wallHasStartCap = true;
  const wallHasEndCap = true;

  // Nếu không có cửa/cửa sổ, trả về 1 khối lăng trụ nguyên vẹn
  if (!openingsOnSeg || openingsOnSeg.length === 0) {
    const prism = createPrismGeometry(p1, p2, p3, p4, 0, H, wallHasStartCap, wallHasEndCap, segLength, 0, 1);
    return [prism];
  }

  // Nội suy điểm giữa 2 điểm pA và pB theo tỉ lệ t
  const lerpPoint = (pa, pb, t) => ({
    x: pa.x + (pb.x - pa.x) * t,
    z: pa.z + (pb.z - pa.z) * t,
  });

  const geos = [];

  // Sắp xếp openings theo u tăng dần
  const sortedOps = [...openingsOnSeg].sort((a, b) => (a.u ?? 0.5) - (b.u ?? 0.5));

  let currentU = 0;

  for (const op of sortedOps) {
    const halfW = (op.width || 0.9) / 2;
    const uSpan = halfW / segLength;
    const opU = Math.max(0, Math.min(1, op.u ?? 0.5));

    const uStart = Math.max(currentU, Math.max(0, opU - uSpan));
    const uEnd = Math.min(1, opU + uSpan);

    // 1. Khối tường trước cửa (nếu có khoảng trống)
    if (uStart > currentU + 0.005) {
      const q1 = lerpPoint(p1, p2, currentU);
      const q2 = lerpPoint(p1, p2, uStart);
      const q3 = lerpPoint(p4, p3, uStart);
      const q4 = lerpPoint(p4, p3, currentU);
      geos.push(createPrismGeometry(
        q1, q2, q3, q4,
        0, H,
        currentU === 0 ? wallHasStartCap : true,
        true,
        segLength, currentU, uStart
      ));
    }

    // 2. Khối đố trên cửa (từ uStart -> uEnd, cao từ đỉnh cửa -> trần)
    const opElev = op.elevation ?? (op.type === 'window' ? 0.9 : 0);
    const opHeight = op.height ?? (op.type === 'window' ? 1.2 : 2.1);
    const doorTop = opElev + opHeight;

    const opQ1 = lerpPoint(p1, p2, uStart);
    const opQ2 = lerpPoint(p1, p2, uEnd);
    const opQ3 = lerpPoint(p4, p3, uEnd);
    const opQ4 = lerpPoint(p4, p3, uStart);

    if (doorTop < H - 0.02) {
      geos.push(createPrismGeometry(
        opQ1, opQ2, opQ3, opQ4,
        doorTop, H,
        true, true,
        segLength, uStart, uEnd
      ));
    }

    // 3. Khối bậu tường dưới (chỉ dành cho cửa sổ, từ sàn 0 -> opElev)
    if (opElev > 0.05) {
      geos.push(createPrismGeometry(
        opQ1, opQ2, opQ3, opQ4,
        0, opElev,
        true, true,
        segLength, uStart, uEnd
      ));
    }

    currentU = uEnd;
  }

  // 4. Khối tường cuối cùng sau cửa cuối
  if (currentU < 0.995) {
    const q1 = lerpPoint(p1, p2, currentU);
    const q2 = p2;
    const q3 = p3;
    const q4 = lerpPoint(p4, p3, currentU);
    geos.push(createPrismGeometry(
      q1, q2, q3, q4,
      0, H,
      true, wallHasEndCap,
      segLength, currentU, 1
    ));
  }

  return geos;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Geometric Helpers & Raycast / Snapping
// ─────────────────────────────────────────────────────────────────────────────

export function getSegmentWorld(seg, vertices) {
  const v1 = vertices[seg.v1];
  const v2 = vertices[seg.v2];
  if (!v1 || !v2) return null;

  const dx = v2.x - v1.x;
  const dz = v2.z - v1.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.001) return null;

  const dirX = dx / len;
  const dirZ = dz / len;

  return {
    start: { x: v1.x, z: v1.z },
    end: { x: v2.x, z: v2.z },
    dir: { x: dirX, z: dirZ },
    normal: { x: -dirZ, z: dirX },
    length: len,
    thickness: seg.thickness ?? 0.15,
    height: seg.height ?? 2.8,
  };
}

export function projectPointOntoSegment(px, pz, seg, vertices) {
  const sw = getSegmentWorld(seg, vertices);
  if (!sw) return null;

  const apx = px - sw.start.x;
  const apz = pz - sw.start.z;
  const t = apx * sw.dir.x + apz * sw.dir.z;
  const u = Math.max(0, Math.min(1, t / sw.length));
  const projX = sw.start.x + u * sw.length * sw.dir.x;
  const projZ = sw.start.z + u * sw.length * sw.dir.z;
  const dist = Math.sqrt((px - projX) ** 2 + (pz - projZ) ** 2);

  return { u, t, projX, projZ, dist };
}

export function snapToNearestVertex(px, pz, vertices, snapRadius = 0.35, excludeId = null) {
  let best = null;
  let bestDist = snapRadius;

  for (const v of Object.values(vertices)) {
    if (v.id === excludeId) continue;
    const d = Math.sqrt((px - v.x) ** 2 + (pz - v.z) ** 2);
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }

  if (best) return { snappedX: best.x, snappedZ: best.z, snappedToId: best.id };
  return null;
}

export function snapWallAngle(x1, z1, x2, z2, snapDeg = 45) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.001) return { x: x2, z: z2 };

  const angleRad = Math.atan2(dz, dx);
  const snapRad = (snapDeg * Math.PI) / 180;
  const snapped = Math.round(angleRad / snapRad) * snapRad;

  return {
    x: x1 + Math.cos(snapped) * len,
    z: z1 + Math.sin(snapped) * len,
  };
}

export function getOpeningsForSegment(wallGraph, segId) {
  return Object.values(wallGraph.openings || {}).filter((op) => op.segmentId === segId);
}

export function clampOpeningU(opening, seg, vertices) {
  const sw = getSegmentWorld(seg, vertices);
  if (!sw) return opening.u;
  const halfW = (opening.width ?? 0.9) / 2;
  const minU = halfW / sw.length;
  const maxU = 1 - halfW / sw.length;
  return Math.max(minU, Math.min(maxU, opening.u ?? 0.5));
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Graph Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function addVertex(wallGraph, x, z) {
  const id = generateVertexId();
  return {
    ...wallGraph,
    vertices: { ...wallGraph.vertices, [id]: { id, x, z } },
  };
}

export function moveVertex(wallGraph, vertexId, x, z) {
  if (!wallGraph.vertices[vertexId]) return wallGraph;
  return {
    ...wallGraph,
    vertices: {
      ...wallGraph.vertices,
      [vertexId]: { ...wallGraph.vertices[vertexId], x, z },
    },
  };
}

export function addSegment(wallGraph, v1Id, v2Id, options = {}) {
  if (!wallGraph.vertices[v1Id] || !wallGraph.vertices[v2Id]) return wallGraph;
  const id = generateSegmentId();
  const seg = {
    id,
    v1: v1Id,
    v2: v2Id,
    thickness: options.thickness ?? 0.15,
    height: options.height ?? 2.8,
    materialId: options.materialId ?? 'wall-default',
    label: options.label ?? '',
  };
  return {
    ...wallGraph,
    segments: { ...wallGraph.segments, [id]: seg },
  };
}

export function removeSegment(wallGraph, segId) {
  const newSegments = { ...wallGraph.segments };
  delete newSegments[segId];

  const newOpenings = {};
  for (const [opId, op] of Object.entries(wallGraph.openings || {})) {
    if (op.segmentId !== segId) newOpenings[opId] = op;
  }

  return { ...wallGraph, segments: newSegments, openings: newOpenings };
}

export function removeVertex(wallGraph, vertexId) {
  const newVertices = { ...wallGraph.vertices };
  delete newVertices[vertexId];

  let result = { ...wallGraph, vertices: newVertices };
  for (const seg of Object.values(wallGraph.segments)) {
    if (seg.v1 === vertexId || seg.v2 === vertexId) {
      result = removeSegment(result, seg.id);
    }
  }

  return result;
}

/**
 * Thêm một nút tường mới trên một đoạn tường (cạnh V1 -> V2).
 * Xóa cạnh cũ, tạo đỉnh mới V_new, và tạo 2 cạnh mới: V1 -> V_new và V_new -> V2.
 * Giữ nguyên tính khép kín của phòng và chuyển các cửa/cửa sổ sang 2 đoạn mới.
 */
export function splitSegmentAtPoint(wallGraph, segId, clickX, clickZ) {
  const seg = wallGraph.segments[segId];
  if (!seg) return { wallGraph, newVertexId: null };

  const v1 = wallGraph.vertices[seg.v1];
  const v2 = wallGraph.vertices[seg.v2];
  if (!v1 || !v2) return { wallGraph, newVertexId: null };

  // Chiếu điểm click lên tim tường
  const proj = projectPointOntoSegment(clickX, clickZ, seg, wallGraph.vertices);
  const newX = proj ? proj.projX : (v1.x + v2.x) / 2;
  const newZ = proj ? proj.projZ : (v1.z + v2.z) / 2;

  // 1. Tạo đỉnh mới
  const newVId = generateVertexId();
  const newVertices = {
    ...wallGraph.vertices,
    [newVId]: { id: newVId, x: Number(newX.toFixed(3)), z: Number(newZ.toFixed(3)) },
  };

  // 2. Tạo 2 đoạn tường mới thay thế đoạn cũ
  const segAId = generateSegmentId();
  const segBId = generateSegmentId();

  const segA = {
    id: segAId,
    v1: seg.v1,
    v2: newVId,
    thickness: seg.thickness,
    height: seg.height,
    materialId: seg.materialId,
    label: seg.label ? `${seg.label} 1` : '',
  };

  const segB = {
    id: segBId,
    v1: newVId,
    v2: seg.v2,
    thickness: seg.thickness,
    height: seg.height,
    materialId: seg.materialId,
    label: seg.label ? `${seg.label} 2` : '',
  };

  const newSegments = { ...wallGraph.segments };
  delete newSegments[segId];
  newSegments[segAId] = segA;
  newSegments[segBId] = segB;

  // 3. Phân bổ các opening của đoạn cũ sang 2 đoạn mới
  const splitU = proj ? proj.u : 0.5;
  const newOpenings = { ...wallGraph.openings };

  for (const [opId, op] of Object.entries(wallGraph.openings || {})) {
    if (op.segmentId === segId) {
      if ((op.u ?? 0.5) <= splitU) {
        newOpenings[opId] = {
          ...op,
          segmentId: segAId,
          u: splitU > 0.001 ? Math.min(0.9, (op.u ?? 0.5) / splitU) : 0.5,
        };
      } else {
        newOpenings[opId] = {
          ...op,
          segmentId: segBId,
          u: (1 - splitU) > 0.001 ? Math.min(0.9, ((op.u ?? 0.5) - splitU) / (1 - splitU)) : 0.5,
        };
      }
    }
  }

  return {
    wallGraph: {
      vertices: newVertices,
      segments: newSegments,
      openings: newOpenings,
    },
    newVertexId: newVId,
  };
}

/**
 * Xóa một nút đỉnh tường và tự động nối 2 đoạn tường kề của nó lại với nhau.
 * Giúp phòng luôn luôn là một đa giác KHÉP KÍN!
 */
export function dissolveVertex(wallGraph, vertexId) {
  const { vertices, segments } = wallGraph;
  if (!vertices[vertexId]) return wallGraph;

  // Không cho xóa nếu chỉ còn 3 đỉnh (tam giác tối thiểu)
  if (Object.keys(vertices).length <= 3) return wallGraph;

  // Tìm 2 cạnh kề với đỉnh này
  const incoming = Object.values(segments).filter((s) => s.v2 === vertexId);
  const outgoing = Object.values(segments).filter((s) => s.v1 === vertexId);

  const newVertices = { ...vertices };
  delete newVertices[vertexId];

  const newSegments = { ...segments };

  if (incoming.length === 1 && outgoing.length === 1) {
    const inSeg = incoming[0];
    const outSeg = outgoing[0];

    delete newSegments[inSeg.id];
    delete newSegments[outSeg.id];

    // Tạo cạnh mới nối thẳng từ vPrev sang vNext
    const mergedSegId = generateSegmentId();
    newSegments[mergedSegId] = {
      id: mergedSegId,
      v1: inSeg.v1,
      v2: outSeg.v2,
      thickness: inSeg.thickness,
      height: inSeg.height,
      materialId: inSeg.materialId,
      label: inSeg.label || '',
    };
  } else {
    for (const seg of Object.values(segments)) {
      if (seg.v1 === vertexId || seg.v2 === vertexId) {
        delete newSegments[seg.id];
      }
    }
  }

  // Xóa các opening thuộc các cạnh đã bị xóa
  const newOpenings = {};
  for (const [opId, op] of Object.entries(wallGraph.openings || {})) {
    if (newSegments[op.segmentId]) {
      newOpenings[opId] = op;
    }
  }

  return {
    vertices: newVertices,
    segments: newSegments,
    openings: newOpenings,
  };
}

export function addOpening(wallGraph, opening) {
  const id = generateOpeningId();
  const isWindow = (opening.type || 'door') === 'window';
  const newOpening = {
    id,
    segmentId: opening.segmentId,
    u: opening.u ?? 0.5,
    type: opening.type ?? 'door',
    width: opening.width ?? (isWindow ? 1.2 : 0.9),
    height: opening.height ?? (isWindow ? 1.2 : 2.1),
    elevation: opening.elevation ?? (isWindow ? 0.9 : 0),
    windowStyle: opening.windowStyle ?? (isWindow ? 'sliding' : undefined),
    frameColor: opening.frameColor ?? (isWindow ? '#1e293b' : undefined),
    openAngle: opening.openAngle ?? (isWindow ? 0 : 75),
    swingDir: opening.swingDir ?? 'inward',
    swingSide: opening.swingSide ?? 'left',
  };
  return {
    ...wallGraph,
    openings: { ...(wallGraph.openings || {}), [id]: newOpening },
  };
}

export function removeOpening(wallGraph, openingId) {
  const newOpenings = { ...(wallGraph.openings || {}) };
  delete newOpenings[openingId];
  return { ...wallGraph, openings: newOpenings };
}

export function updateOpening(wallGraph, openingId, patch) {
  if (!wallGraph.openings?.[openingId]) return wallGraph;
  return {
    ...wallGraph,
    openings: {
      ...wallGraph.openings,
      [openingId]: { ...wallGraph.openings[openingId], ...patch },
    },
  };
}

/**
 * Kẹp biên vị trí đồ nội thất để không thể đi xuyên qua bất kỳ bức tường nào trong wallGraph
 */
export function clampItemInsideWallGraph(position, dimensions, rotY = 0, wallGraph) {
  if (!wallGraph?.segments || !wallGraph?.vertices) return position;

  let [px, py, pz] = position;
  const w = dimensions?.width || 1;
  const d = dimensions?.depth || 1;

  const cosR = Math.abs(Math.cos(rotY));
  const sinR = Math.abs(Math.sin(rotY));
  const halfExtentX = (w * cosR + d * sinR) / 2;
  const halfExtentZ = (w * sinR + d * cosR) / 2;

  // Lặp 2 lần để xử lý góc vuông giữa 2 tường
  for (let pass = 0; pass < 2; pass++) {
    for (const seg of Object.values(wallGraph.segments)) {
      const v1 = wallGraph.vertices[seg.v1];
      const v2 = wallGraph.vertices[seg.v2];
      if (!v1 || !v2) continue;

      const dx = v2.x - v1.x;
      const dz = v2.z - v1.z;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.001) continue;

      const ux = dx / len;
      const uz = dz / len;
      // Pháp tuyến tường
      const nx = -uz;
      const nz = ux;

      // Chiếu vector (P - V1) lên hướng tường
      const apx = px - v1.x;
      const apz = pz - v1.z;
      const proj = apx * ux + apz * uz;
      const t = Math.max(0, Math.min(len, proj));

      // Điểm gần nhất trên tim tường
      const qx = v1.x + t * ux;
      const qz = v1.z + t * uz;

      // Vector từ tim tường đến tâm vật thể
      const vx = px - qx;
      const vz = pz - qz;
      const dist = Math.sqrt(vx * vx + vz * vz);

      // Khoảng cách an toàn tối thiểu tính theo hướng chiếu
      const projRadius = Math.abs(halfExtentX * nx) + Math.abs(halfExtentZ * nz);
      const wallHalfThick = (seg.thickness || 0.15) / 2;
      const safeDist = wallHalfThick + projRadius + 0.01;

      if (dist < safeDist) {
        if (dist > 1e-4) {
          const push = safeDist - dist;
          px += (vx / dist) * push;
          pz += (vz / dist) * push;
        } else {
          // Nằm đúng tim tường: đẩy theo pháp tuyến
          px += nx * safeDist;
          pz += nz * safeDist;
        }
      }
    }
  }

  return [px, py, pz];
}

/**
 * Trả về 4 điểm góc của đoạn tường dạng polygon 2D phục vụ render SVG 2D CAD
 */
export function getWallPolygonPoints(seg, vertices) {
  const sw = getSegmentWorld(seg, vertices);
  if (!sw) return [];
  const halfT = (seg.thickness || 0.15) / 2;
  const p1 = { x: sw.start.x - sw.normal.x * halfT, z: sw.start.z - sw.normal.z * halfT };
  const p2 = { x: sw.end.x - sw.normal.x * halfT, z: sw.end.z - sw.normal.z * halfT };
  const p3 = { x: sw.end.x + sw.normal.x * halfT, z: sw.end.z + sw.normal.z * halfT };
  const p4 = { x: sw.start.x + sw.normal.x * halfT, z: sw.start.z + sw.normal.z * halfT };
  return [p1, p2, p3, p4];
}

/**
 * Tính toán toạ độ world và kích thước của opening (cửa/cửa sổ) trên đoạn tường
 */
export function getOpeningWorldTransform(op, seg, vertices) {
  const sw = getSegmentWorld(seg, vertices);
  if (!sw) return null;
  const u = Math.max(0, Math.min(1, op.u ?? 0.5));
  const cx = sw.start.x + u * (sw.end.x - sw.start.x);
  const cz = sw.start.z + u * (sw.end.z - sw.start.z);
  const width = op.width ?? (op.type === 'window' ? 1.2 : 0.9);
  const height = op.height ?? (op.type === 'window' ? 1.2 : 2.1);
  const elevation = op.elevation ?? (op.type === 'window' ? 0.9 : 0);
  const angleY = Math.atan2(-sw.dir.z, sw.dir.x);
  return { cx, cz, width, height, elevation, angleY };
}
