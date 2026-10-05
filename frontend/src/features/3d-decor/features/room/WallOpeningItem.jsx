import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { checkCollisionOBB2D } from '../collision/collisionResolver';

/**
 * Model 3D GLTF thực tế của Cửa đi hoặc Cửa sổ thư viện
 * Khắc phục triệt để lỗi Bounding Box bằng THREE.Box3().setFromObject(clone)
 * Ẩn bỏ các mesh tường thừa (_defaultMat) trong file GLTF module Kenney
 */
function GLTFOpeningModel({ modelPath, opW, opH, depth, swingSide = 'left', swingDir = 'inward', openAngle = 70, isWindow = false }) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);

    // 1. Nếu là window từ file GLTF Kenney, ẩn các tấm tường thạch cao thừa (_defaultMat)
    if (isWindow) {
      clone.traverse((child) => {
        if (child.isMesh) {
          const matName = child.material?.name || '';
          if (matName === '_defaultMat') {
            child.visible = false;
          }
        }
      });
    }

    // 2. Tính Bounding Box toàn cục chuẩn xác từ THREE.Box3().setFromObject(clone)
    clone.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(clone);
    const rawSize = new THREE.Vector3();
    bbox.getSize(rawSize);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const rawW = Math.max(0.001, rawSize.x);
    const rawH = Math.max(0.001, rawSize.y);
    const rawD = Math.max(0.001, rawSize.z);

    // Kẹp tỷ lệ an toàn, tối đa không quá 5x để chống vỡ hình
    const scaleX = Math.min(5, opW / rawW);
    const scaleY = Math.min(5, opH / rawH);
    const scaleZ = Math.min(5, depth / rawD);

    const flipX = swingSide === 'right' ? 1 : -1;
    clone.scale.set(scaleX * flipX, scaleY, scaleZ);

    // 3. Đưa tâm X, Z về 0 và đáy Y về 0
    clone.position.set(
      -center.x * scaleX * flipX,
      -bbox.min.y * scaleY,
      -center.z * scaleZ
    );

    // 4. Bật bóng đổ cho tất cả mesh và hỗ trợ xoay mở cánh cửa đi
    const dirMult = swingDir === 'outward' ? 1 : -1;
    clone.traverse((child) => {
      if (child.isMesh && child.visible) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.shadowSide = THREE.DoubleSide;
        }
      }
      const childName = (child.name || '').toLowerCase();
      const isDoorLeaf = childName === 'door' || (childName.includes('door') && !childName.includes('way') && !childName.includes('frame'));
      if (!isWindow && isDoorLeaf) {
        child.rotation.y = dirMult * THREE.MathUtils.degToRad(openAngle || 0);
      }
    });

    return clone;
  }, [scene, opW, opH, depth, swingSide, swingDir, openAngle, isWindow]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁC THÀNH PHẦN CỬA SỔ KIẾN TRÚC PARAMETRIC PBR (ARCHITECTURAL WINDOWS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cửa sổ lùa 2 cánh (Sliding Window): 2 cánh kính so le trượt trên ray nhôm
 */
function SlidingWindowSashes({ innerW, innerH, frameMat, glassMat, handleMat, openAngle = 0 }) {
  const sashThick = 0.035; // 3.5cm profile đố cánh
  const sashDepth = 0.026; // 2.6cm chiều dày cánh
  const sashW = innerW / 2 + 0.015; // Chồng mí 1.5cm ở giữa
  const sashH = innerH - 0.008;

  // Cánh phải trượt sang trái khi mở
  const maxSlide = sashW - 0.08;
  const slideOffset = Math.min(maxSlide, maxSlide * ((openAngle || 0) / 90));

  const leftX = -innerW / 4;
  const rightX = innerW / 4 - slideOffset;
  const trackOffsetZ = 0.016; // khoảng cách 2 ray trượt

  const renderSash = (xPos, zPos, hasHandle, handleOnRight) => {
    const paneW = Math.max(0.01, sashW - sashThick * 2);
    const paneH = Math.max(0.01, sashH - sashThick * 2);
    return (
      <group position={[xPos, 0, zPos]}>
        {/* Khung cánh trên & dưới */}
        <mesh position={[0, sashH / 2 - sashThick / 2, 0]} material={frameMat} castShadow>
          <boxGeometry args={[sashW, sashThick, sashDepth]} />
        </mesh>
        <mesh position={[0, -sashH / 2 + sashThick / 2, 0]} material={frameMat} castShadow>
          <boxGeometry args={[sashW, sashThick, sashDepth]} />
        </mesh>
        {/* Khung cánh trái & phải */}
        <mesh position={[-sashW / 2 + sashThick / 2, 0, 0]} material={frameMat} castShadow>
          <boxGeometry args={[sashThick, paneH, sashDepth]} />
        </mesh>
        <mesh position={[sashW / 2 - sashThick / 2, 0, 0]} material={frameMat} castShadow>
          <boxGeometry args={[sashThick, paneH, sashDepth]} />
        </mesh>

        {/* Kính trong suốt */}
        <mesh position={[0, 0, 0]} material={glassMat}>
          <boxGeometry args={[paneW, paneH, 0.008]} />
        </mesh>

        {/* Tay nắm âm kim loại */}
        {hasHandle && (
          <mesh
            position={[
              handleOnRight ? sashW / 2 - sashThick - 0.01 : -sashW / 2 + sashThick + 0.01,
              0,
              handleOnRight ? sashDepth / 2 + 0.002 : -sashDepth / 2 - 0.002,
            ]}
            material={handleMat}
          >
            <boxGeometry args={[0.012, 0.08, 0.006]} />
          </mesh>
        )}
      </group>
    );
  };

  return (
    <group>
      {/* Ray trượt dưới và trên */}
      <mesh position={[0, -innerH / 2 + 0.004, 0]} material={handleMat}>
        <boxGeometry args={[innerW, 0.006, 0.05]} />
      </mesh>
      <mesh position={[0, innerH / 2 - 0.004, 0]} material={handleMat}>
        <boxGeometry args={[innerW, 0.006, 0.05]} />
      </mesh>

      {/* Cánh trái (Ray trong) */}
      {renderSash(leftX, -trackOffsetZ, true, true)}

      {/* Cánh phải (Ray ngoài - trượt mở) */}
      {renderSash(rightX, trackOffsetZ, true, false)}
    </group>
  );
}

/**
 * Cửa sổ mở quay / mở hất (Casement Window): 2 cánh đối xứng hoặc 1 cánh mở xoay
 */
function CasementWindowSashes({ innerW, innerH, frameD, frameMat, glassMat, handleMat, openAngle = 0 }) {
  const isDouble = innerW >= 1.1; // Cửa sổ từ 1.1m trở lên dùng 2 cánh đối xứng
  const mullionW = 0.035; // Đố giữa
  const sashThick = 0.035;
  const sashDepth = 0.035;
  const rotRad = THREE.MathUtils.degToRad(Math.min(65, (openAngle || 0) * 0.72));

  if (!isDouble) {
    // 1 Cánh mở quay đơn
    const leafW = innerW - 0.008;
    const leafH = innerH - 0.008;
    const paneW = Math.max(0.01, leafW - sashThick * 2);
    const paneH = Math.max(0.01, leafH - sashThick * 2);
    const hingeX = -innerW / 2;

    return (
      <group position={[hingeX, 0, 0]} rotation={[0, -rotRad, 0]}>
        <group position={[leafW / 2, 0, 0]}>
          <mesh position={[0, leafH / 2 - sashThick / 2, 0]} material={frameMat} castShadow>
            <boxGeometry args={[leafW, sashThick, sashDepth]} />
          </mesh>
          <mesh position={[0, -leafH / 2 + sashThick / 2, 0]} material={frameMat} castShadow>
            <boxGeometry args={[leafW, sashThick, sashDepth]} />
          </mesh>
          <mesh position={[-leafW / 2 + sashThick / 2, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[sashThick, paneH, sashDepth]} />
          </mesh>
          <mesh position={[leafW / 2 - sashThick / 2, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[sashThick, paneH, sashDepth]} />
          </mesh>
          <mesh material={glassMat}>
            <boxGeometry args={[paneW, paneH, 0.008]} />
          </mesh>
          {/* Tay nắm gạt chữ L */}
          <group position={[leafW / 2 - sashThick * 1.5, 0, sashDepth / 2 + 0.01]}>
            <mesh material={handleMat}>
              <boxGeometry args={[0.012, 0.08, 0.01]} />
            </mesh>
            <mesh position={[0, -0.03, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={handleMat}>
              <cylinderGeometry args={[0.006, 0.006, 0.04, 12]} />
            </mesh>
          </group>
        </group>
      </group>
    );
  }

  // 2 Cánh mở quay đối xứng
  const leafW = (innerW - mullionW) / 2 - 0.006;
  const leafH = innerH - 0.008;
  const paneW = Math.max(0.01, leafW - sashThick * 2);
  const paneH = Math.max(0.01, leafH - sashThick * 2);

  return (
    <group>
      {/* Đố giữa Mullion */}
      <mesh position={[0, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[mullionW, innerH, frameD]} />
      </mesh>

      {/* Cánh trái (bản lề mép trái - mở quay ra ngoài) */}
      <group position={[-innerW / 2, 0, 0]} rotation={[0, -rotRad, 0]}>
        <group position={[leafW / 2, 0, 0]}>
          <mesh position={[0, leafH / 2 - sashThick / 2, 0]} material={frameMat} castShadow>
            <boxGeometry args={[leafW, sashThick, sashDepth]} />
          </mesh>
          <mesh position={[0, -leafH / 2 + sashThick / 2, 0]} material={frameMat} castShadow>
            <boxGeometry args={[leafW, sashThick, sashDepth]} />
          </mesh>
          <mesh position={[-leafW / 2 + sashThick / 2, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[sashThick, paneH, sashDepth]} />
          </mesh>
          <mesh position={[leafW / 2 - sashThick / 2, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[sashThick, paneH, sashDepth]} />
          </mesh>
          <mesh material={glassMat}>
            <boxGeometry args={[paneW, paneH, 0.008]} />
          </mesh>
          {/* Tay nắm gạt bên phải cánh trái */}
          <mesh position={[leafW / 2 - sashThick - 0.01, 0, sashDepth / 2 + 0.01]} material={handleMat}>
            <boxGeometry args={[0.01, 0.08, 0.015]} />
          </mesh>
        </group>
      </group>

      {/* Cánh phải (bản lề mép phải - mở quay ra ngoài) */}
      <group position={[innerW / 2, 0, 0]} rotation={[0, rotRad, 0]}>
        <group position={[-leafW / 2, 0, 0]}>
          <mesh position={[0, leafH / 2 - sashThick / 2, 0]} material={frameMat} castShadow>
            <boxGeometry args={[leafW, sashThick, sashDepth]} />
          </mesh>
          <mesh position={[0, -leafH / 2 + sashThick / 2, 0]} material={frameMat} castShadow>
            <boxGeometry args={[leafW, sashThick, sashDepth]} />
          </mesh>
          <mesh position={[-leafW / 2 + sashThick / 2, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[sashThick, paneH, sashDepth]} />
          </mesh>
          <mesh position={[leafW / 2 - sashThick / 2, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[sashThick, paneH, sashDepth]} />
          </mesh>
          <mesh material={glassMat}>
            <boxGeometry args={[paneW, paneH, 0.008]} />
          </mesh>
          {/* Tay nắm gạt bên trái cánh phải */}
          <mesh position={[-leafW / 2 + sashThick + 0.01, 0, sashDepth / 2 + 0.01]} material={handleMat}>
            <boxGeometry args={[0.01, 0.08, 0.015]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * Cửa sổ kính lớn tràn viền (Picture Window / Panorama): Tối đa hóa ánh sáng và tầm nhìn
 */
function PictureWindowGlass({ innerW, innerH, glassMat }) {
  return (
    <group>
      <mesh material={glassMat}>
        <boxGeometry args={[innerW, innerH, 0.01]} />
      </mesh>
    </group>
  );
}

/**
 * Cửa sổ chia ô cổ điển kiểu Pháp (Grid / French Window): Nan đố ca-rô thanh lịch
 */
function GridWindowSashes({ innerW, innerH, frameMat, glassMat }) {
  const cols = innerW >= 1.5 ? 3 : 2;
  const rows = innerH >= 1.3 ? 3 : 2;
  const colStep = innerW / cols;
  const rowStep = innerH / rows;
  const barThick = 0.02;

  const colBars = [];
  for (let c = 1; c < cols; c++) {
    colBars.push(-innerW / 2 + c * colStep);
  }

  const rowBars = [];
  for (let r = 1; r < rows; r++) {
    rowBars.push(-innerH / 2 + r * rowStep);
  }

  return (
    <group>
      {/* Tấm kính cường lực liền khối */}
      <mesh material={glassMat}>
        <boxGeometry args={[innerW, innerH, 0.008]} />
      </mesh>

      {/* Các nan đố dọc */}
      {colBars.map((xPos, idx) => (
        <mesh key={`col-${idx}`} position={[xPos, 0, 0]} material={frameMat} castShadow>
          <boxGeometry args={[barThick, innerH, 0.022]} />
        </mesh>
      ))}

      {/* Các nan đố ngang */}
      {rowBars.map((yPos, idx) => (
        <mesh key={`row-${idx}`} position={[0, yPos, 0]} material={frameMat} castShadow>
          <boxGeometry args={[innerW, barThick, 0.022]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Component Cửa Sổ Kiến Trúc Parametric PBR Hiện Đại
 * - Vừa khít 100% với kích thước lỗ khoét tường [opW, opH, depth]
 * - Không bị méo mó đố khung dù kích thước thay đổi linh hoạt (0.6m -> 3.0m)
 */
function ArchitecturalWindow({
  opW = 1.2,
  opH = 1.2,
  depth = 0.17,
  windowStyle = 'sliding',
  frameColor = '#1e293b',
  openAngle = 0,
}) {
  const outerThick = 0.045; // 4.5cm profile khung bao ngoài
  const innerW = Math.max(0.1, opW - outerThick * 2);
  const innerH = Math.max(0.1, opH - outerThick * 2);

  const frameMat = useMemo(() => {
    const isWood = frameColor.startsWith('#8') || frameColor.startsWith('#a');
    return new THREE.MeshStandardMaterial({
      color: frameColor || '#1e293b',
      roughness: isWood ? 0.5 : 0.28,
      metalness: isWood ? 0.05 : 0.5,
    });
  }, [frameColor]);

  const glassMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#cbe7f8',
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.65,
      ior: 1.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  const handleMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.9,
      roughness: 0.2,
    });
  }, []);

  return (
    <group position={[0, opH / 2, 0]}>
      {/* ── 1. KHUNG BAO NGOÀI (Master Outer Frame) ── */}
      <mesh position={[0, opH / 2 - outerThick / 2, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[opW, outerThick, depth]} />
      </mesh>
      <mesh position={[0, -opH / 2 + outerThick / 2, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[opW, outerThick, depth]} />
      </mesh>
      <mesh position={[-opW / 2 + outerThick / 2, 0, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[outerThick, innerH, depth]} />
      </mesh>
      <mesh position={[opW / 2 - outerThick / 2, 0, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[outerThick, innerH, depth]} />
      </mesh>

      {/* Gờ bậu cửa ngoại thất chìa nhẹ ra ngoài tường */}
      <mesh position={[0, -opH / 2 + outerThick / 4, -depth / 2 - 0.015]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[opW + 0.04, 0.02, 0.03]} />
      </mesh>

      {/* ── 2. CÁNH CỬA & KÍNH THEO TỪNG KIỂU DÁNG ── */}
      {windowStyle === 'casement' ? (
        <CasementWindowSashes
          innerW={innerW}
          innerH={innerH}
          frameD={depth}
          frameMat={frameMat}
          glassMat={glassMat}
          handleMat={handleMat}
          openAngle={openAngle}
        />
      ) : windowStyle === 'picture' ? (
        <PictureWindowGlass
          innerW={innerW}
          innerH={innerH}
          glassMat={glassMat}
        />
      ) : windowStyle === 'grid' ? (
        <GridWindowSashes
          innerW={innerW}
          innerH={innerH}
          frameMat={frameMat}
          glassMat={glassMat}
        />
      ) : (
        <SlidingWindowSashes
          innerW={innerW}
          innerH={innerH}
          frameMat={frameMat}
          glassMat={glassMat}
          handleMat={handleMat}
          openAngle={openAngle}
        />
      )}
    </group>
  );
}

/**
 * Component hiển thị Cửa đi hoặc Cửa sổ như một đối tượng 3D/2D tương tác thực thụ:
 * - Cửa sổ: Cửa sổ kiến trúc Parametric PBR tự động co giãn vừa khít 100% không bao giờ bị méo
 * - Cửa đi: Model 3D thực tế (/furniture/doorway.glb, /furniture/doorwayFront.glb)
 * - Tùy chỉnh hướng mở cửa (swingSide: trái/phải, swingDir: trong/ngoài)
 * - Kiểm tra va chạm vùng quét mở cửa với đồ nội thất
 * - Vẽ ký hiệu kỹ thuật CAD 2D ở chế độ 2D
 * - Có thể click chọn, đổi màu highlight và bấm phím Delete để xóa
 */
export function WallOpeningItem({ op, segData }) {
  const selectedOpeningId = useSceneStore((state) => state.selectedOpeningId);
  const selectOpening = useSceneStore((state) => state.selectOpening);
  const selectItem = useSceneStore((state) => state.selectItem);
  const items = useSceneStore((state) => state.items);
  const activeTab = useEditorStore((state) => state.activeTab);
  const floorPlan2DMode = useEditorStore((state) => state.floorPlan2DMode);
  const wgRemoveOpening = useSceneStore((state) => state.wgRemoveOpening);
  const wgUpdateOpening = useSceneStore((state) => state.wgUpdateOpening);

  const sw = segData?.sw;
  const isSelected = selectedOpeningId === op.id;
  const is2D = activeTab === '2d-plan';
  const isWindow = op.type === 'window';

  const u = Math.max(0, Math.min(1, op.u ?? 0.5));
  const cx = sw ? sw.start.x + u * (sw.end.x - sw.start.x) : 0;
  const cz = sw ? sw.start.z + u * (sw.end.z - sw.start.z) : 0;
  const opW = op.width ?? (isWindow ? 1.2 : 0.9);
  const opH = op.height ?? (isWindow ? 1.2 : 2.1);
  const opElev = op.elevation ?? (isWindow ? 0.9 : 0);

  const swingSide = op.swingSide || 'left';
  const swingDir = op.swingDir || 'inward';
  const openAngle = op.openAngle ?? (isWindow ? 0 : 75);

  const angleY = sw ? Math.atan2(-sw.dir.z, sw.dir.x) : 0;
  const frameThick = 0.04;
  const frameDepth = (sw?.thickness || 0.15) + 0.02;

  // Kiểm tra nếu người dùng chọn model GLTF riêng
  const useGLTF = !!(op.modelPath && op.modelPath.endsWith('.glb'));
  const defaultModelPath = op.modelPath || (isWindow ? '/furniture/wallWindowSlide.glb' : '/furniture/doorway.glb');
  const windowStyle = op.windowStyle || 'sliding';
  const windowFrameColor = op.frameColor || '#1e293b';

  // ── Kiểm tra va chạm vùng quét mở cánh cửa với đồ nội thất ──
  const isDoorColliding = useMemo(() => {
    if (!sw) return false;
    if (op.type !== 'door' || openAngle === 0) return false;

    const inwardSign = swingDir === 'inward' ? 1 : -1;
    const normX = sw.normal.x * inwardSign;
    const normZ = sw.normal.z * inwardSign;

    const zoneCenterX = cx + normX * (opW / 2);
    const zoneCenterZ = cz + normZ * (opW / 2);

    const doorSweepItem = {
      instanceId: `door-sweep-${op.id}`,
      position: [zoneCenterX, 0, zoneCenterZ],
      dimensions: { width: opW, height: opH, depth: opW },
      rotation: [0, angleY, 0],
    };

    for (const item of items) {
      if (checkCollisionOBB2D(doorSweepItem, item, -0.05)) {
        return true;
      }
    }
    return false;
  }, [op, cx, cz, opW, opH, swingDir, openAngle, sw, angleY, items]);

  if (!sw) return null;

  const frameColor = isDoorColliding
    ? '#ef4444'
    : isSelected
    ? '#3b82f6'
    : isWindow
    ? windowFrameColor
    : '#854d0e';

  // Click chọn cửa/cửa sổ trực tiếp
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (floorPlan2DMode === 'delete') {
      wgRemoveOpening(op.id);
      return;
    }

    if (isSelected && op.type === 'door') {
      const currentAngle = op.openAngle ?? 75;
      wgUpdateOpening(op.id, { openAngle: currentAngle > 0 ? 0 : 75 });
    } else {
      selectOpening(op.id);
      selectItem(null);
    }
  };

  return (
    <group
      position={[cx, 0, cz]}
      rotation={[0, angleY, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* ── 1. Ký hiệu CAD 2D ở chế độ Mặt bằng 2D ── */}
      {is2D ? (
        <group position={[0, 0.04, 0]}>
          {/* Hit box tàng hình giúp click chọn cửa/cửa sổ cực nhạy trong 2D */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[opW + 0.1, 0.2, frameDepth + 0.1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {op.type === 'door' ? (
            /* Cửa đi 2D: Lỗ mở + Cánh cửa mở + Cung xoay 90 độ */
            <group>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[opW, frameDepth]} />
                <meshBasicMaterial color={isSelected ? '#1e3a8a' : '#0f172a'} />
              </mesh>

              {(() => {
                const isOpen = openAngle > 0;
                const hingeX = swingSide === 'left' ? opW / 2 : -opW / 2;
                const doorDirZ = swingDir === 'inward' ? opW / 2 : -opW / 2;

                if (!isOpen) {
                  return (
                    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <planeGeometry args={[opW - 0.02, 0.04]} />
                      <meshBasicMaterial color={isSelected ? '#60a5fa' : '#38bdf8'} />
                    </mesh>
                  );
                }

                return (
                  <>
                    <mesh position={[hingeX + (swingSide === 'left' ? -0.02 : 0.02), 0.01, doorDirZ]} rotation={[-Math.PI / 2, 0, 0]}>
                      <planeGeometry args={[0.04, opW]} />
                      <meshBasicMaterial color={isDoorColliding ? '#ef4444' : isSelected ? '#60a5fa' : '#38bdf8'} />
                    </mesh>

                    {/* Cung xoay cánh cửa */}
                    <mesh
                      position={[hingeX, 0.01, 0]}
                      rotation={[-Math.PI / 2, 0, swingSide === 'left' ? (swingDir === 'inward' ? Math.PI : Math.PI / 2) : (swingDir === 'inward' ? -Math.PI / 2 : 0)]}
                    >
                      <ringGeometry args={[opW - 0.02, opW, 24, 1, 0, Math.PI / 2]} />
                      <meshBasicMaterial
                        color={isDoorColliding ? '#f87171' : isSelected ? '#60a5fa' : '#64748b'}
                        side={THREE.DoubleSide}
                      />
                    </mesh>

                    {/* Vùng quét mở cửa cảnh báo va chạm màu đỏ */}
                    {isDoorColliding && (
                      <mesh position={[0, 0.005, doorDirZ]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[opW, opW]} />
                        <meshBasicMaterial color="#ef4444" transparent opacity={0.2} side={THREE.DoubleSide} />
                      </mesh>
                    )}
                  </>
                );
              })()}
            </group>
          ) : (
            /* Cửa sổ 2D: 3 đường song song kỹ thuật CAD */
            <group>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[opW, frameDepth]} />
                <meshBasicMaterial color={isSelected ? '#1e3a8a' : '#0f172a'} />
              </mesh>
              {[-frameDepth * 0.35, 0, frameDepth * 0.35].map((offsetZ, idx) => (
                <mesh key={idx} position={[0, 0.01, offsetZ]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[opW, idx === 1 ? 0.03 : 0.015]} />
                  <meshBasicMaterial color={isSelected ? '#60a5fa' : '#38bdf8'} />
                </mesh>
              ))}
            </group>
          )}

          {/* Viền highlight khi chọn ở 2D */}
          {isSelected && (
            <lineSegments position={[0, 0.02, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(opW + 0.06, 0.02, frameDepth + 0.06)]} />
              <lineBasicMaterial color={isDoorColliding ? '#ef4444' : '#60a5fa'} linewidth={3} />
            </lineSegments>
          )}
        </group>
      ) : (
        /* ── 2. Dựng Model 3D thực tế ở chế độ 3D ── */
        <group position={[0, opElev, 0]}>
          {/* Hit box tàng hình 3D bắt trọn toàn bộ khung và khoảng trống cửa/cửa sổ */}
          <mesh position={[0, opH / 2, 0]}>
            <boxGeometry args={[opW + 0.08, opH + 0.08, frameDepth + 0.08]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {isWindow && !useGLTF ? (
            /* Cửa sổ kiến trúc Parametric PBR sắc nét, khớp 100% lỗ mở */
            <ArchitecturalWindow
              opW={opW}
              opH={opH}
              depth={frameDepth}
              windowStyle={windowStyle}
              frameColor={windowFrameColor}
              openAngle={openAngle}
              isSelected={isSelected}
            />
          ) : (
            <Suspense
              fallback={
                <group position={[0, opH / 2, 0]}>
                  <mesh position={[0, opH / 2 - frameThick / 2, 0]}>
                    <boxGeometry args={[opW, frameThick, frameDepth]} />
                    <meshStandardMaterial color={frameColor} roughness={0.5} />
                  </mesh>
                  <mesh position={[-opW / 2 + frameThick / 2, 0, 0]}>
                    <boxGeometry args={[frameThick, opH, frameDepth]} />
                    <meshStandardMaterial color={frameColor} roughness={0.5} />
                  </mesh>
                  <mesh position={[opW / 2 - frameThick / 2, 0, 0]}>
                    <boxGeometry args={[frameThick, opH, frameDepth]} />
                    <meshStandardMaterial color={frameColor} roughness={0.5} />
                  </mesh>
                  {isWindow && (
                    <mesh position={[0, 0, 0]}>
                      <boxGeometry args={[opW - frameThick * 2, opH - frameThick * 2, 0.008]} />
                      <meshStandardMaterial color="#38bdf8" transparent opacity={0.35} roughness={0.05} />
                    </mesh>
                  )}
                </group>
              }
            >
              <GLTFOpeningModel
                modelPath={defaultModelPath}
                opW={opW}
                opH={opH}
                depth={frameDepth}
                swingSide={swingSide}
                swingDir={swingDir}
                openAngle={openAngle}
                isWindow={isWindow}
              />
            </Suspense>
          )}

          {/* Vùng quét mở cửa cảnh báo va chạm màu đỏ ở 3D */}
          {isDoorColliding && (
            <mesh position={[0, 0.02, swingDir === 'inward' ? opW / 2 : -opW / 2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[opW, opW]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.25} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Viền highlight khi được chọn ở 3D */}
          {isSelected && (
            <lineSegments position={[0, opH / 2, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(opW + 0.04, opH + 0.04, frameDepth + 0.04)]} />
              <lineBasicMaterial color={isDoorColliding ? '#ef4444' : '#3b82f6'} linewidth={2} />
            </lineSegments>
          )}
        </group>
      )}
    </group>
  );
}
