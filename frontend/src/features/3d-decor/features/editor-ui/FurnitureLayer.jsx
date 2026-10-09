/**
 * FurnitureLayer.jsx — Render đồ nội thất trong SVG 2D với khả năng kéo thả
 *
 * Mỗi item được render dưới dạng:
 *   - Hình chữ nhật có màu, góc bo
 *   - Mũi tên hướng mặt trước
 *   - Nhãn tên
 *   - Khi selected: viền xanh đậm
 *
 * Kéo thả: Pointer events trực tiếp trên SVG → updateItemTransform → đồng bộ 3D
 */
import React, { useRef, useCallback, useMemo } from 'react';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { clampItemInsideWallGraph } from '../room/wallGraphUtils';
import {
  isItemPlaceableOnSurface,
  findSupportingSurface,
  checkCollisionOBB2D,
  isItemColliding,
  snapWallItemTransform,
} from '../collision/collisionResolver';
import { useTopViewImage } from '../catalog/topViewRegistry';

function FurnitureCADSymbol({
  item,
  w,
  d,
  centerX,
  centerY,
  fillColor,
  isSelected,
  isCollidingWithSelected,
  hasCollision,
}) {
  const type = item.modelType || 'decor';
  const x0 = centerX - w / 2;
  const y0 = centerY - d / 2;
  const isDanger = isCollidingWithSelected || (isSelected && hasCollision);
  const strokeColor = isDanger ? '#ef4444' : isSelected ? '#60a5fa' : '#0f172a';
  const strokeW = isDanger ? 2.2 : isSelected ? 2.0 : 1.2;

  // 1. Chậu cây cảnh: Chậu tròn + các tán lá xanh xòe ra
  if (type === 'plant') {
    const r = Math.min(w, d) / 2;
    const leafAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
      <g>
        {/* Tán lá xanh */}
        {leafAngles.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const lx = centerX + Math.cos(rad) * (r * 0.45);
          const ly = centerY + Math.sin(rad) * (r * 0.45);
          return (
            <ellipse
              key={angle}
              cx={lx}
              cy={ly}
              rx={r * 0.38}
              ry={r * 0.16}
              transform={`rotate(${angle}, ${lx}, ${ly})`}
              fill="#16a34a"
              stroke="#14532d"
              strokeWidth={0.8}
            />
          );
        })}
        {/* Miệng chậu cây */}
        <circle
          cx={centerX}
          cy={centerY}
          r={r * 0.52}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Đất trong chậu */}
        <circle
          cx={centerX}
          cy={centerY}
          r={r * 0.32}
          fill="#78350f"
          stroke="#451a03"
          strokeWidth={0.8}
        />
      </g>
    );
  }

  // 2. Đèn chiếu sáng: Chân đế tròn + chao đèn + tâm phát sáng
  if (type === 'lamp') {
    const r = Math.min(w, d) / 2;
    const isOn = item.isLightOn !== false;
    return (
      <g>
        {/* Chân đế đèn */}
        <circle
          cx={centerX}
          cy={centerY}
          r={r * 0.9}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Vành chao đèn */}
        <circle
          cx={centerX}
          cy={centerY}
          r={r * 0.65}
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={1}
          strokeDasharray="3 2"
        />
        {/* Đốm sáng bóng đèn ở tâm */}
        <circle
          cx={centerX}
          cy={centerY}
          r={Math.max(4, r * 0.28)}
          fill={isOn ? '#fef08a' : '#64748b'}
          stroke={isOn ? '#ca8a04' : '#334155'}
          strokeWidth={1}
        />
      </g>
    );
  }

  // 3. Laptop / Máy tính làm việc trên bàn
  if (item.catalogId?.includes('laptop') || type === 'laptop') {
    const kbH = Math.max(6, d * 0.55);
    const screenH = Math.max(4, d * 0.38);
    return (
      <g>
        {/* Màn hình nghiêng góc (phía sau / -Z / cạnh trên) */}
        <rect
          x={x0 + 1}
          y={y0}
          width={Math.max(6, w - 2)}
          height={screenH}
          rx={1.5}
          fill="#0f172a"
          stroke={isDanger ? '#ef4444' : '#38bdf8'}
          strokeWidth={0.8}
        />
        {/* Thân máy & Bàn phím (phía trước / +Z / cạnh dưới) */}
        <rect
          x={x0}
          y={y0 + screenH + 1}
          width={w}
          height={kbH}
          rx={2}
          fill="#334155"
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Vùng phím gõ */}
        {w >= 14 && (
          <rect
            x={x0 + 2}
            y={y0 + screenH + 2}
            width={w - 4}
            height={kbH * 0.52}
            rx={1}
            fill="#1e293b"
          />
        )}
        {/* Touchpad */}
        {w >= 14 && (
          <rect
            x={centerX - Math.min(5, w * 0.18)}
            y={y0 + screenH + kbH * 0.62}
            width={Math.min(10, w * 0.36)}
            height={Math.max(2, kbH * 0.28)}
            rx={0.5}
            fill="#475569"
          />
        )}
      </g>
    );
  }

  // 4. Tivi màn hình phẳng / Màn hình hiển thị
  if (item.catalogId?.includes('tv') || type === 'tv') {
    const screenThick = Math.max(3, d * 0.35);
    const standW = Math.min(w * 0.45, 24);
    return (
      <g>
        {/* Chân đế Tivi */}
        <rect
          x={centerX - standW / 2}
          y={y0 + d * 0.15}
          width={standW}
          height={d * 0.7}
          rx={2}
          fill="#475569"
        />
        {/* Thân viền màn hình phẳng */}
        <rect
          x={x0}
          y={centerY - screenThick / 2}
          width={w}
          height={screenThick}
          rx={1.5}
          fill="#0f172a"
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Vệt bóng phản chiếu trên mặt kính màn hình */}
        <line
          x1={x0 + 4}
          y1={centerY}
          x2={x0 + w - 4}
          y2={centerY}
          stroke={isDanger ? '#ef4444' : '#38bdf8'}
          strokeWidth={1}
          strokeOpacity={0.7}
        />
      </g>
    );
  }

  // 5. Thảm trải sàn (Rug)
  if (type === 'rug') {
    return (
      <g>
        <rect
          x={x0}
          y={y0}
          width={w}
          height={d}
          rx={6}
          fill={fillColor}
          fillOpacity={0.4}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray="4 2"
        />
        {/* Vệt viền tua rua 2 đầu thảm */}
        <line
          x1={x0 + 3}
          y1={y0 + 3}
          x2={x0 + w - 3}
          y2={y0 + 3}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
        <line
          x1={x0 + 3}
          y1={y0 + d - 3}
          x2={x0 + w - 3}
          y2={y0 + d - 3}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </g>
    );
  }

  // 6. Sofa & Ghế nệm: Thân nệm + Lưng tựa + 2 Tay vịn + Vạch đệm
  if (type === 'seating' || type === 'armchair' || type === 'sofa' || type === 'chair') {
    const backH = Math.max(5, d * 0.26);
    const armW = Math.max(4, w * 0.14);
    return (
      <g>
        {/* Thân chính nệm sofa */}
        <rect
          x={x0}
          y={y0}
          width={w}
          height={d}
          rx={6}
          fill={fillColor}
          fillOpacity={0.9}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Lưng tựa phía sau (-Z, cạnh trên) */}
        <rect
          x={x0 + 3}
          y={y0 + 3}
          width={w - 6}
          height={backH}
          rx={3}
          fill="#000000"
          fillOpacity={0.25}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={0.8}
        />
        {/* 2 Tay vịn 2 bên */}
        {w >= 30 && (
          <>
            <rect
              x={x0 + 2}
              y={y0 + 3}
              width={armW}
              height={d - 6}
              rx={3}
              fill="#000000"
              fillOpacity={0.2}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={0.8}
            />
            <rect
              x={x0 + w - armW - 2}
              y={y0 + 3}
              width={armW}
              height={d - 6}
              rx={3}
              fill="#000000"
              fillOpacity={0.2}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={0.8}
            />
          </>
        )}
        {/* Vạch chia đệm nệm ngồi */}
        {w >= 50 && (
          <line
            x1={centerX}
            y1={y0 + backH + 4}
            x2={centerX}
            y2={y0 + d - 5}
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        )}
      </g>
    );
  }

  // 7. Giường ngủ: Khung giường + Đầu giường + 2 Gối nằm + Nếp gấp chăn
  if (type === 'bed') {
    const headH = Math.max(5, d * 0.14);
    const pillowW = (w - 14) / 2;
    const pillowH = Math.max(7, d * 0.2);
    const quiltY = y0 + headH + pillowH + 8;
    return (
      <g>
        {/* Khung giường */}
        <rect
          x={x0}
          y={y0}
          width={w}
          height={d}
          rx={5}
          fill={fillColor}
          fillOpacity={0.88}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Đầu giường (Headboard) */}
        <rect
          x={x0 + 2}
          y={y0 + 2}
          width={w - 4}
          height={headH}
          rx={2}
          fill="#000000"
          fillOpacity={0.35}
        />
        {/* 2 Gối nằm màu trắng */}
        {w >= 30 && d >= 30 && (
          <>
            <rect
              x={x0 + 4}
              y={y0 + headH + 4}
              width={pillowW}
              height={pillowH}
              rx={4}
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth={0.8}
            />
            <rect
              x={x0 + 10 + pillowW}
              y={y0 + headH + 4}
              width={pillowW}
              height={pillowH}
              rx={4}
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth={0.8}
            />
          </>
        )}
        {/* Nếp gấp chăn ga */}
        {d >= 40 && (
          <>
            <line
              x1={x0 + 4}
              y1={quiltY}
              x2={x0 + w - 4}
              y2={quiltY}
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth={1.5}
            />
            <path
              d={`M ${x0 + 6} ${quiltY} Q ${centerX} ${quiltY + 4} ${x0 + w - 6} ${quiltY}`}
              fill="none"
              stroke="rgba(0, 0, 0, 0.2)"
              strokeWidth={1}
            />
          </>
        )}
      </g>
    );
  }

  // 8. Bàn: Mặt bàn bo góc + Viền vát trong
  if (type === 'table' || type === 'desk') {
    return (
      <g>
        <rect
          x={x0}
          y={y0}
          width={w}
          height={d}
          rx={6}
          fill={fillColor}
          fillOpacity={0.88}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Viền vát trong */}
        {w >= 26 && d >= 26 && (
          <rect
            x={x0 + 4}
            y={y0 + 4}
            width={w - 8}
            height={d - 8}
            rx={4}
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth={1}
          />
        )}
      </g>
    );
  }

  // 9. Tủ kệ / Lưu trữ: Khung bo + Vạch ngăn kéo + Tay nắm
  if (type === 'storage' || type === 'cabinet' || type === 'shelf' || type === 'tv-stand') {
    return (
      <g>
        <rect
          x={x0}
          y={y0}
          width={w}
          height={d}
          rx={4}
          fill={fillColor}
          fillOpacity={0.9}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Vạch chia ngăn kéo */}
        <line
          x1={x0 + 4}
          y1={centerY}
          x2={x0 + w - 4}
          y2={centerY}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth={1.2}
        />
        {/* Tay nắm ngăn kéo */}
        {w >= 20 && (
          <>
            <line
              x1={centerX - 6}
              y1={y0 + d * 0.26}
              x2={centerX + 6}
              y2={y0 + d * 0.26}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <line
              x1={centerX - 6}
              y1={y0 + d * 0.74}
              x2={centerX + 6}
              y2={y0 + d * 0.74}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </>
        )}
      </g>
    );
  }

  // 10. Thiết bị bếp / Bồn rửa / Nhà tắm
  if (
    type === 'kitchen' ||
    type === 'appliance' ||
    type === 'bathroom' ||
    item.name?.toLowerCase().includes('bếp') ||
    item.name?.toLowerCase().includes('chậu') ||
    item.name?.toLowerCase().includes('bồn')
  ) {
    return (
      <g>
        <rect
          x={x0}
          y={y0}
          width={w}
          height={d}
          rx={4}
          fill={fillColor}
          fillOpacity={0.9}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Lòng chậu rửa hoặc bếp nấu */}
        <rect
          x={x0 + 4}
          y={y0 + 4}
          width={w - 8}
          height={d - 8}
          rx={3}
          fill="#000000"
          fillOpacity={0.15}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={1}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={Math.min(w, d) * 0.18}
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={1.2}
        />
      </g>
    );
  }

  // 11. Đồ gắn tường (Tranh, Gương, Kệ treo)
  if (item.mountType === 'wall') {
    return (
      <g>
        <rect
          x={x0}
          y={y0}
          width={w}
          height={d}
          rx={2}
          fill={fillColor}
          fillOpacity={0.95}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Vạch kẻ tượng trưng mặt tranh / gương */}
        <line
          x1={x0 + 3}
          y1={y0 + 2}
          x2={x0 + w - 3}
          y2={y0 + d - 2}
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={1}
        />
      </g>
    );
  }

  // 12. Mặc định
  return (
    <rect
      x={x0}
      y={y0}
      width={w}
      height={d}
      rx={4}
      fill={fillColor}
      fillOpacity={0.88}
      stroke={strokeColor}
      strokeWidth={strokeW}
    />
  );
}

// ─── Một item đồ nội thất ────────────────────────────────────────────────────
function FurnitureItem2D({ item, toSvgX, toSvgY, toWorldX, toWorldZ, scale, svgRef }) {
  const selectedItemId = useSceneStore((s) => s.selectedItemId);
  const selectItem = useSceneStore((s) => s.selectItem);
  const updateItemTransform = useSceneStore((s) => s.updateItemTransform);
  const commitTransform = useSceneStore((s) => s.commitTransform);
  const wallGraph = useSceneStore((s) => s.wallGraph);
  const room = useSceneStore((s) => s.room);
  const items = useSceneStore((s) => s.items);
  const gridSnap = useEditorStore((s) => s.gridSnap);
  const snapStep = useEditorStore((s) => s.snapStep || 0.25);
  const mode = useEditorStore((s) => s.floorPlan2DMode);
  const floorPlan2DRenderMode = useEditorStore((s) => s.floorPlan2DRenderMode || 'ortho');

  const imageUrl = useTopViewImage(item, floorPlan2DRenderMode);

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, z: 0 });

  const isSelected = selectedItemId === item.instanceId;
  const isWallMounted = item.mountType === 'wall';

  // Va chạm SAT OBB 2D
  const selectedItem = useMemo(
    () => items.find((it) => it.instanceId === selectedItemId),
    [items, selectedItemId]
  );
  const isCollidingWithSelected = useMemo(
    () => !isSelected && !!selectedItem && checkCollisionOBB2D(item, selectedItem),
    [isSelected, selectedItem, item]
  );
  const hasCollision = useMemo(
    () => isSelected && isItemColliding(item, items),
    [isSelected, item, items]
  );

  const posX = item.position[0];
  const posZ = item.position[2];
  // SVG Y hướng xuống (+Y down), Three.js quay quanh +Y ngược chiều kim đồng hồ
  // Cần đảo dấu (-item.rotation[1]) để hướng xoay và mặt trước ăn khớp 100% với 3D
  const rotY = (-item.rotation[1] * 180) / Math.PI;

  const w = item.dimensions.width * scale;
  const d = item.dimensions.depth * scale;
  const centerX = toSvgX(posX);
  const centerY = toSvgY(posZ);
  const x0 = centerX - w / 2;
  const y0 = centerY - d / 2;

  // Màu fill
  const fillColor = item.modelType === 'lamp'
    ? (item.isLightOn !== false ? '#f59e0b' : '#475569')
    : (item.color || '#3b82f6');

  // ── Pointer drag ──────────────────────────────────────────────────────────
  const getSvgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const svgScaleX = vb.width / rect.width;
    const svgScaleY = vb.height / rect.height;
    const svgX = (e.clientX - rect.left) * svgScaleX + vb.x;
    const svgY = (e.clientY - rect.top) * svgScaleY + vb.y;
    return { svgX, svgY };
  }, [svgRef]);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    if (mode !== 'select' && mode !== 'move') return;
    e.stopPropagation();
    selectItem(item.instanceId);

    const pt = getSvgPoint(e);
    if (!pt) return;

    dragOffset.current = {
      x: pt.svgX - centerX,
      z: pt.svgY - centerY,
    };

    isDragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    e.stopPropagation();

    const pt = getSvgPoint(e);
    if (!pt) return;

    let rawWorldX = toWorldX(pt.svgX - dragOffset.current.x);
    let rawWorldZ = toWorldZ(pt.svgY - dragOffset.current.z);

    if (isWallMounted) {
      // Kéo trượt đồ treo tường áp sát mặt trong tường (Inner Surface)
      const snap = snapWallItemTransform(
        [rawWorldX, item.position[1], rawWorldZ],
        item.dimensions,
        room,
        item.position[1],
        item.wallId || null,
        wallGraph
      );
      const prevX = item.position[0];
      const prevZ = item.position[2];
      if (Math.abs(snap.position[0] - prevX) > 0.001 || Math.abs(snap.position[2] - prevZ) > 0.001) {
        updateItemTransform(item.instanceId, {
          position: snap.position,
          rotation: snap.rotation,
          wallId: snap.wallId,
          wallU: snap.wallU,
          wallT: snap.wallT,
          elevation: snap.elevation,
        });
      }
      return;
    }

    if (gridSnap) {
      rawWorldX = Math.round(rawWorldX / snapStep) * snapStep;
      rawWorldZ = Math.round(rawWorldZ / snapStep) * snapStep;
    }

    const [clampedX, , clampedZ] = clampItemInsideWallGraph(
      [rawWorldX, item.position[1], rawWorldZ],
      item.dimensions,
      item.rotation[1],
      wallGraph
    );

    let nextY = 0;
    let newAttachedTo = null;

    if (isItemPlaceableOnSurface(item)) {
      const surface = findSupportingSurface(
        [clampedX, 0, clampedZ],
        item.dimensions,
        items,
        item.instanceId
      );
      if (surface) {
        nextY = surface.surfaceY;
        newAttachedTo = surface.hostItem.instanceId;
      }
    }

    const prevX = item.position[0];
    const prevY = item.position[1];
    const prevZ = item.position[2];
    if (
      Math.abs(clampedX - prevX) > 0.001 ||
      Math.abs(nextY - prevY) > 0.001 ||
      Math.abs(clampedZ - prevZ) > 0.001
    ) {
      updateItemTransform(item.instanceId, {
        position: [clampedX, nextY, clampedZ],
        rotation: item.rotation,
        attachedTo: newAttachedTo,
      });
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // fallback
    }
    commitTransform();
  };

  // Nút xoay nhanh 45 độ khi click handle
  const handleQuickRotate = (e) => {
    e.stopPropagation();
    const newRotY = (item.rotation[1] || 0) + Math.PI / 4;
    updateItemTransform(item.instanceId, {
      rotation: [item.rotation[0], newRotY, item.rotation[2]],
    });
    commitTransform();
  };

  const isDanger = isCollidingWithSelected || (isSelected && hasCollision);

  return (
    <g
      transform={`rotate(${rotY}, ${centerX}, ${centerY})`}
      onClick={(e) => { e.stopPropagation(); selectItem(item.instanceId); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      style={{ cursor: mode === 'select' || mode === 'move' ? 'grab' : 'default' }}
    >
      {/* Khung Bounding Box CAD khi Selected hoặc khi Va chạm */}
      {(isSelected || isCollidingWithSelected) && (
        <g className="bounding-box-group pointer-events-none">
          {/* Vùng đệm bao quanh có màu highlight */}
          <rect
            x={x0 - 4}
            y={y0 - 4}
            width={w + 8}
            height={d + 8}
            rx={4}
            fill={isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.08)'}
            stroke={isDanger ? '#ef4444' : '#3b82f6'}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />

          {/* 4 góc L-shaped CAD bracket handles */}
          {(() => {
            const pad = 4;
            const bx = x0 - pad;
            const by = y0 - pad;
            const bw = w + pad * 2;
            const bd = d + pad * 2;
            const arm = Math.min(8, bw * 0.25, bd * 0.25);
            const cornerColor = isDanger ? '#ef4444' : '#3b82f6';
            return (
              <g stroke={cornerColor} strokeWidth={2} strokeLinecap="round" fill="none">
                <path d={`M ${bx} ${by + arm} L ${bx} ${by} L ${bx + arm} ${by}`} />
                <path d={`M ${bx + bw - arm} ${by} L ${bx + bw} ${by} L ${bx + bw} ${by + arm}`} />
                <path d={`M ${bx} ${by + bd - arm} L ${bx} ${by + bd} L ${bx + arm} ${by + bd}`} />
                <path d={`M ${bx + bw - arm} ${by + bd} L ${bx + bw} ${by + bd} L ${bx + bw} ${by + bd - arm}`} />
              </g>
            );
          })()}

          {/* Kích thước CAD và cảnh báo va chạm */}
          {isSelected && (
            <g transform={`translate(${centerX}, ${y0 + d + 16})`}>
              <rect
                x={-50}
                y={-9}
                width={100}
                height={18}
                rx={9}
                fill={isDanger ? '#ef4444' : '#1e293b'}
                fillOpacity={0.9}
              />
              <text
                x={0}
                y={3.5}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={9}
                fontWeight="600"
              >
                {isDanger ? ' Va chạm!' : `${item.dimensions.width.toFixed(2)}m × ${item.dimensions.depth.toFixed(2)}m`}
              </text>
            </g>
          )}
        </g>
      )}

      {/* Hình ảnh top-view: Ảnh 3D Orthographic hoặc Bản vẽ 2D CAD Texture */}
      {imageUrl ? (
        <image
          href={imageUrl}
          x={x0}
          y={y0}
          width={w}
          height={d}
          preserveAspectRatio="none"
          style={{
            filter: isDanger
              ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.95)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
              : isSelected
              ? 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.9)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
              : item.attachedTo
              ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.42)) drop-shadow(0 10px 20px rgba(0, 0, 0, 0.25))'
              : 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))',
          }}
        />
      ) : (
        /* Biểu tượng CAD kiến trúc chi tiết (fallback tức thời khi đang sinh ảnh) */
        <FurnitureCADSymbol
          item={item}
          w={w}
          d={d}
          centerX={centerX}
          centerY={centerY}
          fillColor={fillColor}
          isSelected={isSelected}
          isCollidingWithSelected={isCollidingWithSelected}
          hasCollision={hasCollision}
        />
      )}

      {/* Vạch mũi tên chỉ hướng mặt trước (+Z) - ẩn ở chế độ 3D Thực Tế (ortho) */}
      {floorPlan2DRenderMode !== 'ortho' && (
        <line
          x1={centerX - Math.min(14, w * 0.28)}
          y1={centerY + d / 2 - 3}
          x2={centerX + Math.min(14, w * 0.28)}
          y2={centerY + d / 2 - 3}
          stroke="#ffffff"
          strokeWidth={2}
          strokeOpacity={0.9}
          strokeLinecap="round"
        />
      )}

      {/* Nhãn tên - ẩn ở chế độ 3D Thực Tế (ortho) */}
      {floorPlan2DRenderMode !== 'ortho' && w >= 36 && (
        <text
          x={centerX}
          y={centerY + (item.modelType === 'plant' || item.modelType === 'lamp' ? d * 0.36 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(8, Math.min(11, w / 8))}
          fontWeight="600"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={0.5}
        >
          {item.name.length > 14 ? `${item.name.slice(0, 12)}…` : item.name}
        </text>
      )}

      {/* Nút xoay nhanh khi đang chọn */}
      {isSelected && !isWallMounted && (
        <g
          transform={`translate(${centerX}, ${y0 - 18})`}
          onClick={handleQuickRotate}
          style={{ cursor: 'pointer' }}
          title="Click để xoay 45°"
        >
          <circle r={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1.5} />
          <path
            d="M -3 -1 A 4 4 0 1 1 3 0"
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <polygon points="3,-2 5,0 1,0" fill="#ffffff" />
        </g>
      )}

      {/* Badge "W" cho đồ gắn tường */}
      {isWallMounted && (
        <g transform={`translate(${centerX + w / 2 - 5}, ${centerY - d / 2 + 5})`} title="Đồ gắn tường">
          <circle r={5} fill="#f59e0b" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize={6} fontWeight="bold" fill="#ffffff">W</text>
        </g>
      )}

      {/* Badge chấm xanh cho đồ đang đặt trên bề mặt khác */}
      {item.attachedTo && (
        <g transform={`translate(${centerX - w / 2 + 5}, ${centerY - d / 2 + 5})`} title="Đang đặt trên bề mặt">
          <circle r={4.5} fill="#10b981" stroke="#ffffff" strokeWidth={0.8} />
        </g>
      )}
    </g>
  );
}

// ─── Main FurnitureLayer ──────────────────────────────────────────────────────
export function FurnitureLayer({ toSvgX, toSvgY, toWorldX, toWorldZ, scale, svgRef }) {
  const items = useSceneStore((s) => s.items);

  // Sắp xếp thứ tự render SVG: Đồ sàn vẽ trước -> Đồ trên mặt bàn vẽ đè lên trên -> Đồ treo tường vẽ sau cùng
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const getOrder = (it) => {
        if (it.mountType === 'wall') return 2;
        if (it.attachedTo) return 1;
        return 0;
      };
      return getOrder(a) - getOrder(b);
    });
  }, [items]);

  return (
    <g className="furniture-layer">
      {sortedItems.map((item) => (
        <FurnitureItem2D
          key={item.instanceId}
          item={item}
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          toWorldX={toWorldX}
          toWorldZ={toWorldZ}
          scale={scale}
          svgRef={svgRef}
        />
      ))}
    </g>
  );
}
