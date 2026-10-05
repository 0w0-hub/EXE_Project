import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';
import {
  snapToNearestVertex,
  snapWallAngle,
  projectPointOntoSegment,
  getSegmentWorld,
} from '../room/wallGraphUtils';

/**
 * Controller xử lý tương tác vẽ tường và đặt cửa/cửa sổ trực tiếp trong không gian 3D/2D
 * Hoạt động khi activeTab === '2d-plan'
 */
export function WallDrawingController() {
  const activeTab = useEditorStore((state) => state.activeTab);
  const mode = useEditorStore((state) => state.floorPlan2DMode);
  const setMode = useEditorStore((state) => state.setFloorPlan2DMode);
  const gridSnap = useEditorStore((state) => state.gridSnap);
  const snapStep = useEditorStore((state) => state.snapStep);

  const wallGraph = useSceneStore((state) => state.wallGraph);
  const wgAddVertex = useSceneStore((state) => state.wgAddVertex);
  const wgAddSegment = useSceneStore((state) => state.wgAddSegment);
  const wgAddOpening = useSceneStore((state) => state.wgAddOpening);
  const wgSplitSegment = useSceneStore((state) => state.wgSplitSegment);
  const selectVertex = useSceneStore((state) => state.selectVertex);
  const selectSegment = useSceneStore((state) => state.selectSegment);
  const selectItem = useSceneStore((state) => state.selectItem);
  const selectOpening = useSceneStore((state) => state.selectOpening);

  const { raycaster, camera, scene } = useThree();
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Trạng thái thao tác
  const [startPoint, setStartPoint] = useState(null); // { vId, x, z }
  const [cursorPoint, setCursorPoint] = useState(null); // { x, z, snappedVId }
  const [doorCandidate, setDoorCandidate] = useState(null); // { segId, u, x, z, angleY, opW }
  const [splitCandidate, setSplitCandidate] = useState(null); // { segId, x, z }

  // Hủy trạng thái khi ấn Escape hoặc đổi mode
  useEffect(() => {
    setStartPoint(null);
    setCursorPoint(null);
    setDoorCandidate(null);
    setSplitCandidate(null);
  }, [mode, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setStartPoint(null);
        setCursorPoint(null);
        setDoorCandidate(null);
        if (mode === 'draw-wall') setMode('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode]);

  // Raycast tìm toạ độ trên mặt phẳng sàn XZ (Y = 0)
  const getFloorIntersection = useCallback(
    (e) => {
      const hit = new THREE.Vector3();
      if (e.ray.intersectPlane(floorPlane.current, hit)) {
        return { x: Number(hit.x.toFixed(3)), z: Number(hit.z.toFixed(3)) };
      }
      return null;
    },
    []
  );

  const handlePointerMove = (e) => {
    if (activeTab !== '2d-plan') return;
    const hit = getFloorIntersection(e);
    if (!hit) return;

    let targetX = hit.x;
    let targetZ = hit.z;

    if (mode === 'draw-wall') {
      // Snap tới vertex gần nhất (bán kính 0.35m)
      const snap = snapToNearestVertex(targetX, targetZ, wallGraph.vertices, 0.35, startPoint?.vId);
      if (snap) {
        setCursorPoint({ x: snap.snappedX, z: snap.snappedZ, snappedVId: snap.snappedToId });
      } else {
        if (gridSnap) {
          targetX = Math.round(targetX / snapStep) * snapStep;
          targetZ = Math.round(targetZ / snapStep) * snapStep;
        }

        // Snap góc 45 độ nếu giữ Shift
        if (e.shiftKey && startPoint) {
          const angled = snapWallAngle(startPoint.x, startPoint.z, targetX, targetZ, 45);
          targetX = angled.x;
          targetZ = angled.z;
        }

        setCursorPoint({ x: targetX, z: targetZ, snappedVId: null });
      }
    } else if (mode === 'place-door' || mode === 'place-window') {
      // Tìm đoạn tường gần nhất trong bán kính 0.4m
      let bestSeg = null;
      let bestDist = 0.4;
      let bestProj = null;

      for (const seg of Object.values(wallGraph.segments)) {
        const proj = projectPointOntoSegment(targetX, targetZ, seg, wallGraph.vertices);
        if (proj && proj.dist < bestDist) {
          bestDist = proj.dist;
          bestSeg = seg;
          bestProj = proj;
        }
      }

      if (bestSeg && bestProj) {
        const sw = getSegmentWorld(bestSeg, wallGraph.vertices);
        const angleY = sw ? Math.atan2(-sw.dir.z, sw.dir.x) : 0;
        setDoorCandidate({
          segId: bestSeg.id,
          u: bestProj.u,
          x: bestProj.projX,
          z: bestProj.projZ,
          angleY,
          opW: mode === 'place-door' ? 1.0 : 1.2,
        });
      } else {
        setDoorCandidate(null);
      }
    } else if (mode === 'add-node') {
      // Tìm đoạn tường gần nhất để thêm nút
      let bestSeg = null;
      let bestDist = 0.4;
      let bestProj = null;

      for (const seg of Object.values(wallGraph.segments)) {
        const proj = projectPointOntoSegment(targetX, targetZ, seg, wallGraph.vertices);
        if (proj && proj.dist < bestDist) {
          bestDist = proj.dist;
          bestSeg = seg;
          bestProj = proj;
        }
      }

      if (bestSeg && bestProj) {
        setSplitCandidate({
          segId: bestSeg.id,
          x: bestProj.projX,
          z: bestProj.projZ,
        });
      } else {
        setSplitCandidate(null);
      }
    }
  };

  const handlePointerDown = (e) => {
    if (activeTab !== '2d-plan') return;
    if (e.button !== 0) return; // Chỉ nhận click chuột trái

    const hit = getFloorIntersection(e);
    if (!hit) return;

    if (mode === 'add-node') {
      if (splitCandidate) {
        e.stopPropagation();
        wgSplitSegment(splitCandidate.segId, splitCandidate.x, splitCandidate.z);
        setSplitCandidate(null);
        setMode('select'); // Tự động chuyển về select để người dùng có thể kéo nút vừa tạo ngay
      }
    } else if (mode === 'draw-wall') {
      e.stopPropagation();
      const currentPt = cursorPoint || hit;

      if (!startPoint) {
        // Click 1: Đặt điểm bắt đầu
        let v1Id = currentPt.snappedVId;
        if (!v1Id) {
          wgAddVertex(currentPt.x, currentPt.z);
          // Lấy ID đỉnh mới tạo
          v1Id = Object.keys(useSceneStore.getState().wallGraph.vertices).pop();
        }
        setStartPoint({ vId: v1Id, x: currentPt.x, z: currentPt.z });
      } else {
        // Click 2: Hoàn thành đoạn tường
        let v2Id = currentPt.snappedVId;
        if (!v2Id) {
          wgAddVertex(currentPt.x, currentPt.z);
          v2Id = Object.keys(useSceneStore.getState().wallGraph.vertices).pop();
        }

        if (startPoint.vId !== v2Id) {
          wgAddSegment(startPoint.vId, v2Id);
        }

        // Điểm kết thúc trở thành điểm bắt đầu đoạn tiếp theo
        setStartPoint({ vId: v2Id, x: currentPt.x, z: currentPt.z });
      }
    } else if (mode === 'place-door' || mode === 'place-window') {
      if (doorCandidate) {
        e.stopPropagation();
        wgAddOpening({
          segmentId: doorCandidate.segId,
          u: doorCandidate.u,
          type: mode === 'place-door' ? 'door' : 'window',
        });
        selectSegment(doorCandidate.segId);
      }
    } else if (mode === 'select') {
      // Click vào khoảng trống sàn: bỏ chọn tất cả
      selectItem(null);
      selectOpening(null);
      selectVertex(null);
      selectSegment(null);
    }
  };

  if (activeTab !== '2d-plan') return null;

  return (
    <group onPointerMove={handlePointerMove} onPointerDown={handlePointerDown}>
      {/* 1. Mặt phẳng nhận sự kiện chuột trên sàn XZ khi đang ở các chế độ vẽ/đặt */}
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={mode !== 'select'}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 2. Đường preview nét đứt khi đang vẽ tường */}
      {mode === 'draw-wall' && startPoint && cursorPoint && (
        <group>
          {/* Đường nối từ điểm bắt đầu đến con trỏ */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geo) => {
                const pts = [
                  new THREE.Vector3(startPoint.x, 0.1, startPoint.z),
                  new THREE.Vector3(cursorPoint.x, 0.1, cursorPoint.z),
                ];
                geo.setFromPoints(pts);
              }}
            />
            <lineDashedMaterial
              color="#3b82f6"
              dashSize={0.3}
              gapSize={0.15}
              linewidth={3}
            />
          </line>

          {/* Điểm bắt đầu */}
          <mesh position={[startPoint.x, 0.1, startPoint.z]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>

          {/* Điểm con trỏ */}
          <mesh position={[cursorPoint.x, 0.1, cursorPoint.z]}>
            <sphereGeometry args={[cursorPoint.snappedVId ? 0.18 : 0.12, 16, 16]} />
            <meshBasicMaterial color={cursorPoint.snappedVId ? '#10b981' : '#60a5fa'} />
          </mesh>
        </group>
      )}

      {/* 3. Marker preview khi hover đặt cửa hoặc cửa sổ */}
      {(mode === 'place-door' || mode === 'place-window') && doorCandidate && (
        <group
          position={[doorCandidate.x, 0.15, doorCandidate.z]}
          rotation={[0, doorCandidate.angleY, 0]}
        >
          <mesh>
            <boxGeometry args={[doorCandidate.opW || 0.9, 0.25, 0.25]} />
            <meshBasicMaterial
              color={mode === 'place-door' ? '#3b82f6' : '#38bdf8'}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* 4. Marker preview khi hover thêm nút tường trên cạnh */}
      {mode === 'add-node' && splitCandidate && (
        <group position={[splitCandidate.x, 0.12, splitCandidate.z]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh>
            <ringGeometry args={[0.2, 0.26, 24]} />
            <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}
