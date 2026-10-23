import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Component nạp mô hình GLB thực tế từ kho tài nguyên
 * Căn chỉnh kích thước model vừa khít đúng dimensions để Bounding Box và thuật toán va chạm đồng nhất 100%
 */
export function GLTFFurnitureModel({
  modelPath,
  modelType,
  dimensions,
  isLightOn = true,
  isSelected,
  isCollidingWithSelected,
  hasCollision,
}) {
  const path = modelPath || '/furniture/seating.glb';
  const { scene } = useGLTF(path);

  const { targetW, targetH, targetD } = useMemo(() => {
    return {
      targetW: dimensions?.width || 1,
      targetH: dimensions?.height || 1,
      targetD: dimensions?.depth || 1,
    };
  }, [dimensions]);

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);

    // 1. Tính toán bounding box ban đầu của model từ Three.js Box3
    const bbox = new THREE.Box3().setFromObject(clone);
    const rawSize = new THREE.Vector3();
    bbox.getSize(rawSize);

    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // 2. Scale model vừa khít theo đúng kích thước dimensions mục tiêu
    const scaleX = rawSize.x > 0 ? targetW / rawSize.x : 1;
    const scaleY = rawSize.y > 0 ? targetH / rawSize.y : 1;
    const scaleZ = rawSize.z > 0 ? targetD / rawSize.z : 1;

    clone.scale.set(scaleX, scaleY, scaleZ);

    // 3. Căn chỉnh vị trí: Đưa tâm X, Z về 0 và đáy Y (bbox.min.y) áp sát chuẩn mặt sàn Y = 0
    clone.position.set(
      -center.x * scaleX,
      -bbox.min.y * scaleY,
      -center.z * scaleZ
    );

    // 4. Duyệt các mesh để bật bóng đổ và giữ nguyên 100% vật liệu gốc của file GLB
    clone.traverse((child) => {
      if (child.isMesh) {
        // Với đèn nội thất: không để chao đèn tự đổ bóng chặn đứng nguồn sáng bên trong
        child.castShadow = modelType !== 'lamp';
        child.receiveShadow = true;

        if (child.material) {
          child.material = child.material.clone();
          child.material.shadowSide = THREE.DoubleSide;
        }
      }
    });

    return clone;
  }, [scene, targetW, targetH, targetD, modelType]);

  if (!clonedScene) {
    return (
      <mesh position={[0, targetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[targetW, targetH, targetD]} />
        <meshStandardMaterial color={color || '#3b82f6'} />
      </mesh>
    );
  }

  // Màu sắc khung bao Bounding Box:
  // - Đỏ (#ef4444): Vật thể đang bị va chạm cùng với món đang chọn
  // - Cam (#f97316): Món đang chọn nhưng bản thân nó đang bị va chạm
  // - Xanh dương (#3b82f6): Món đang chọn ở vị trí an toàn bình thường
  const showBox = isSelected || isCollidingWithSelected;
  const boxColor = isCollidingWithSelected
    ? '#ef4444'
    : hasCollision
    ? '#f97316'
    : '#3b82f6';

  return (
    <>
      {/* 1. Mô hình 3D thực tế */}
      <primitive object={clonedScene} />

      {/* 2. Khung viền Bounding Box khớp chuẩn 100% kích thước vật thể và thuật toán va chạm */}
      {showBox && (
        <mesh position={[0, targetH / 2, 0]}>
          <boxGeometry
            args={[
              targetW + 0.02,
              targetH + 0.02,
              targetD + 0.02,
            ]}
          />
          <meshBasicMaterial
            color={boxColor}
            wireframe
            transparent
            opacity={isCollidingWithSelected ? 0.9 : 0.65}
          />
        </mesh>
      )}
    </>
  );
}
