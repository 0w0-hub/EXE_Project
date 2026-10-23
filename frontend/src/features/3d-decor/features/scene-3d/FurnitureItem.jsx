import React, { useRef, useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { GLTFFurnitureModel } from './GLTFFurnitureModel';
import { ProceduralFurnitureModel } from './ProceduralFurnitureModel';
import {
  checkCollisionOBB2D,
  isItemColliding,
  isItemPlaceableOnSurface,
  findSupportingSurface,
  snapWallItemTransform,
} from '../collision/collisionResolver';
import { clampItemInsideWallGraph } from '../room/wallGraphUtils';

/**
 * Component hiển thị một món đồ nội thất kèm:
 * - Kéo thả trực tiếp bằng con trỏ chuột trên mặt sàn hoặc mặt bàn/kệ (Surface Snapping)
 * - Tự động liên kết cha - con khi đặt lên bàn/kệ (Dynamic Parent-Child Attachment)
 * - Tự động căn biên không cho vật lọt hoặc đâm xuyên ra ngoài tường phòng
 * - Gizmo 3D TransformControls (di chuyển, xoay)
 * - Nhuộm màu thông minh và kiểm tra va chạm
 */
export function FurnitureItem({ item }) {
  const groupRef = useRef();
  const selectItem = useSceneStore((state) => state.selectItem);
  const selectedItemId = useSceneStore((state) => state.selectedItemId);
  const items = useSceneStore((state) => state.items);
  const room = useSceneStore((state) => state.room);
  const wallGraph = useSceneStore((state) => state.wallGraph);
  const updateItemTransform = useSceneStore((state) => state.updateItemTransform);
  const commitTransform = useSceneStore((state) => state.commitTransform);

  const transformMode = useEditorStore((state) => state.transformMode);
  const lightingMode = useEditorStore((state) => state.lightingMode);
  const gridSnap = useEditorStore((state) => state.gridSnap);
  const snapStep = useEditorStore((state) => state.snapStep);
  const snapAngle = useEditorStore((state) => state.snapAngle);
  const setIsDraggingItem = useEditorStore((state) => state.setIsDraggingItem);

  const isSelected = selectedItemId === item.instanceId;
  const selectedItem = items.find((i) => i.instanceId === selectedItemId);

  const { camera, raycaster, gl } = useThree();
  const [isPointerDragging, setIsPointerDragging] = useState(false);

  // Tham chiếu xử lý kéo thả trực tiếp bằng con trỏ chuột
  const isPointerDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, z: 0 });
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Đồng bộ vị trí và góc xoay thực tế của Three.js Object3D khi item được cha di chuyển hoặc cập nhật từ store
  React.useEffect(() => {
    if (groupRef.current && !isPointerDraggingRef.current) {
      groupRef.current.position.set(item.position[0], item.position[1], item.position[2]);
      groupRef.current.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
    }
  }, [item.position, item.rotation]);

  // Kiểm tra va chạm chuẩn xác bằng thuật toán SAT OBB 2D (kèm góc xoay thực tế)
  const isCollidingWithSelected =
    !isSelected && !!selectedItem && checkCollisionOBB2D(item, selectedItem);

  // Kiểm tra xem bản thân vật thể đang chọn có va chạm với bất kỳ món nào khác không
  const hasCollision = isSelected && isItemColliding(item, items);

  // 1. Xử lý di chuyển bằng Gizmo TransformControls (căn trong tường và kẹp Y theo sàn hoặc bề mặt đỡ)
  const handleGizmoChange = () => {
    if (!groupRef.current) return;
    const pos = groupRef.current.position;
    const rot = groupRef.current.rotation;

    // Nếu là đồ gắn tường (Cửa đi, Cửa sổ, Tranh, Gương, Đèn vách,...)
    if (item.mountType === 'wall') {
      const snap = snapWallItemTransform(
        [pos.x, pos.y, pos.z],
        item.dimensions,
        room,
        pos.y,
        item.wallId,
        wallGraph
      );
      pos.x = snap.position[0];
      pos.y = snap.position[1];
      pos.z = snap.position[2];
      rot.x = snap.rotation[0];
      rot.y = snap.rotation[1];
      rot.z = snap.rotation[2];

      updateItemTransform(item.instanceId, {
        position: snap.position,
        rotation: snap.rotation,
        wallId: snap.wallId,
        wallName: snap.wallName,
        wallU: snap.wallU,
        wallT: snap.wallT,
        wallLength: snap.wallLength,
        elevation: snap.elevation,
      });
      return;
    }

    // Kẹp biên vật thể luôn nằm hoàn toàn bên trong hệ tường tùy ý (wallGraph)
    const [clampedX, , clampedZ] = clampItemInsideWallGraph(
      [pos.x, 0, pos.z],
      item.dimensions,
      rot.y,
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
    } else {
      nextY = pos.y || 0;
    }

    // Cập nhật lại vị trí hiển thị tức thời của group
    pos.x = clampedX;
    pos.y = nextY;
    pos.z = clampedZ;

    // Khóa góc xoay X và Z luôn bằng 0 để đảm bảo chân đồ luôn áp sát mặt sàn, không bị lật nghiêng
    const currentRotY = rot.y || 0;
    rot.x = 0;
    rot.z = 0;

    updateItemTransform(item.instanceId, {
      position: [clampedX, nextY, clampedZ],
      rotation: [0, currentRotY, 0],
      attachedTo: newAttachedTo,
    });
  };

  const handleGizmoMouseUp = () => {
    handleGizmoChange();
    commitTransform();
  };

  // 2. Xử lý di chuyển trực tiếp theo con trỏ chuột trên toàn màn hình (Window Tracking)
  // 2. Xử lý di chuyển trực tiếp theo con trỏ chuột trên toàn màn hình (Window Tracking)
  // Giúp thao tác kéo thả siêu nhạy, không bao giờ bị giật hay mất dấu chuột
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Chỉ xử lý click chuột trái
    e.stopPropagation();

    selectItem(item.instanceId);

    // Tính điểm giao cắt của tia chuột với mặt phẳng sàn Y = 0
    const hitPoint = new THREE.Vector3();
    if (e.ray.intersectPlane(floorPlane.current, hitPoint)) {
      dragOffsetRef.current = {
        x: hitPoint.x - item.position[0],
        z: hitPoint.z - item.position[2],
      };
      isPointerDraggingRef.current = true;
      setIsPointerDragging(true);
      setIsDraggingItem(true);
      try {
        gl.domElement.setPointerCapture(e.pointerId);
      } catch {
        // fallback
      }
    }
  };

  useEffect(() => {
    if (!isPointerDragging) return;

    const handleWindowPointerMove = (e) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(floorPlane.current, hitPoint)) {
        const rawX = hitPoint.x - dragOffsetRef.current.x;
        const rawZ = hitPoint.z - dragOffsetRef.current.z;

        // Xử lý kéo thả cho đồ gắn tường: Tự động bắt dính vào mặt tường gần nhất
        if (item.mountType === 'wall') {
          const currentElevation = item.position ? item.position[1] : (item.defaultElevation || 0);
          const snap = snapWallItemTransform(
            [rawX, currentElevation, rawZ],
            item.dimensions,
            room,
            currentElevation,
            null,
            wallGraph
          );

          if (groupRef.current) {
            groupRef.current.position.set(snap.position[0], snap.position[1], snap.position[2]);
            groupRef.current.rotation.set(snap.rotation[0], snap.rotation[1], snap.rotation[2]);
          }

          updateItemTransform(item.instanceId, {
            position: snap.position,
            rotation: snap.rotation,
            wallId: snap.wallId,
            wallName: snap.wallName,
            wallU: snap.wallU,
            wallT: snap.wallT,
            wallLength: snap.wallLength,
            elevation: snap.elevation,
          });
          return;
        }

        // Kẹp biên chặt chẽ trong hệ tường tùy ý (wallGraph) và snap lưới nếu bật
        let targetX = rawX;
        let targetZ = rawZ;

        if (gridSnap) {
          targetX = Math.round(targetX / snapStep) * snapStep;
          targetZ = Math.round(targetZ / snapStep) * snapStep;
        }

        const [nextX, , nextZ] = clampItemInsideWallGraph(
          [targetX, 0, targetZ],
          item.dimensions,
          item.rotation ? item.rotation[1] : 0,
          wallGraph
        );

        // Nhận diện xem vị trí mới có nằm trên mặt bàn/kệ nào không
        let nextY = 0;
        let newAttachedTo = null;

        if (isItemPlaceableOnSurface(item)) {
          const surface = findSupportingSurface(
            [nextX, 0, nextZ],
            item.dimensions,
            items,
            item.instanceId
          );
          if (surface) {
            nextY = surface.surfaceY;
            newAttachedTo = surface.hostItem.instanceId;
          }
        }

        if (groupRef.current) {
          groupRef.current.position.x = nextX;
          groupRef.current.position.y = nextY;
          groupRef.current.position.z = nextZ;
        }

        const prevPos = item.position;
        if (
          Math.abs(nextX - prevPos[0]) > 0.001 ||
          Math.abs(nextY - prevPos[1]) > 0.001 ||
          Math.abs(nextZ - prevPos[2]) > 0.001
        ) {
          updateItemTransform(item.instanceId, {
            position: [nextX, nextY, nextZ],
            rotation: item.rotation,
            attachedTo: newAttachedTo,
          });
        }
      }
    };

    const handleWindowPointerUp = () => {
      if (!isPointerDraggingRef.current) return;
      isPointerDraggingRef.current = false;
      setIsPointerDragging(false);
      setIsDraggingItem(false);
      document.body.style.cursor = 'default';
      commitTransform();
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    window.addEventListener('blur', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
      window.removeEventListener('blur', handleWindowPointerUp);
    };
  }, [
    isPointerDragging,
    camera,
    gl,
    raycaster,
    item,
    room,
    wallGraph,
    gridSnap,
    snapStep,
    items,
    updateItemTransform,
    commitTransform,
    setIsDraggingItem,
  ]);

  const { width = 1, height = 1, depth = 1 } = item.dimensions || {};

  return (
    <>
      <group
        ref={groupRef}
        position={item.position}
        rotation={item.rotation}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        {/* Dựng mô hình 3D thực tế PBR đầy đủ chi tiết, ánh sáng và bóng đổ */}
        {item.modelPath ? (
          <Suspense
            fallback={
              <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color="#94a3b8" wireframe />
              </mesh>
            }
          >
            <GLTFFurnitureModel
              modelPath={item.modelPath}
              modelType={item.modelType}
              dimensions={item.dimensions}
              isLightOn={item.isLightOn !== false}
              isSelected={isSelected}
              isCollidingWithSelected={isCollidingWithSelected}
              hasCollision={hasCollision}
            />
          </Suspense>
        ) : (
          <>
            <ProceduralFurnitureModel
              modelType={item.modelType}
              dimensions={item.dimensions}
              color={item.color || '#3b82f6'}
              isLightOn={item.isLightOn !== false}
            />
            {/* Khung viền Bounding Box cho model tạo từ code */}
            {(isSelected || isCollidingWithSelected) && (
              <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[width + 0.02, height + 0.02, depth + 0.02]} />
                <meshBasicMaterial
                  color={
                    isCollidingWithSelected
                      ? '#ef4444'
                      : hasCollision
                      ? '#f97316'
                      : '#3b82f6'
                  }
                  wireframe
                  transparent
                  opacity={isCollidingWithSelected ? 0.9 : 0.65}
                />
              </mesh>
            )}
          </>
        )}

        {/* Nguồn sáng điểm tự nhiên tỏa sáng khi công tắc đèn đang bật */}
        {item.modelType === 'lamp' && item.isLightOn !== false && (
          <group position={[0, height * 0.82, 0]}>
            <pointLight
              intensity={lightingMode === 'evening' ? 70 : 35}
              distance={Math.max(room.width || 6, room.length || 5) * 1.5}
              decay={1.6}
              color="#ffeedd"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-near={0.02}
              shadow-camera-far={15}
              shadow-bias={-0.0003}
              shadow-normalBias={0.03}
            />
            {/* Đốm sáng bóng đèn nhỏ tinh tế */}
            <mesh>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#fffbe8" />
            </mesh>
          </group>
        )}
      </group>

      {/* Gizmo 3D Transform Controls */}
      {isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={item.mountType === 'wall' ? 'translate' : transformMode}
          showX={transformMode === 'translate'}
          showY={item.mountType === 'wall' || transformMode === 'rotate'}
          showZ={transformMode === 'translate'}
          translationSnap={gridSnap ? snapStep : null}
          rotationSnap={gridSnap ? snapAngle : null}
          onChange={handleGizmoChange}
          onMouseUp={handleGizmoMouseUp}
        />
      )}
    </>
  );
}
