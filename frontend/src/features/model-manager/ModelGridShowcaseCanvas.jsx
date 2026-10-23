import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Focus,
  Box,
  Layers,
} from 'lucide-react';

/**
 * GLTF Sub-component that unconditionally calls useGLTF
 * Scale UNIFORM 100% bảo toàn tỉ lệ hình học tự nhiên của mô hình, không làm méo mó thành hình lập phương.
 */
function GLTFMeshViewer({ modelUrl, model, onModelMeasured }) {
  const gltf = useGLTF(modelUrl);

  const { clonedScene, dims } = useMemo(() => {
    if (!gltf?.scene) {
      const fallbackDims = {
        width: model.dimensionX || (Array.isArray(model.dimensions) ? model.dimensions[0] : model.dimensions?.width) || 1.0,
        height: model.dimensionY || (Array.isArray(model.dimensions) ? model.dimensions[1] : model.dimensions?.height) || 1.0,
        depth: model.dimensionZ || (Array.isArray(model.dimensions) ? model.dimensions[2] : model.dimensions?.depth) || 1.0,
      };
      return { clonedScene: null, dims: fallbackDims };
    }

    const clone = gltf.scene.clone(true);
    clone.updateMatrixWorld(true);

    const bbox = new THREE.Box3().setFromObject(clone);
    const rawSize = new THREE.Vector3();
    bbox.getSize(rawSize);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // 1. Tự động nhận diện đơn vị xuất của tệp 3D (mm, cm, m)
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
    let unitScale = 1.0;
    if (maxDim > 500) {
      unitScale = 0.001; // Hệ milimet (mm -> m)
    } else if (maxDim > 25) {
      unitScale = 0.01;  // Hệ centimet (cm -> m)
    } else if (maxDim < 0.08 && maxDim > 0) {
      unitScale = 10.0;  // Tỉ lệ thu nhỏ
    }

    // 2. Kích thước thật tự nhiên tính bằng mét (W, H, D)
    const naturalWidth = Math.max(0.05, +(rawSize.x * unitScale).toFixed(2));
    const naturalHeight = Math.max(0.05, +(rawSize.y * unitScale).toFixed(2));
    const naturalDepth = Math.max(0.05, +(rawSize.z * unitScale).toFixed(2));

    // 3. Giữ nguyên 100% tỉ lệ thật (UNIFORM SCALE) - Không bao giờ scale x,y,z độc lập
    let uniformScale = unitScale;
    const realMaxDim = Math.max(naturalWidth, naturalHeight, naturalDepth);
    // Nếu mô hình quá lớn (ví dụ > 2.2m), scale vừa vặn bệ trưng bày để không lấn sang ô bên cạnh
    if (realMaxDim > 2.2) {
      uniformScale = unitScale * (2.2 / realMaxDim);
    }

    clone.scale.set(uniformScale, uniformScale, uniformScale);

    // 4. Căn tâm đáy tại [0, 0, 0]: X, Z ở giữa, đáy Y chạm mặt sàn/bệ
    const offsetX = -center.x * uniformScale;
    const offsetY = -bbox.min.y * uniformScale;
    const offsetZ = -center.z * uniformScale;

    clone.position.set(offsetX, offsetY, offsetZ);

    // 5. Cải thiện bóng đổ và vật liệu
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.shadowSide = THREE.DoubleSide;
        }
      }
    });

    const calculatedDims = {
      width: naturalWidth,
      height: naturalHeight,
      depth: naturalDepth,
    };

    return {
      clonedScene: clone,
      dims: calculatedDims,
    };
  }, [gltf, model]);

  useEffect(() => {
    if (dims && onModelMeasured && model.id) {
      onModelMeasured(model.id, dims);
    }
  }, [dims, onModelMeasured, model.id]);

  return clonedScene ? <primitive object={clonedScene} /> : null;
}

/**
 * Single Model 3D Showcase Item with Pedestal & CAD Badge
 */
function ShowcaseItem({
  model,
  position,
  isSelected,
  onSelect,
  onModelMeasured,
}) {
  const [hovered, setHovered] = useState(false);
  const modelUrl = model.blobUrl || model.modelPath;
  const isWallMount = model.mountType === 'wall';

  const dims = useMemo(() => {
    return {
      width: model.dimensionX || (Array.isArray(model.dimensions) ? model.dimensions[0] : model.dimensions?.width) || 1.0,
      height: model.dimensionY || (Array.isArray(model.dimensions) ? model.dimensions[1] : model.dimensions?.height) || 1.0,
      depth: model.dimensionZ || (Array.isArray(model.dimensions) ? model.dimensions[2] : model.dimensions?.depth) || 1.0,
    };
  }, [model]);

  // Bệ đỡ theo kích thước thật vừa vặn
  const platformRadius = Math.max(0.65, Math.max(dims.width, dims.depth) * 0.55);

  return (
    <group position={position}>
      {/* 1. Sleek Modern Architectural Plinth */}
      <mesh
        position={[0, -0.015, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(model);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[platformRadius, platformRadius * 1.04, 0.03, 32]} />
        <meshStandardMaterial
          color={isSelected ? '#1e293b' : hovered ? '#1e293b' : '#0f172a'}
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>

      {/* Subtle Glowing Indicator Ring */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[platformRadius * 0.94, platformRadius * 1.01, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#f59e0b' : hovered ? '#38bdf8' : '#334155'}
          side={THREE.DoubleSide}
          transparent
          opacity={isSelected ? 1.0 : hovered ? 0.75 : 0.25}
        />
      </mesh>

      {/* Wall Panel for Wall-Mounted Items */}
      {isWallMount && (
        <group position={[0, dims.height / 2 + 0.08, -dims.depth / 2 - 0.03]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[dims.width + 0.25, dims.height + 0.35, 0.03]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.016]}>
            <planeGeometry args={[dims.width + 0.22, dims.height + 0.32]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* 2. 3D Model with True Proportions */}
      <group
        rotation={[0, model.rotationY || 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(model);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {modelUrl ? (
          <Suspense
            fallback={
              <mesh position={[0, dims.height / 2, 0]}>
                <boxGeometry args={[dims.width, dims.height, dims.depth]} />
                <meshStandardMaterial color="#334155" wireframe />
              </mesh>
            }
          >
            <GLTFMeshViewer
              modelUrl={modelUrl}
              model={model}
              onModelMeasured={onModelMeasured}
            />
          </Suspense>
        ) : (
          <mesh position={[0, dims.height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[dims.width, dims.height, dims.depth]} />
            <meshStandardMaterial
              color={isSelected ? '#f59e0b' : '#38bdf8'}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
        )}
      </group>

      {/* 3. Subtle Selection Box Accent */}
      {isSelected && (
        <mesh position={[0, dims.height / 2, 0]}>
          <boxGeometry
            args={[
              dims.width + 0.06,
              dims.height + 0.06,
              dims.depth + 0.06,
            ]}
          />
          <meshBasicMaterial
            color="#f59e0b"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
      )}

      {/* 4. Smart CAD Badge: Chỉ hiển thị khi Hover hoặc Được Chọn */}
      {(hovered || isSelected) && (
        <Html position={[0, -0.05, platformRadius + 0.15]} center distanceFactor={10}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(model);
            }}
            className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-2xl border backdrop-blur-xl transition-all transform select-none ${
              isSelected
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 ring-4 ring-amber-500/20 shadow-amber-500/30 scale-105'
                : 'bg-slate-900/95 text-slate-100 border-slate-700/80 shadow-black/80 hover:border-amber-400/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-[12px]">{model.name || model.code}</span>
              {model.tier === 'premium' && (
                <span className="px-1.5 py-0.2 rounded bg-amber-950/90 text-amber-300 border border-amber-500/50 text-[9px] font-bold">
                  PRO
                </span>
              )}
            </div>
            <div className="text-[10px] opacity-85 font-mono mt-0.5 flex items-center gap-1.5">
              <span>{dims.width} × {dims.height} × {dims.depth} m</span>
              <span className="opacity-40">•</span>
              <span className="capitalize">{model.category || 'Nội thất'}</span>
              {model.style === 'realistic' && (
                <span className="text-amber-400 font-bold">• PBR</span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Controller di chuyển camera mượt mà khi người dùng click chọn mô hình.
 */
function CameraFocusController({ targetPosition, controlsRef }) {
  const { camera } = useThree();
  const animatingRef = useRef(false);
  const targetVecRef = useRef(new THREE.Vector3(0, 0, 0));
  const desiredCamPosRef = useRef(new THREE.Vector3(0, 5.5, 7.5));
  const progressRef = useRef(1);

  useEffect(() => {
    if (!targetPosition) return;

    targetVecRef.current.set(...targetPosition);
    // Vị trí camera cận cảnh vừa vặn, góc nhìn 3D trực quan
    desiredCamPosRef.current
      .copy(targetVecRef.current)
      .add(new THREE.Vector3(1.8, 1.4, 2.2));

    animatingRef.current = true;
    progressRef.current = 0;
  }, [targetPosition]);

  useFrame((_, delta) => {
    if (!animatingRef.current) return;

    progressRef.current += delta * 2.8;
    camera.position.lerp(desiredCamPosRef.current, 0.12);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(
        targetVecRef.current.clone().add(new THREE.Vector3(0, 0.45, 0)),
        0.12
      );
      controlsRef.current.update();
    }

    if (progressRef.current >= 1.0) {
      animatingRef.current = false;
    }
  });

  return null;
}

/**
 * Canvas Lưới 3D Trưng Bày Đồ Nội Thất
 */
export function ModelGridShowcaseCanvas({
  models = [],
  selectedModelId,
  onSelectModel,
  onModelMeasured,
  defaultSpacing = 2.6,
  onToggleFullscreen,
}) {
  const controlsRef = useRef();
  const [spacing, setSpacing] = useState(defaultSpacing);

  const displayedModels = models;

  const cols = Math.max(1, Math.ceil(Math.sqrt(displayedModels.length || 1)));
  const rows = Math.ceil((displayedModels.length || 1) / cols);

  const selectedIndex = displayedModels.findIndex((m) => m.id === selectedModelId);

  const selectedTargetPos = useMemo(() => {
    if (selectedIndex < 0) return null;
    const row = Math.floor(selectedIndex / cols);
    const col = selectedIndex % cols;
    const posX = (col - (cols - 1) / 2) * spacing;
    const posZ = (row - (rows - 1) / 2) * spacing;
    return [posX, 0, posZ];
  }, [selectedIndex, cols, rows, spacing]);

  // Kích thước bán kính tổng thể của lưới
  const gridSpanX = (cols - 1) * spacing;
  const gridSpanZ = (rows - 1) * spacing;
  const gridRadius = Math.max(gridSpanX, gridSpanZ) * 0.5 + spacing;
  const gridSize = Math.max(20, Math.max(cols, rows) * spacing + 12);

  // Vị trí camera bao quát toàn bộ bộ sưu tập
  const overviewDistance = Math.max(12, gridRadius * 1.55);

  const handlePresetView = (preset) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;

    const centerTarget = new THREE.Vector3(0, 0.4, 0);
    controls.target.copy(centerTarget);

    switch (preset) {
      case 'overview':
        camera.position.set(0, overviewDistance * 0.65, overviewDistance * 0.95);
        break;
      case 'iso':
        camera.position.set(overviewDistance * 0.7, overviewDistance * 0.7, overviewDistance * 0.7);
        break;
      case 'top':
        camera.position.set(0, overviewDistance * 1.3, 0.001);
        break;
      case 'focus':
        if (selectedTargetPos) {
          camera.position.set(selectedTargetPos[0] + 1.8, 1.4, selectedTargetPos[2] + 2.2);
          controls.target.set(selectedTargetPos[0], 0.45, selectedTargetPos[2]);
        } else {
          camera.position.set(0, 3.2, 4.5);
        }
        break;
      default:
        camera.position.set(0, overviewDistance * 0.65, overviewDistance * 0.95);
        break;
    }
    controls.update();
  };

  const handleZoom = (delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;
    const factor = delta > 0 ? 0.8 : 1.25;
    camera.position.lerp(controls.target, 1 - factor);
    controls.update();
  };

  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId) || null;
  }, [models, selectedModelId]);

  return (
    <div className="relative w-full h-full bg-slate-950 select-none overflow-hidden font-sans">
      <Canvas
        shadows
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, overviewDistance * 0.65, overviewDistance * 0.95], fov: 45, near: 0.1, far: 300 }}
      >
        <color attach="background" args={['#080c16']} />

        {/* Hệ Thống Chiếu Sáng Studio Chân Thực */}
        <hemisphereLight
          color="#ffffff"
          groundColor="#0f172a"
          intensity={1.1}
        />
        <ambientLight intensity={0.9} />

        <directionalLight
          position={[16, 26, 18]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-camera-left={-gridSize / 1.5}
          shadow-camera-right={gridSize / 1.5}
          shadow-camera-top={gridSize / 1.5}
          shadow-camera-bottom={-gridSize / 1.5}
          shadow-bias={-0.0002}
        />

        <directionalLight
          position={[-16, 14, -16]}
          intensity={0.8}
          color="#93c5fd"
        />

        {/* Sàn Lưới Hiện Đại */}
        <gridHelper
          args={[gridSize, Math.floor(gridSize / (spacing / 2)), '#334155', '#131b2e']}
          position={[0, -0.018, 0]}
        />
        <mesh position={[0, -0.022, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[gridSize * 2, gridSize * 2]} />
          <shadowMaterial opacity={0.4} />
        </mesh>

        {displayedModels.map((model, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const posX = (col - (cols - 1) / 2) * spacing;
          const posZ = (row - (rows - 1) / 2) * spacing;

          return (
            <ShowcaseItem
              key={model.id}
              model={model}
              position={[posX, 0, posZ]}
              isSelected={model.id === selectedModelId}
              onSelect={onSelectModel}
              onModelMeasured={onModelMeasured}
            />
          );
        })}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.07}
          minDistance={0.8}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />

        <CameraFocusController
          targetPosition={selectedTargetPos}
          controlsRef={controlsRef}
        />
      </Canvas>

      {/* Floating HUD Trên Cùng Trái: Thống kê & Tuỳ chỉnh khoảng cách */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-200 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white text-[13px]">
              Lưới 3D ({displayedModels.length} mô hình)
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700"></div>

          {/* Spacing Toggle */}
          <button
            type="button"
            onClick={() => setSpacing(spacing === 2.6 ? 3.4 : 2.6)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              spacing === 2.6
                ? 'bg-slate-800 text-amber-300 border-amber-500/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Đổi khoảng cách giữa các mô hình (Gọn 2.6m / Thoáng 3.4m)"
          >
            {spacing === 2.6 ? 'Lưới Gọn (2.6m)' : 'Lưới Thoáng (3.4m)'}
          </button>
        </div>
      </div>

      {/* Floating Pill Đang Chọn Mô Hình (Góc Trên Phải) */}
      {selectedModel && (
        <div className="absolute top-3 right-3 sm:right-16 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-500/40 text-xs shadow-2xl animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
          <span className="text-slate-300">Đang chọn:</span>
          <span className="font-bold text-amber-300 truncate max-w-[180px]">
            {selectedModel.name || selectedModel.code}
          </span>
          <button
            type="button"
            onClick={() => onSelectModel(selectedModel)}
            className="ml-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
          >
            Chi tiết
          </button>
        </div>
      )}

      {/* Floating Action Controls Góc Dưới Trái: Camera Presets & Zoom */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-xs shadow-2xl">
        <button
          type="button"
          onClick={() => handlePresetView('overview')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition font-medium text-xs"
          title="Toàn cảnh lưới mô hình"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Toàn Cảnh</span>
        </button>
        <button
          type="button"
          onClick={() => handlePresetView('focus')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition font-medium text-xs"
          title="Cận cảnh mô hình đang chọn"
        >
          <Focus className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Cận Cảnh</span>
        </button>
        <button
          type="button"
          onClick={() => handlePresetView('iso')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition font-medium text-xs"
          title="Góc chiếu đẳng cự 45°"
        >
          <Box className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Đẳng Cự</span>
        </button>
        <button
          type="button"
          onClick={() => handlePresetView('top')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition font-medium text-xs"
          title="Nhìn từ trên cao xuống mặt bằng"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Mặt Bằng</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700 my-auto mx-0.5"></div>

        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
