import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';

/**
 * Điều khiển góc nhìn camera:
 * - Khi activeTab === '2d-plan': Khóa góc nhìn Top-Down (từ trên nhìn thẳng xuống sàn XZ), không xoay phối cảnh, chỉ pan/zoom như bản vẽ CAD
 * - Khi activeTab === '3d': Phối cảnh tự do (OrbitControls)
 */
export function CameraManager() {
  const controlsRef = useRef();
  const { camera } = useThree();
  const activeTab = useEditorStore((state) => state.activeTab);
  const cameraMode = useEditorStore((state) => state.cameraMode);
  const autoRotate = useEditorStore((state) => state.autoRotate);
  const isDraggingItem = useEditorStore((state) => state.isDraggingItem);
  const room = useSceneStore((state) => state.room);

  const { width = 6, length = 5, height = 2.8 } = room;

  const prevTabRef = useRef(null);
  const prevCameraModeRef = useRef(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!controlsRef.current) return;

    const isFirstRun = !hasInitializedRef.current;
    const tabChanged = prevTabRef.current !== activeTab;
    const modeChanged = prevCameraModeRef.current !== cameraMode;

    if (isFirstRun || tabChanged || modeChanged) {
      if (activeTab === '2d-plan' || cameraMode === '2d') {
        // Góc nhìn vuông góc từ trên trần nhìn xuống mặt sàn XZ
        const topDist = Math.max(width, length) * 2.2;
        camera.position.set(0, topDist, 0.001);
        camera.lookAt(0, 0, 0);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.enableRotate = false; // Khóa xoay, giữ chuẩn bản vẽ mặt bằng
      } else if (cameraMode === 'walkthrough') {
        // Tầm mắt người
        const eyeHeight = 1.6;
        camera.position.set(-width * 0.38, eyeHeight, length * 0.38);
        controlsRef.current.target.set(width * 0.1, eyeHeight * 0.8, -length * 0.1);
        controlsRef.current.enableRotate = true;
      } else {
        // 3D Orbit
        if (isFirstRun || prevTabRef.current === '2d-plan' || prevCameraModeRef.current === '2d' || prevCameraModeRef.current === 'walkthrough') {
          camera.position.set(width * 0.9, height * 1.7, length * 1.4);
          controlsRef.current.target.set(0, height * 0.25, 0);
        }
        controlsRef.current.enableRotate = true;
      }

      controlsRef.current.update();
      prevTabRef.current = activeTab;
      prevCameraModeRef.current = cameraMode;
      hasInitializedRef.current = true;
    }
  }, [activeTab, cameraMode, camera, width, length, height]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate && activeTab !== '2d-plan';
    }
  }, [autoRotate, activeTab]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!isDraggingItem}
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={Math.max(width, length) * 5}
      maxPolarAngle={activeTab === '2d-plan' ? 0.01 : Math.PI / 2 - 0.02}
      autoRotate={autoRotate && !isDraggingItem && activeTab !== '2d-plan'}
      autoRotateSpeed={2.0}
      screenSpacePanning={activeTab === '2d-plan'}
    />
  );
}
