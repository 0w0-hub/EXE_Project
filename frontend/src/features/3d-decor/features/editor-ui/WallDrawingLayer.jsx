/**
 * WallDrawingLayer.jsx — Layer preview khi đang vẽ đoạn tường mới
 *
 * Chỉ active khi floorPlan2DMode === 'draw-wall'.
 * Hiển thị:
 *   - Nét đứt từ điểm đầu đến cursor
 *   - Chiều dài preview theo real-time
 *   - Snap indicator khi cursor gần vertex đã có
 */
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';
import { snapWallAngle } from '../room/wallGraphUtils';

export function WallDrawingLayer({ toSvgX, toSvgY }) {
  const mode = useEditorStore((s) => s.floorPlan2DMode);
  const wallDrawingState = useEditorStore((s) => s.wallDrawingState);
  const wallGraph = useSceneStore((s) => s.wallGraph);

  if (mode !== 'draw-wall' || !wallDrawingState) return null;

  const { v1x, v1z, previewX, previewZ, shiftSnap, snapTargetId } = wallDrawingState;

  // Áp dụng snap góc nếu giữ Shift
  let endX = previewX;
  let endZ = previewZ;
  if (shiftSnap) {
    const snapped = snapWallAngle(v1x, v1z, previewX, previewZ, 45);
    endX = snapped.x;
    endZ = snapped.z;
  }

  const svgX1 = toSvgX(v1x);
  const svgY1 = toSvgY(v1z);
  const svgX2 = toSvgX(endX);
  const svgY2 = toSvgY(endZ);

  const dx = endX - v1x;
  const dz = endZ - v1z;
  const len = Math.sqrt(dx * dx + dz * dz);
  const midSvgX = (svgX1 + svgX2) / 2;
  const midSvgY = (svgY1 + svgY2) / 2;

  // Vertex snap target
  const snapVertex = snapTargetId ? wallGraph.vertices[snapTargetId] : null;

  return (
    <g className="wall-drawing-layer" style={{ pointerEvents: 'none' }}>
      {/* Điểm đầu (v1) */}
      <circle
        cx={svgX1}
        cy={svgY1}
        r={6}
        fill="#3b82f6"
        stroke="#60a5fa"
        strokeWidth={2}
      />

      {/* Nét đứt preview tường */}
      <line
        x1={svgX1}
        y1={svgY1}
        x2={svgX2}
        y2={svgY2}
        stroke="#3b82f6"
        strokeWidth={2.5}
        strokeDasharray="8,4"
        strokeLinecap="round"
      />

      {/* Điểm cuối (cursor) */}
      <circle
        cx={svgX2}
        cy={svgY2}
        r={snapVertex ? 8 : 5}
        fill={snapVertex ? '#10b981' : '#3b82f6'}
        stroke={snapVertex ? '#6ee7b7' : '#93c5fd'}
        strokeWidth={2}
      />

      {/* Label chiều dài */}
      {len > 0.05 && (
        <g transform={`translate(${midSvgX}, ${midSvgY})`}>
          <rect x={-22} y={-10} width={44} height={18} rx={4} fill="#1e293b" fillOpacity={0.85} />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontFamily="monospace"
            fill="#60a5fa"
            fontWeight="600"
          >
            {len.toFixed(2)}m
          </text>
        </g>
      )}

      {/* Snap indicator: khi sẽ merge vào vertex đã có */}
      {snapVertex && (
        <g>
          <circle
            cx={toSvgX(snapVertex.x)}
            cy={toSvgY(snapVertex.z)}
            r={12}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="4,2"
          />
          <text
            x={toSvgX(snapVertex.x)}
            y={toSvgY(snapVertex.z) - 16}
            textAnchor="middle"
            fontSize="9"
            fill="#10b981"
            fontFamily="monospace"
          >
            Khớp
          </text>
        </g>
      )}

      {/* Snap góc indicator */}
      {shiftSnap && (
        <text
          x={svgX2 + 10}
          y={svgY2 - 8}
          fontSize="9"
          fill="#f59e0b"
          fontFamily="monospace"
        >
          45°
        </text>
      )}
    </g>
  );
}
