/**
 * WallLayer.jsx — Render tất cả đoạn tường và cửa/cửa sổ trong SVG 2D
 *
 * Nhận vào:
 *   wallGraph     — từ useSceneStore
 *   toSvgX/toSvgY — hàm chuyển world coords → SVG pixel coords
 *   scale         — pixel/mét (để tính kích thước cửa)
 *   mode          — floorPlan2DMode (để highlight khi ở chế độ draw/delete)
 */
import React, { useMemo } from 'react';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';
import {
  getSegmentWorld,
  getWallPolygonPoints,
  getOpeningsForSegment,
  getOpeningWorldTransform,
} from '../room/wallGraphUtils';

// ─── Ký hiệu cửa đi CAD (Door symbol) ────────────────────────────────────────
function DoorSymbol({ opening, seg, vertices, toSvgX, toSvgY, scale, isSelected }) {
  const t = getOpeningWorldTransform(opening, seg, vertices);
  if (!t) return null;

  const sw = getSegmentWorld(seg, vertices);
  if (!sw) return null;

  // Tính vector hướng vào trong phòng thực tế (bảo đảm luôn hướng vào lòng phòng)
  const verts = Object.values(vertices);
  let meanX = 0;
  let meanZ = 0;
  for (const v of verts) {
    meanX += v.x;
    meanZ += v.z;
  }
  meanX /= (verts.length || 1);
  meanZ /= (verts.length || 1);

  // Vector từ tâm cửa tới tâm phòng
  const toCenterX = meanX - t.cx;
  const toCenterZ = meanZ - t.cz;
  const dotNormal = sw.normal.x * toCenterX + sw.normal.z * toCenterZ;
  // inNorm luôn hướng vào lòng phòng (inward)
  const inNormX = dotNormal >= 0 ? sw.normal.x : -sw.normal.x;
  const inNormZ = dotNormal >= 0 ? sw.normal.z : -sw.normal.z;

  // Tâm SVG của lỗ cửa
  const cx = toSvgX(t.cx);
  const cy = toSvgY(t.cz);
  const halfW = (t.width / 2) * scale;
  const thick = (seg.thickness ?? 0.15) * scale;
  const jambW = Math.max(3, 0.04 * scale); // đố khung cửa 4cm
  const panelThick = Math.max(3.5, 0.045 * scale); // cánh cửa dày 4.5cm

  // Điểm 2 đầu của lỗ cửa theo hướng tường (p1, p2)
  const p1x = cx - sw.dir.x * halfW;
  const p1y = cy - sw.dir.z * halfW;
  const p2x = cx + sw.dir.x * halfW;
  const p2y = cy + sw.dir.z * halfW;

  // Xác định bên trái và bên phải khi đứng trong phòng nhìn ra cửa:
  // Vector nhìn từ trong phòng ra cửa là (-inNormX, -inNormZ).
  // Trong hệ tọa độ SVG (+X sang phải, +Y xuống dưới), quay 90° ngược chiều kim đồng hồ (sang trái) là (-inNormZ, inNormX).
  const leftDirX = -inNormZ;
  const leftDirZ = inNormX;
  const p1IsLeft = (p1x - cx) * leftDirX + (p1y - cy) * leftDirZ >= 0;

  const leftPt = p1IsLeft ? { x: p1x, y: p1y } : { x: p2x, y: p2y };
  const rightPt = p1IsLeft ? { x: p2x, y: p2y } : { x: p1x, y: p1y };

  const isLeft = (opening.swingSide || 'left') !== 'right';
  const hinge = isLeft ? rightPt : leftPt;
  const latch = isLeft ? leftPt : rightPt;

  // Hướng mở cánh cửa:
  // swingDir === 'inward' (mặc định) => mở vào trong phòng (theo inNorm)
  // swingDir === 'outward' => mở ra ngoài phòng (ngược inNorm)
  const dirSign = opening.swingDir === 'outward' ? -1 : 1;
  const swingNormX = inNormX * dirSign;
  const swingNormZ = inNormZ * dirSign;

  const doorLen = t.width * scale;
  const doorEndX = hinge.x + swingNormX * doorLen;
  const doorEndY = hinge.y + swingNormZ * doorLen;

  const isOpen = (opening.openAngle ?? 75) > 0;
  const doorColor = isSelected ? '#60a5fa' : '#38bdf8';
  const jambColor = isSelected ? '#3b82f6' : '#64748b';

  // Tính sweepFlag cho cung tròn bằng tích có hướng 2D (Cross Product)
  const v1x = doorEndX - hinge.x;
  const v1y = doorEndY - hinge.y;
  const v2x = latch.x - hinge.x;
  const v2y = latch.y - hinge.y;
  const cross = v1x * v2y - v1y * v2x;
  const sweepFlag = cross > 0 ? 1 : 0;

  return (
    <g className="cad-door-symbol">
      {/* 1. Đố khung cửa 2 bên (Jambs) */}
      <line
        x1={p1x - inNormX * (thick / 2)}
        y1={p1y - inNormZ * (thick / 2)}
        x2={p1x + inNormX * (thick / 2)}
        y2={p1y + inNormZ * (thick / 2)}
        stroke={jambColor}
        strokeWidth={jambW}
        strokeLinecap="square"
      />
      <line
        x1={p2x - inNormX * (thick / 2)}
        y1={p2y - inNormZ * (thick / 2)}
        x2={p2x + inNormX * (thick / 2)}
        y2={p2y + inNormZ * (thick / 2)}
        stroke={jambColor}
        strokeWidth={jambW}
        strokeLinecap="square"
      />

      {/* 2. Cánh cửa khi đóng (openAngle === 0) */}
      {!isOpen ? (
        <g>
          {/* Cánh cửa dày dặn đóng khít giữa 2 đố cửa */}
          <line
            x1={p1x}
            y1={p1y}
            x2={p2x}
            y2={p2y}
            stroke={doorColor}
            strokeWidth={panelThick}
            strokeLinecap="round"
          />
          {/* Chốt tay nắm cửa ở giữa */}
          <circle cx={cx} cy={cy} r={2.5} fill="#ffffff" />
        </g>
      ) : (
        /* 3. Cánh cửa khi mở (openAngle > 0) */
        <g>
          {/* Vùng quét mở cửa mờ nhẹ (Clearance zone) */}
          <path
            d={`M ${hinge.x} ${hinge.y} L ${doorEndX} ${doorEndY} A ${doorLen} ${doorLen} 0 0 ${sweepFlag} ${latch.x} ${latch.y} Z`}
            fill={isSelected ? 'rgba(96, 165, 250, 0.15)' : 'rgba(56, 189, 248, 0.06)'}
            stroke="none"
          />

          {/* Cung xoay nét đứt rõ nét */}
          <path
            d={`M ${doorEndX} ${doorEndY} A ${doorLen} ${doorLen} 0 0 ${sweepFlag} ${latch.x} ${latch.y}`}
            fill="none"
            stroke={doorColor}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />

          {/* Cánh cửa dày 4.5cm dạng panel mở */}
          <line
            x1={hinge.x}
            y1={hinge.y}
            x2={doorEndX}
            y2={doorEndY}
            stroke={doorColor}
            strokeWidth={panelThick}
            strokeLinecap="round"
          />

          {/* Trục bản lề hình tròn */}
          <circle
            cx={hinge.x}
            cy={hinge.y}
            r={panelThick * 0.85}
            fill={doorColor}
            stroke="#ffffff"
            strokeWidth={1}
          />

          {/* Tay nắm cửa gần đầu mút cánh cửa */}
          <circle
            cx={hinge.x + swingNormX * (doorLen - Math.min(10, doorLen * 0.18))}
            cy={hinge.y + swingNormZ * (doorLen - Math.min(10, doorLen * 0.18))}
            r={2}
            fill="#ffffff"
          />
        </g>
      )}

      {/* 4. Hitbox trong suốt mở rộng 16px giúp nhấp chọn cực nhạy */}
      <rect
        x={Math.min(p1x, p2x, doorEndX) - 16}
        y={Math.min(p1y, p2y, doorEndY) - 16}
        width={Math.max(Math.abs(p2x - p1x), Math.abs(doorEndX - hinge.x)) + 32}
        height={Math.max(Math.abs(p2y - p1y), Math.abs(doorEndY - hinge.y)) + 32}
        fill="transparent"
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
}

// ─── Ký hiệu cửa sổ CAD (Window symbol — 3 đường song song + đố khung) ───────────
function WindowSymbol({ opening, seg, vertices, toSvgX, toSvgY, scale, isSelected }) {
  const t = getOpeningWorldTransform(opening, seg, vertices);
  if (!t) return null;

  const sw = getSegmentWorld(seg, vertices);
  if (!sw) return null;

  const cx = toSvgX(t.cx);
  const cy = toSvgY(t.cz);
  const halfW = (t.width / 2) * scale;
  const thick = (seg.thickness ?? 0.15) * scale;
  const jambW = Math.max(3, 0.04 * scale);

  // 2 đầu cửa sổ
  const p1x = cx - sw.dir.x * halfW;
  const p1y = cy - sw.dir.z * halfW;
  const p2x = cx + sw.dir.x * halfW;
  const p2y = cy + sw.dir.z * halfW;

  const windowColor = isSelected ? '#60a5fa' : '#38bdf8';
  const jambColor = isSelected ? '#3b82f6' : '#64748b';

  return (
    <g className="cad-window-symbol">
      {/* Đố khung 2 bên */}
      <line
        x1={p1x - sw.normal.x * (thick / 2)}
        y1={p1y - sw.normal.z * (thick / 2)}
        x2={p1x + sw.normal.x * (thick / 2)}
        y2={p1y + sw.normal.z * (thick / 2)}
        stroke={jambColor}
        strokeWidth={jambW}
      />
      <line
        x1={p2x - sw.normal.x * (thick / 2)}
        y1={p2y - sw.normal.z * (thick / 2)}
        x2={p2x + sw.normal.x * (thick / 2)}
        y2={p2y + sw.normal.z * (thick / 2)}
        stroke={jambColor}
        strokeWidth={jambW}
      />

      {/* Khung kính ngoài và trong */}
      <line
        x1={p1x - sw.normal.x * (thick * 0.38)}
        y1={p1y - sw.normal.z * (thick * 0.38)}
        x2={p2x - sw.normal.x * (thick * 0.38)}
        y2={p2y - sw.normal.z * (thick * 0.38)}
        stroke={jambColor}
        strokeWidth={1.5}
      />
      <line
        x1={p1x + sw.normal.x * (thick * 0.38)}
        y1={p1y + sw.normal.z * (thick * 0.38)}
        x2={p2x + sw.normal.x * (thick * 0.38)}
        y2={p2y + sw.normal.z * (thick * 0.38)}
        stroke={jambColor}
        strokeWidth={1.5}
      />

      {/* Mặt kính ở giữa */}
      <line
        x1={p1x}
        y1={p1y}
        x2={p2x}
        y2={p2y}
        stroke={windowColor}
        strokeWidth={2.5}
      />

      {/* Hitbox trong suốt */}
      <rect
        x={Math.min(p1x, p2x) - 12}
        y={Math.min(p1y, p2y) - 12}
        width={Math.abs(p2x - p1x) + 24}
        height={Math.abs(p2y - p1y) + 24}
        fill="transparent"
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
}

// ─── Một đoạn tường (polygon + hatching + openings) ──────────────────────────
function WallSegment({ seg, wallGraph, toSvgX, toSvgY, scale, bgColor }) {
  const selectedSegmentId = useSceneStore((s) => s.selectedSegmentId);
  const selectedOpeningId = useSceneStore((s) => s.selectedOpeningId);
  const selectSegment = useSceneStore((s) => s.selectSegment);
  const selectOpening = useSceneStore((s) => s.selectOpening);
  const mode = useEditorStore((s) => s.floorPlan2DMode);

  const sw = useMemo(() => getSegmentWorld(seg, wallGraph.vertices), [seg, wallGraph.vertices]);
  const openings = useMemo(() => getOpeningsForSegment(wallGraph, seg.id), [wallGraph, seg.id]);

  if (!sw) return null;

  const poly = getWallPolygonPoints(seg, wallGraph.vertices);
  const svgPoints = poly.map((p) => `${toSvgX(p.x)},${toSvgY(p.z)}`).join(' ');
  const isSelected = selectedSegmentId === seg.id;

  const handleSegmentClick = (e) => {
    if (mode === 'delete' || mode === 'place-door' || mode === 'place-window') return; // handled by parent SVG
    e.stopPropagation();
    selectSegment(isSelected ? null : seg.id);
  };

  // Tính 2 điểm đầu/cuối lỗ mở của opening để "khoét" tường bằng rect trắng
  const openingGaps = openings.map((op) => {
    const t = getOpeningWorldTransform(op, seg, wallGraph.vertices);
    if (!t) return null;
    const halfW = (t.width / 2) * scale;
    const thick = (sw.thickness + 0.02) * scale; // dư thêm 1px để che hoàn toàn
    const cx = toSvgX(t.cx);
    const cy = toSvgY(t.cz);
    return { op, cx, cy, halfW, thick, t };
  }).filter(Boolean);

  return (
    <g>
      {/* Thân tường — polygon có hatching */}
      <polygon
        points={svgPoints}
        fill="url(#wall-hatch)"
        stroke={isSelected ? '#3b82f6' : '#475569'}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeLinejoin="round"
        onClick={handleSegmentClick}
        style={{ cursor: mode === 'delete' ? 'no-drop' : 'pointer' }}
      />

      {/* Khoét lỗ opening bằng cách vẽ rect màu nền đè lên tường */}
      {openingGaps.map(({ op, cx, cy, halfW, thick }) => {
        const sw_ = getSegmentWorld(seg, wallGraph.vertices);
        if (!sw_) return null;
        // Tính 4 góc của lỗ opening (rotated theo hướng tường)
        const corners = [
          [cx - sw_.dir.x * halfW - sw_.normal.x * thick / 2,
           cy - sw_.dir.z * halfW - sw_.normal.z * thick / 2],
          [cx + sw_.dir.x * halfW - sw_.normal.x * thick / 2,
           cy + sw_.dir.z * halfW - sw_.normal.z * thick / 2],
          [cx + sw_.dir.x * halfW + sw_.normal.x * thick / 2,
           cy + sw_.dir.z * halfW + sw_.normal.z * thick / 2],
          [cx - sw_.dir.x * halfW + sw_.normal.x * thick / 2,
           cy - sw_.dir.z * halfW + sw_.normal.z * thick / 2],
        ];
        return (
          <polygon
            key={op.id}
            points={corners.map((c) => c.join(',')).join(' ')}
            fill={bgColor}
            stroke="none"
          />
        );
      })}

      {/* Render ký hiệu cửa / cửa sổ */}
      {openings.map((op) => {
        const isOpSelected = selectedOpeningId === op.id;
        const props = { opening: op, seg, vertices: wallGraph.vertices, toSvgX, toSvgY, scale, isSelected: isOpSelected };
        return (
          <g
            key={op.id}
            onClick={(e) => { e.stopPropagation(); selectOpening(isOpSelected ? null : op.id); }}
            style={{ cursor: 'pointer' }}
          >
            {op.type === 'door'
              ? <DoorSymbol {...props} />
              : <WindowSymbol {...props} />}
          </g>
        );
      })}

      {/* Nhãn tường (khi selected) */}
      {isSelected && seg.label && (
        <text
          x={toSvgX((wallGraph.vertices[seg.v1]?.x + wallGraph.vertices[seg.v2]?.x) / 2)}
          y={toSvgY((wallGraph.vertices[seg.v1]?.z + wallGraph.vertices[seg.v2]?.z) / 2) - 10}
          textAnchor="middle"
          fontSize="9"
          fill="#60a5fa"
          fontFamily="monospace"
        >
          {seg.label} ({sw.length.toFixed(2)}m)
        </text>
      )}
    </g>
  );
}

// ─── Vertex handle (đỉnh kéo được) ──────────────────────────────────────────
function VertexHandle({ vertex, toSvgX, toSvgY, toWorldX, toWorldZ, mode }) {
  const selectedVertexId = useSceneStore((s) => s.selectedVertexId);
  const selectVertex = useSceneStore((s) => s.selectVertex);
  const wgMoveVertex = useSceneStore((s) => s.wgMoveVertex);
  const wgCommitVertex = useSceneStore((s) => s.wgCommitVertex);
  const wgRemoveVertex = useSceneStore((s) => s.wgRemoveVertex);
  const gridSnap = useEditorStore((s) => s.gridSnap);
  const snapStep = useEditorStore((s) => s.snapStep || 0.25);

  const isSelected = selectedVertexId === vertex.id;
  const svgX = toSvgX(vertex.x);
  const svgY = toSvgY(vertex.z);

  // Kéo đỉnh tường
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    if (mode === 'delete') {
      e.stopPropagation();
      wgRemoveVertex(vertex.id);
      return;
    }
    if (mode !== 'select' && mode !== 'draw-wall') return;
    e.stopPropagation();
    selectVertex(vertex.id);

    const target = e.currentTarget;
    const pointerId = e.pointerId;
    try {
      target.setPointerCapture(pointerId);
    } catch {
      // fallback
    }

    const svg = target.closest('svg');
    if (!svg) return;

    const onMove = (moveE) => {
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const svgScaleX = vb.width / rect.width;
      const svgScaleY = vb.height / rect.height;
      const currentSvgX = (moveE.clientX - rect.left) * svgScaleX + vb.x;
      const currentSvgY = (moveE.clientY - rect.top) * svgScaleY + vb.y;

      let wx = toWorldX(currentSvgX);
      let wz = toWorldZ(currentSvgY);

      if (gridSnap) {
        wx = Math.round(wx / snapStep) * snapStep;
        wz = Math.round(wz / snapStep) * snapStep;
      }

      wgMoveVertex(vertex.id, Number(wx.toFixed(3)), Number(wz.toFixed(3)));
    };

    const cleanup = () => {
      wgCommitVertex();
      try {
        if (target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
      } catch {
        // ignore
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
      window.removeEventListener('pointercancel', cleanup);
      window.removeEventListener('blur', cleanup);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup);
    window.addEventListener('pointercancel', cleanup);
    window.addEventListener('blur', cleanup);
  };

  return (
    <circle
      cx={svgX}
      cy={svgY}
      r={mode === 'delete' ? 6 : isSelected ? 6 : 4}
      fill={mode === 'delete' ? '#ef4444' : isSelected ? '#3b82f6' : '#94a3b8'}
      stroke={isSelected ? '#60a5fa' : '#1e293b'}
      strokeWidth={1.5}
      style={{ cursor: mode === 'delete' ? 'no-drop' : 'grab' }}
      onPointerDown={handlePointerDown}
    />
  );
}

// ─── Main WallLayer component ─────────────────────────────────────────────────
export function WallLayer({ toSvgX, toSvgY, toWorldX, toWorldZ, scale, bgColor = '#0f172a' }) {
  const wallGraph = useSceneStore((s) => s.wallGraph);
  const mode = useEditorStore((s) => s.floorPlan2DMode);

  // Chỉ hiển thị vertex handles khi ở chế độ select, delete, hoặc draw-wall
  const showVertexHandles = mode === 'select' || mode === 'delete' || mode === 'draw-wall';

  return (
    <g className="wall-layer">
      {/* Render tất cả đoạn tường */}
      {Object.values(wallGraph.segments).map((seg) => (
        <WallSegment
          key={seg.id}
          seg={seg}
          wallGraph={wallGraph}
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          scale={scale}
          bgColor={bgColor}
        />
      ))}

      {/* Vertex handles — chỉ hiển thị khi ở chế độ liên quan */}
      {showVertexHandles && Object.values(wallGraph.vertices).map((v) => (
        <VertexHandle
          key={v.id}
          vertex={v}
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          toWorldX={toWorldX}
          toWorldZ={toWorldZ}
          mode={mode}
        />
      ))}
    </g>
  );
}

export { DoorSymbol, WindowSymbol };

