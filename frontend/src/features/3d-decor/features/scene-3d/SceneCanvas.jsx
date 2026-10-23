import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraManager } from './CameraManager';
import { RoomMesh } from '../room/RoomMesh';
import { FurnitureItem } from './FurnitureItem';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';

/**
 * Canvas 3D chính:
 * - Phối cảnh 3D thực tế ảo, bóng đổ mềm, ánh sáng PBR chân thực
 * - Độc lập với 2D view: Chỉ quản lý không gian 3D, đọc/ghi cùng nguồn dữ liệu useSceneStore
 */
export function SceneCanvas() {
  const items = useSceneStore((state) => state.items);
  const room = useSceneStore((state) => state.room);
  const wallGraph = useSceneStore((state) => state.wallGraph);
  const selectItem = useSceneStore((state) => state.selectItem);
  const lightingMode = useEditorStore((state) => state.lightingMode);
  const setIsDraggingItem = useEditorStore((state) => state.setIsDraggingItem);

  const isEvening = lightingMode === 'evening';
  const { width = 6, length = 5, height = 2.8 } = room;

  // Tính Bounding Box và tâm phòng từ đồ thị tường thực tế
  const { boundW, boundL, centerX, centerZ } = React.useMemo(() => {
    const verts = Object.values(wallGraph.vertices || {});
    if (verts.length === 0) return { boundW: width, boundL: length, centerX: 0, centerZ: 0 };
    const xs = verts.map((v) => v.x);
    const zs = verts.map((v) => v.z);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
    return {
      boundW: Math.max(width, maxX - minX),
      boundL: Math.max(length, maxZ - minZ),
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
    };
  }, [wallGraph.vertices, width, length]);

  return (
    <div
      id="decor-canvas-container"
      className={`w-full h-full relative transition-colors duration-500 ${
        isEvening ? 'bg-[#18162d]' : 'bg-[#e2e8f0]'
      }`}
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isEvening ? 0.9 : 1.1,
        }}
        camera={{
          position: [width * 0.9, height * 1.7, length * 1.4],
          fov: 45,
          near: 0.1,
          far: 200,
        }}
        onPointerMissed={() => {
          selectItem(null);
          useSceneStore.getState().selectOpening(null);
          useSceneStore.getState().selectVertex(null);
          useSceneStore.getState().selectSegment(null);
        }}
        onPointerUp={() => {
          setIsDraggingItem(false);
          document.body.style.cursor = 'default';
        }}
      >
        {/* Ánh sáng bán cầu */}
        <hemisphereLight
          color={isEvening ? 0x7c7ea8 : 0xffffff}
          groundColor={isEvening ? 0x2e2a4d : 0x94a3b8}
          intensity={isEvening ? 0.4 : 0.75}
        />

        {/* Nguồn sáng định hướng chính - phủ trọn vẹn toàn bộ căn phòng không để lọt sáng */}
        {(() => {
          const maxDim = Math.max(boundW, boundL, 8);
          const shadowExtent = maxDim * 1.6;
          return (
            <directionalLight
              position={[centerX + boundW * 0.8, height * 2.5, centerZ + boundL * 0.8]}
              intensity={isEvening ? 0.5 : 1.3}
              color={isEvening ? 0xfff0dd : 0xffffff}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-left={-shadowExtent}
              shadow-camera-right={shadowExtent}
              shadow-camera-top={shadowExtent}
              shadow-camera-bottom={-shadowExtent}
              shadow-camera-near={0.5}
              shadow-camera-far={maxDim * 6}
              shadow-bias={-0.0001}
              shadow-normalBias={0.03}
            />
          );
        })()}

        {/* Nguồn sáng phụ */}
        <directionalLight
          position={[centerX - boundW * 0.6, height * 1.2, centerZ - boundL * 0.6]}
          intensity={isEvening ? 0.25 : 0.4}
          color={isEvening ? 0x939bc9 : 0xffffff}
        />

        {/* Điều khiển góc nhìn camera 3D phối cảnh */}
        <CameraManager />

        {/* Cấu trúc căn phòng 3D (Tường miter bisector, sàn polygon, lỗ cửa/cửa sổ) */}
        <RoomMesh />

        {/* Các món đồ nội thất 3D (cùng dữ liệu trong store) */}
        {items.map((item) => (
          <FurnitureItem key={item.instanceId} item={item} />
        ))}
      </Canvas>
    </div>
  );
}
