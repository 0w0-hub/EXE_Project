/**
 * FloorPlan2DView.jsx — Trình soạn thảo mặt bằng 2D CAD toàn màn hình (Full Screen)
 *
 * Tính năng:
 *   - SVG Canvas 100% Full Screen (100vw x 100vh), hỗ trợ Pan & Zoom vô hạn
 *   - Điều khiển tích hợp trực tiếp trên TopBar chung của ứng dụng
 *   - Căn giữa phòng tự động trên mọi độ phân giải màn hình
 *   - Zoom tập trung vào con trỏ chuột (Zoom to cursor)
 *   - Lưới CAD blueprint phủ toàn bộ không gian làm việc
 *   - WallLayer: Tường dầy chuẩn kiến trúc + Ký hiệu cửa đi/cửa sổ nhúng tường
 *   - FurnitureLayer: Kéo thả đồ nội thất chống giật lag, xoay đồ 45°
 *   - WallDrawingLayer: Vẽ và bẻ góc tường thời gian thực
 *   - Đường đo kích thước (Dimension lines) và thống kê diện tích
 *   - Xuất ảnh bản vẽ 2D độ nét cao (PNG)
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';
import {
  snapToNearestVertex,
  projectPointOntoSegment,
  getOpeningWorldTransform,
} from '../room/wallGraphUtils';
import { getFloorTextureCanvasDataUrl } from '../materials/textureGenerators';
import { FLOOR_MATERIALS } from '../../constants/roomDefaults';
import { WallLayer, DoorSymbol, WindowSymbol } from './WallLayer';
import { WallDrawingLayer } from './WallDrawingLayer';
import { FurnitureLayer } from './FurnitureLayer';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BASE_SCALE = 60;    // pixel / mét ở zoom = 1
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4.0;
const VERTEX_SNAP_RADIUS = 0.35; // mét
const WALL_CLICK_RADIUS = 0.35;  // mét — khoảng cách tối đa để click chọn tường

export function FloorPlan2DView() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [isPanningActive, setIsPanningActive] = useState(false);
  const [openingHoverPreview, setOpeningHoverPreview] = useState(null);

  // Kích thước thực tế của vùng hiển thị (được cập nhật qua ResizeObserver)
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  // Store selectors
  const room = useSceneStore((s) => s.room);
  const wallGraph = useSceneStore((s) => s.wallGraph);
  const items = useSceneStore((s) => s.items);
  const selectedItemId = useSceneStore((s) => s.selectedItemId);
  const selectedVertexId = useSceneStore((s) => s.selectedVertexId);
  const selectedSegmentId = useSceneStore((s) => s.selectedSegmentId);
  const selectedOpeningId = useSceneStore((s) => s.selectedOpeningId);
  const selectItem = useSceneStore((s) => s.selectItem);
  const clearWallSelection = useSceneStore((s) => s.clearWallSelection);
  const removeItem = useSceneStore((s) => s.removeItem);
  const updateItemTransform = useSceneStore((s) => s.updateItemTransform);
  const commitTransform = useSceneStore((s) => s.commitTransform);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);

  // Wall graph actions
  const wgAddVertex = useSceneStore((s) => s.wgAddVertex);
  const wgAddSegment = useSceneStore((s) => s.wgAddSegment);
  const wgAddOpening = useSceneStore((s) => s.wgAddOpening);
  const wgSplitSegment = useSceneStore((s) => s.wgSplitSegment);
  const wgRemoveVertex = useSceneStore((s) => s.wgRemoveVertex);
  const wgRemoveSegment = useSceneStore((s) => s.wgRemoveSegment);
  const wgRemoveOpening = useSceneStore((s) => s.wgRemoveOpening);
  const selectSegment = useSceneStore((s) => s.selectSegment);

  // Editor state
  const mode = useEditorStore((s) => s.floorPlan2DMode);
  const setMode = useEditorStore((s) => s.setFloorPlan2DMode);
  const wallDrawingState = useEditorStore((s) => s.wallDrawingState);
  const setWallDrawingState = useEditorStore((s) => s.setWallDrawingState);
  const viewport = useEditorStore((s) => s.floorPlan2DViewport);
  const updateViewport = useEditorStore((s) => s.updateFloorPlan2DViewport);
  const gridSnap = useEditorStore((s) => s.gridSnap);
  const toggleGridSnap = useEditorStore((s) => s.toggleGridSnap);
  const floorPlan2DRenderMode = useEditorStore((s) => s.floorPlan2DRenderMode);

  // Pattern texture sàn gỗ/gạch
  const floorPatternUrl = useMemo(() => {
    return getFloorTextureCanvasDataUrl(room.floorMaterialId || 'wood-straight', room.floorColor || '#d6c7b2');
  }, [room.floorMaterialId, room.floorColor]);

  // Pan state
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panZ: 0 });

  // ── Lắng nghe kích thước container thực tế ─────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Scale & Bounding Box của phòng ─────────────────────────────────────────
  const activeOpeningPreview = (mode === 'place-door' || mode === 'place-window') ? openingHoverPreview : null;
  const scale = BASE_SCALE * viewport.zoom;

  // Lấy kích thước mét thực tế của loại vật liệu sàn
  const floorMatDef = useMemo(() => {
    return FLOOR_MATERIALS.find((m) => m.id === room.floorMaterialId) || FLOOR_MATERIALS[0];
  }, [room.floorMaterialId]);

  const physW = floorMatDef.physicalWidth ?? 1.2;
  const physL = floorMatDef.physicalLength ?? 1.2;
  const userScale = room.floorRepeat || 1.0;

  // Kích thước lặp hoa văn SVG (pixel) = số pixel/m * kích thước thật (m) * tỷ lệ người dùng chọn
  const floorPatternSizeX = scale * physW * userScale;
  const floorPatternSizeY = scale * physL * userScale;

  const { graphCenterX, graphCenterZ, graphW, graphL } = useMemo(() => {
    const verts = Object.values(wallGraph.vertices);
    if (verts.length === 0) return { graphCenterX: 0, graphCenterZ: 0, graphW: room.width, graphL: room.length };
    const xs = verts.map((v) => v.x);
    const zs = verts.map((v) => v.z);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
    return {
      graphCenterX: (minX + maxX) / 2,
      graphCenterZ: (minZ + maxZ) / 2,
      graphW: maxX - minX,
      graphL: maxZ - minZ,
    };
  }, [wallGraph.vertices, room.width, room.length]);

  // ── Biến đổi tọa độ giữa Thế giới thực (mét) và Pixel màn hình ─────────────
  // Tâm phòng luôn được căn tại chính giữa màn hình (dimensions / 2) + pan offset
  const cx = dimensions.width / 2;
  const cy = dimensions.height / 2;

  // World (m) -> Screen SVG pixel
  const toSvgX = useCallback(
    (wx) => cx + (wx - graphCenterX) * scale + viewport.panX,
    [cx, graphCenterX, scale, viewport.panX]
  );

  const toSvgY = useCallback(
    (wz) => cy + (wz - graphCenterZ) * scale + viewport.panZ,
    [cy, graphCenterZ, scale, viewport.panZ]
  );

  // Screen SVG pixel -> World (m)
  const toWorldX = useCallback(
    (sx) => (sx - cx - viewport.panX) / scale + graphCenterX,
    [cx, graphCenterX, scale, viewport.panX]
  );

  const toWorldZ = useCallback(
    (sy) => (sy - cy - viewport.panZ) / scale + graphCenterZ,
    [cy, graphCenterZ, scale, viewport.panZ]
  );

  // ── Lấy toạ độ từ Pointer Event ───────────────────────────────────────────
  const getSvgCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      svgX: e.clientX - rect.left,
      svgY: e.clientY - rect.top,
    };
  }, []);

  const getWorldCoords = useCallback((e) => {
    const pt = getSvgCoords(e);
    if (!pt) return null;
    return { wx: toWorldX(pt.svgX), wz: toWorldZ(pt.svgY) };
  }, [getSvgCoords, toWorldX, toWorldZ]);

  // ── Zoom mượt mà hướng vào vị trí con trỏ chuột (Zoom to Cursor) ───────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * delta));
    if (Math.abs(newZoom - viewport.zoom) < 0.0001) return;

    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // Toạ độ world hiện tại dưới con trỏ
      const wx = (sx - cx - viewport.panX) / scale + graphCenterX;
      const wz = (sy - cy - viewport.panZ) / scale + graphCenterZ;

      // Tính pan mới để điểm world đó giữ nguyên vị trí pixel trên màn hình
      const newScale = BASE_SCALE * newZoom;
      const newPanX = sx - cx - (wx - graphCenterX) * newScale;
      const newPanZ = sy - cy - (wz - graphCenterZ) * newScale;

      updateViewport({ zoom: newZoom, panX: newPanX, panZ: newPanZ });
    } else {
      updateViewport({ zoom: newZoom });
    }
  }, [viewport.zoom, viewport.panX, viewport.panZ, cx, cy, scale, graphCenterX, graphCenterZ, updateViewport]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Pan di chuyển khung nhìn bằng chuột phải, chuột giữa hoặc Alt + click ──
  const handlePointerDownPan = useCallback((e) => {
    if (e.button === 2 || e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      setIsPanningActive(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: viewport.panX, panZ: viewport.panZ };
      e.preventDefault();
    }
  }, [viewport.panX, viewport.panZ]);

  // ── Click trên bản vẽ 2D ──────────────────────────────────────────────────
  const handleSvgClick = useCallback((e) => {
    if (e.button !== 0) return;
    if (isPanning.current) return;

    const world = getWorldCoords(e);
    if (!world) return;
    const { wx, wz } = world;

    if (mode === 'add-node') {
      let bestSeg = null;
      let bestDist = WALL_CLICK_RADIUS;
      let bestProj = null;

      for (const seg of Object.values(wallGraph.segments)) {
        const proj = projectPointOntoSegment(wx, wz, seg, wallGraph.vertices);
        if (proj && proj.dist < bestDist) {
          bestDist = proj.dist;
          bestSeg = seg;
          bestProj = proj;
        }
      }

      if (bestSeg && bestProj) {
        wgSplitSegment(bestSeg.id, bestProj.projX, bestProj.projZ);
        setMode('select');
      }
      return;
    }

    if (mode === 'draw-wall') {
      // Snap vertex hoặc snap grid
      const snapResult = snapToNearestVertex(wx, wz, wallGraph.vertices, VERTEX_SNAP_RADIUS);
      const finalX = snapResult ? snapResult.snappedX : (gridSnap ? Math.round(wx / 0.25) * 0.25 : wx);
      const finalZ = snapResult ? snapResult.snappedZ : (gridSnap ? Math.round(wz / 0.25) * 0.25 : wz);

      if (!wallDrawingState) {
        // Đặt điểm bắt đầu
        let v1Id;
        if (snapResult) {
          v1Id = snapResult.snappedToId;
        } else {
          wgAddVertex(finalX, finalZ);
          v1Id = Object.keys(useSceneStore.getState().wallGraph.vertices).pop();
        }
        setWallDrawingState({ v1Id, v1x: finalX, v1z: finalZ, previewX: finalX, previewZ: finalZ, shiftSnap: e.shiftKey });
      } else {
        // Hoàn thành đoạn tường
        const { v1Id } = wallDrawingState;
        let v2Id;
        if (snapResult) {
          v2Id = snapResult.snappedToId;
        } else {
          wgAddVertex(finalX, finalZ);
          v2Id = Object.keys(useSceneStore.getState().wallGraph.vertices).pop();
        }
        if (v1Id !== v2Id) {
          wgAddSegment(v1Id, v2Id);
        }
        setWallDrawingState({ v1Id: v2Id, v1x: finalX, v1z: finalZ, previewX: finalX, previewZ: finalZ, shiftSnap: false });
      }
      return;
    }

    if (mode === 'place-door' || mode === 'place-window') {
      if (openingHoverPreview) {
        wgAddOpening({
          segmentId: openingHoverPreview.segmentId,
          u: openingHoverPreview.u,
          type: openingHoverPreview.type,
        });
        selectSegment(openingHoverPreview.segmentId);
        setOpeningHoverPreview(null);
        return;
      }

      let bestSeg = null;
      let bestDist = WALL_CLICK_RADIUS;
      let bestU = 0.5;

      for (const seg of Object.values(wallGraph.segments)) {
        const proj = projectPointOntoSegment(wx, wz, seg, wallGraph.vertices);
        if (proj && proj.dist < bestDist) {
          bestDist = proj.dist;
          bestSeg = seg;
          bestU = proj.u;
        }
      }

      if (bestSeg) {
        wgAddOpening({
          segmentId: bestSeg.id,
          u: bestU,
          type: mode === 'place-door' ? 'door' : 'window',
        });
        selectSegment(bestSeg.id);
      }
      return;
    }

    if (mode === 'select') {
      selectItem(null);
      clearWallSelection();
    }
  }, [mode, wallGraph, wallDrawingState, gridSnap, getWorldCoords, wgAddVertex, wgAddSegment, wgAddOpening, wgSplitSegment, setMode, setWallDrawingState, selectItem, clearWallSelection, selectSegment, openingHoverPreview]);

  // ── Cập nhật nét vẽ preview hoặc panning khi di chuột ─────────────────────
  const handleSvgMouseMove = useCallback((e) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      updateViewport({ panX: panStart.current.panX + dx, panZ: panStart.current.panZ + dy });
      return;
    }

    if (mode === 'place-door' || mode === 'place-window') {
      const world = getWorldCoords(e);
      if (!world) {
        setOpeningHoverPreview(null);
        return;
      }
      let bestSeg = null;
      let bestDist = 0.8;
      let bestProj = null;

      for (const seg of Object.values(wallGraph.segments)) {
        const proj = projectPointOntoSegment(world.wx, world.wz, seg, wallGraph.vertices);
        if (proj && proj.dist < bestDist) {
          bestDist = proj.dist;
          bestSeg = seg;
          bestProj = proj;
        }
      }

      if (bestSeg && bestProj) {
        const width = mode === 'place-door' ? 0.9 : 1.2;
        const v1 = wallGraph.vertices[bestSeg.v1];
        const v2 = wallGraph.vertices[bestSeg.v2];
        const segLen = (v1 && v2) ? Math.hypot(v2.x - v1.x, v2.z - v1.z) : 1;
        const marginU = Math.min(0.45, (width / 2 + 0.08) / (segLen || 1));
        const clampedU = Math.max(marginU, Math.min(1 - marginU, bestProj.u));

        setOpeningHoverPreview({
          seg: bestSeg,
          segmentId: bestSeg.id,
          u: clampedU,
          type: mode === 'place-door' ? 'door' : 'window',
          width,
        });
      } else {
        setOpeningHoverPreview(null);
      }
      return;
    }

    if (mode !== 'draw-wall' || !wallDrawingState) return;

    const world = getWorldCoords(e);
    if (!world) return;
    let { wx, wz } = world;

    if (gridSnap) {
      wx = Math.round(wx / 0.25) * 0.25;
      wz = Math.round(wz / 0.25) * 0.25;
    }

    // Giữ Shift để khóa góc 45°
    if (e.shiftKey && wallDrawingState.v1x !== undefined) {
      const dx = wx - wallDrawingState.v1x;
      const dz = wz - wallDrawingState.v1z;
      const angle = Math.atan2(dz, dx);
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const dist = Math.hypot(dx, dz);
      wx = wallDrawingState.v1x + Math.cos(snappedAngle) * dist;
      wz = wallDrawingState.v1z + Math.sin(snappedAngle) * dist;
    }

    setWallDrawingState({
      ...wallDrawingState,
      previewX: wx,
      previewZ: wz,
      shiftSnap: e.shiftKey,
    });
  }, [mode, wallDrawingState, gridSnap, getWorldCoords, updateViewport, setWallDrawingState, wallGraph]);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
    setIsPanningActive(false);
  }, []);

  useEffect(() => {
    const onWindowPointerUp = (e) => {
      if (e.button === 2 || e.button === 1 || e.button === 0) {
        if (isPanning.current) {
          isPanning.current = false;
          setIsPanningActive(false);
        }
      }
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, []);

  // ── Phím tắt cục bộ khi thao tác trên 2D ──────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'Escape') {
        setWallDrawingState(null);
        setOpeningHoverPreview(null);
        setMode('select');
        selectItem(null);
        clearWallSelection();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId) {
          removeItem(selectedItemId);
        } else if (selectedVertexId) {
          wgRemoveVertex(selectedVertexId);
        } else if (selectedOpeningId) {
          wgRemoveOpening(selectedOpeningId);
        } else if (selectedSegmentId) {
          wgRemoveSegment(selectedSegmentId);
        }
      }
      if ((e.key === 'r' || e.key === 'R') && selectedItemId) {
        const item = items.find((i) => i.instanceId === selectedItemId);
        if (item && item.mountType !== 'wall') {
          const nextRot = (item.rotation[1] || 0) + Math.PI / 4;
          updateItemTransform(selectedItemId, { rotation: [item.rotation[0], nextRot, item.rotation[2]] });
          commitTransform();
        }
      }
      if (e.key === 's' || e.key === 'S') setMode('select');
      if (e.key === 'w' || e.key === 'W') setMode('draw-wall');
      if (e.key === 'a' || e.key === 'A') setMode('add-node');
      if (e.key === 'd' || e.key === 'D') setMode('place-door');
      if (e.key === 'n' || e.key === 'N') setMode('place-window');
      if (e.key === 'g' || e.key === 'G') toggleGridSnap();

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    mode,
    setMode,
    setWallDrawingState,
    undo,
    redo,
    selectedItemId,
    selectedVertexId,
    selectedOpeningId,
    selectedSegmentId,
    removeItem,
    wgRemoveVertex,
    wgRemoveOpening,
    wgRemoveSegment,
    items,
    updateItemTransform,
    commitTransform,
    selectItem,
    clearWallSelection,
    toggleGridSnap,
  ]);

  // ── Xuất file ảnh PNG bản vẽ 2D độ nét cao ────────────────────────────────
  const handleDownloadPng = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const pad = 80;
    const minX = toSvgX(graphCenterX - graphW / 2) - pad;
    const maxX = toSvgX(graphCenterX + graphW / 2) + pad;
    const minY = toSvgY(graphCenterZ - graphL / 2) - pad;
    const maxY = toSvgY(graphCenterZ + graphL / 2) + pad;
    const w = Math.max(200, maxX - minX);
    const h = Math.max(200, maxY - minY);

    const clone = svgEl.cloneNode(true);
    clone.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`);
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const exportScale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = w * exportScale;
      canvas.height = h * exportScale;
      const ctx = canvas.getContext('2d');
      ctx.scale(exportScale, exportScale);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `floor-plan-2d-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, [svgRef, toSvgX, toSvgY, graphCenterX, graphCenterZ, graphW, graphL]);

  // Lắng nghe sự kiện xuất file từ TopBar
  useEffect(() => {
    const onExport = () => handleDownloadPng();
    window.addEventListener('export-2d-floorplan-png', onExport);
    return () => window.removeEventListener('export-2d-floorplan-png', onExport);
  }, [handleDownloadPng]);

  // ── Chuỗi toạ độ mặt sàn phòng dạng polygon ────────────────────────────────
  const roomFloorPoints = useMemo(() => {
    const { vertices, segments } = wallGraph;
    const vList = Object.values(vertices);
    if (vList.length < 3) return null;
    const segList = Object.values(segments);
    const ordered = [];
    const visited = new Set();
    if (segList.length > 0) {
      let currentVId = segList[0].v1;
      for (let i = 0; i < segList.length; i++) {
        if (visited.has(currentVId)) break;
        const v = vertices[currentVId];
        if (v) {
          ordered.push(v);
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
    const pts = ordered.length >= 3 ? ordered : vList;
    return pts.map((p) => `${toSvgX(p.x)},${toSvgY(p.z)}`).join(' ');
  }, [wallGraph, toSvgX, toSvgY]);

  const areaM2 = (graphW * graphL).toFixed(1);

  // ── Con trỏ chuột theo mode ────────────────────────────────────────────────
  const svgCursor = {
    'select': 'default',
    'move': 'move',
    'draw-wall': 'crosshair',
    'add-node': 'crosshair',
    'place-door': 'cell',
    'place-window': 'cell',
    'delete': 'no-drop',
  }[mode] || 'default';

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-slate-950 text-slate-100 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Banner hướng dẫn nổi (Floating Instruction Pill) ─────────────── */}
      {mode !== 'select' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-blue-500/40 text-xs text-blue-300 shadow-xl pointer-events-none flex items-center gap-2">
          {mode === 'draw-wall' && (
            wallDrawingState
              ? '✏️ Click để đặt điểm cuối đoạn tường • Giữ Shift để khóa góc • Esc để hủy'
              : '✏️ Click vị trí bất kỳ để bắt đầu vẽ tường'
          )}
          {mode === 'add-node' && '➕ Click lên đoạn tường bất kỳ để thêm 1 nút mới bẻ góc'}
          {mode === 'place-door' && '🚪 Click vào đoạn tường để đặt cửa đi'}
          {mode === 'place-window' && '🪟 Click vào đoạn tường để đặt cửa sổ'}
          {mode === 'delete' && '🗑️ Click vào đỉnh tường hoặc đoạn tường để xóa'}
        </div>
      )}

      {/* ── Thẻ thống kê kích thước phòng góc dưới phải ────────────────────── */}
      <div className="absolute bottom-3 right-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
        <span>📐 {graphW.toFixed(1)}m × {graphL.toFixed(1)}m ({areaM2} m²)</span>
        <span>•</span>
        <span>{Object.keys(wallGraph.segments).length} đoạn tường</span>
        <span>•</span>
        <span>{Object.keys(wallGraph.openings).length} cửa</span>
      </div>

      {/* ── SVG Canvas toàn màn hình ──────────────────────────────────────── */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        width="100%"
        height="100%"
        className="w-full h-full block select-none"
        style={{ cursor: isPanningActive ? 'grabbing' : svgCursor }}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={handlePointerDownPan}
        onPointerMove={handleSvgMouseMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          handlePointerUp();
          setOpeningHoverPreview(null);
        }}
        onClick={handleSvgClick}
      >
        <defs>
          {/* Pattern Hatching tường */}
          <pattern id="wall-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#64748b" strokeWidth="1.5" />
          </pattern>
          {/* Lưới nhỏ 0.25m */}
          <pattern id="grid-minor" width={scale * 0.25} height={scale * 0.25} patternUnits="userSpaceOnUse">
            <path d={`M ${scale * 0.25} 0 L 0 0 0 ${scale * 0.25}`} fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          {/* Lưới lớn 1m — Căn chỉnh theo tâm phòng và offset pan */}
          <pattern
            id="grid-major"
            width={scale}
            height={scale}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${((cx - graphCenterX * scale + viewport.panX) % scale + scale) % scale}, ${((cy - graphCenterZ * scale + viewport.panZ) % scale + scale) % scale})`}
          >
            <rect width={scale} height={scale} fill="url(#grid-minor)" />
            <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#334155" strokeWidth="1" />
          </pattern>
          {/* Pattern Texture Sàn Nhà Thực Tế Chuẩn Vật Lý */}
          <pattern
            id="room-floor-texture"
            width={floorPatternSizeX}
            height={floorPatternSizeY}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${((cx - graphCenterX * scale + viewport.panX) % floorPatternSizeX + floorPatternSizeX) % floorPatternSizeX}, ${((cy - graphCenterZ * scale + viewport.panZ) % floorPatternSizeY + floorPatternSizeY) % floorPatternSizeY})`}
          >
            <image
              href={floorPatternUrl}
              width={floorPatternSizeX}
              height={floorPatternSizeY}
              preserveAspectRatio="none"
            />
          </pattern>
        </defs>

        {/* Nền CAD Grid vô hạn toàn màn hình */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-major)" />

        {/* Mặt sàn phòng */}
        {roomFloorPoints ? (
          <polygon
            points={roomFloorPoints}
            fill={floorPlan2DRenderMode === 'ortho' ? 'url(#room-floor-texture)' : '#090d16'}
            stroke={floorPlan2DRenderMode === 'ortho' ? '#475569' : '#2563eb'}
            strokeWidth={floorPlan2DRenderMode === 'ortho' ? 1.5 : 1}
            strokeDasharray={floorPlan2DRenderMode === 'ortho' ? undefined : '4 4'}
            strokeOpacity={floorPlan2DRenderMode === 'ortho' ? 0.7 : 0.4}
          />
        ) : (
          <rect
            x={toSvgX(graphCenterX - graphW / 2)}
            y={toSvgY(graphCenterZ - graphL / 2)}
            width={graphW * scale}
            height={graphL * scale}
            fill={floorPlan2DRenderMode === 'ortho' ? 'url(#room-floor-texture)' : '#090d16'}
            stroke={floorPlan2DRenderMode === 'ortho' ? '#475569' : '#2563eb'}
            strokeWidth={floorPlan2DRenderMode === 'ortho' ? 1.5 : 1}
            strokeDasharray={floorPlan2DRenderMode === 'ortho' ? undefined : '4 4'}
            strokeOpacity={floorPlan2DRenderMode === 'ortho' ? 0.7 : 0.4}
          />
        )}

        {/* Layer 1: Tường + Cửa đi/Cửa sổ */}
        <WallLayer
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          toWorldX={toWorldX}
          toWorldZ={toWorldZ}
          scale={scale}
          bgColor="#0f172a"
        />

        {/* Layer 2: Đồ nội thất (Kéo thả, xoay) */}
        <FurnitureLayer
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          toWorldX={toWorldX}
          toWorldZ={toWorldZ}
          scale={scale}
          svgRef={svgRef}
        />

        {/* Layer 3: Preview vẽ tường thời gian thực */}
        <WallDrawingLayer
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          scale={scale}
        />

        {/* Layer 3.5: Ghost Preview khi đang chọn vị trí đặt Cửa đi hoặc Cửa sổ */}
        {activeOpeningPreview && (() => {
          const fakeOp = {
            id: '__ghost_preview__',
            u: activeOpeningPreview.u,
            type: activeOpeningPreview.type,
            width: activeOpeningPreview.width,
            swingSide: 'left',
            swingDir: 'inward',
            openAngle: 75,
          };
          const t = getOpeningWorldTransform(fakeOp, activeOpeningPreview.seg, wallGraph.vertices);
          if (!t) return null;
          const previewCx = toSvgX(t.cx);
          const previewCz = toSvgY(t.cz);
          const isDoor = activeOpeningPreview.type === 'door';
          const themeColor = isDoor ? '#38bdf8' : '#34d399';

          return (
            <g className="ghost-opening-preview" style={{ pointerEvents: 'none' }}>
              {/* Vầng sáng bao quanh vị trí dự kiến đặt */}
              <circle
                cx={previewCx}
                cy={previewCz}
                r={26}
                fill={isDoor ? 'rgba(56, 189, 248, 0.2)' : 'rgba(52, 211, 153, 0.2)'}
                stroke={themeColor}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />

              {/* Mô phỏng trực tiếp ký hiệu CAD 2D chuẩn */}
              {isDoor ? (
                <DoorSymbol
                  opening={fakeOp}
                  seg={activeOpeningPreview.seg}
                  vertices={wallGraph.vertices}
                  toSvgX={toSvgX}
                  toSvgY={toSvgY}
                  scale={scale}
                  isSelected={true}
                />
              ) : (
                <WindowSymbol
                  opening={fakeOp}
                  seg={activeOpeningPreview.seg}
                  vertices={wallGraph.vertices}
                  toSvgX={toSvgX}
                  toSvgY={toSvgY}
                  scale={scale}
                  isSelected={true}
                />
              )}

              {/* Tag nhãn nổi hướng dẫn thao tác */}
              <g transform={`translate(${previewCx}, ${previewCz - 34})`}>
                <rect
                  x={-85}
                  y={-14}
                  width={170}
                  height={28}
                  rx={6}
                  fill="#0f172a"
                  stroke={themeColor}
                  strokeWidth={1.5}
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#ffffff"
                >
                  {isDoor ? '🚪 Click để đặt cửa đi (0.9m)' : '🪟 Click để đặt cửa sổ (1.2m)'}
                </text>
              </g>
            </g>
          );
        })()}

        {/* Dimension lines — Chiều ngang phòng */}
        <g stroke="#64748b" strokeWidth="1">
          <line
            x1={toSvgX(graphCenterX - graphW / 2)}
            y1={toSvgY(graphCenterZ + graphL / 2) + 16}
            x2={toSvgX(graphCenterX + graphW / 2)}
            y2={toSvgY(graphCenterZ + graphL / 2) + 16}
          />
          <line
            x1={toSvgX(graphCenterX - graphW / 2)}
            y1={toSvgY(graphCenterZ + graphL / 2) + 10}
            x2={toSvgX(graphCenterX - graphW / 2)}
            y2={toSvgY(graphCenterZ + graphL / 2) + 22}
          />
          <line
            x1={toSvgX(graphCenterX + graphW / 2)}
            y1={toSvgY(graphCenterZ + graphL / 2) + 10}
            x2={toSvgX(graphCenterX + graphW / 2)}
            y2={toSvgY(graphCenterZ + graphL / 2) + 22}
          />
        </g>
        <text
          x={(toSvgX(graphCenterX - graphW / 2) + toSvgX(graphCenterX + graphW / 2)) / 2}
          y={toSvgY(graphCenterZ + graphL / 2) + 32}
          textAnchor="middle"
          fontSize="11"
          fill="#94a3b8"
          fontFamily="monospace"
        >
          {graphW.toFixed(2)} m
        </text>

        {/* Dimension lines — Chiều dọc phòng */}
        <g stroke="#64748b" strokeWidth="1">
          <line
            x1={toSvgX(graphCenterX + graphW / 2) + 16}
            y1={toSvgY(graphCenterZ - graphL / 2)}
            x2={toSvgX(graphCenterX + graphW / 2) + 16}
            y2={toSvgY(graphCenterZ + graphL / 2)}
          />
          <line
            x1={toSvgX(graphCenterX + graphW / 2) + 10}
            y1={toSvgY(graphCenterZ - graphL / 2)}
            x2={toSvgX(graphCenterX + graphW / 2) + 22}
            y2={toSvgY(graphCenterZ - graphL / 2)}
          />
          <line
            x1={toSvgX(graphCenterX + graphW / 2) + 10}
            y1={toSvgY(graphCenterZ + graphL / 2)}
            x2={toSvgX(graphCenterX + graphW / 2) + 22}
            y2={toSvgY(graphCenterZ + graphL / 2)}
          />
        </g>
        <text
          x={toSvgX(graphCenterX + graphW / 2) + 34}
          y={(toSvgY(graphCenterZ - graphL / 2) + toSvgY(graphCenterZ + graphL / 2)) / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#94a3b8"
          fontFamily="monospace"
          transform={`rotate(90, ${toSvgX(graphCenterX + graphW / 2) + 34}, ${(toSvgY(graphCenterZ - graphL / 2) + toSvgY(graphCenterZ + graphL / 2)) / 2})`}
        >
          {graphL.toFixed(2)} m
        </text>
      </svg>
    </div>
  );
}
