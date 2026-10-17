import React, { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import {
  RotateCcw,
  RotateCw,
  Camera,
  Layers,
  Check,
  Tag,
  Box,
  Sliders,
  DollarSign,
  Play,
  Pause,
  AlertCircle,
  Compass,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { captureCanvasThumbnail } from './thumbnailCaptureHelper';

/**
 * 3D Turntable Model Preview Component
 * Scale UNIFORM 100% bảo toàn tỉ lệ hình học tự nhiên của mô hình
 */
function TurntableModel({ modelUrl, rotationY, autoRotate, model }) {
  const gltf = useGLTF(modelUrl);
  const groupRef = useRef();

  const clonedScene = useMemo(() => {
    if (!gltf?.scene) return null;
    const clone = gltf.scene.clone(true);
    clone.updateMatrixWorld(true);

    const bbox = new THREE.Box3().setFromObject(clone);
    const rawSize = new THREE.Vector3();
    bbox.getSize(rawSize);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // 1. Tự động nhận diện đơn vị xuất (mm, cm, m)
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
    let unitScale = 1.0;
    if (maxDim > 500) {
      unitScale = 0.001; // Hệ milimet (mm -> m)
    } else if (maxDim > 25) {
      unitScale = 0.01;  // Hệ centimet (cm -> m)
    } else if (maxDim < 0.08 && maxDim > 0) {
      unitScale = 10.0;
    }

    // 2. Uniform scale vừa vặn khung turntable mà tuyệt đối không bóp méo hình dạng
    const realMax = maxDim * unitScale;
    const fitFactor = realMax > 0 ? 1.5 / realMax : 1.0;
    const uniformScale = unitScale * fitFactor;

    clone.scale.set(uniformScale, uniformScale, uniformScale);

    const offsetX = -center.x * uniformScale;
    const offsetY = -bbox.min.y * uniformScale;
    const offsetZ = -center.z * uniformScale;

    clone.position.set(offsetX, offsetY, offsetZ);

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

    return clone;
  }, [gltf, model]);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.8;
    }
  });

  return clonedScene ? (
    <group ref={groupRef} rotation={[0, rotationY || 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  ) : null;
}

export function ModelInspectorPanel({
  model,
  collections = [],
  onChange,
  onRotate,
  onCaptureThumbnail,
  onClose,
}) {
  const canvasRef = useRef(null);
  const [rotationY, setRotationY] = useState(model?.rotationY || 0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'specs' | 'pricing' | 'json'
  const [captureFeedback, setCaptureFeedback] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [jsonText, setJsonText] = useState(
    model?.metadata ? JSON.stringify(model.metadata, null, 2) : '{\n  "customizableMeshes": [],\n  "emissive": { "hasLight": false }\n}'
  );
  const [jsonError, setJsonError] = useState(null);

  if (!model) return null;

  if (isCollapsed) {
    return (
      <div className="absolute right-0 top-16 z-30">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-800 text-amber-400 px-3.5 py-2 rounded-l-xl border-l border-t border-b border-slate-700 shadow-2xl backdrop-blur-md text-xs font-bold transition transform hover:-translate-x-1"
          title="Mở rộng chi tiết mô hình"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="truncate max-w-[140px]">{model.name || model.code}</span>
        </button>
      </div>
    );
  }

  const modelUrl = model.blobUrl || model.modelPath;

  const handleRotate = (angleRad) => {
    const newRot = (rotationY + angleRad) % (Math.PI * 2);
    setRotationY(newRot);
    if (onRotate) onRotate(newRot);
    if (onChange) onChange({ ...model, rotationY: newRot });
  };

  const handleResetRotation = () => {
    setRotationY(0);
    if (onRotate) onRotate(0);
    if (onChange) onChange({ ...model, rotationY: 0 });
  };

  const handleCapture = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const thumbData = captureCanvasThumbnail(canvas, 'image/png');
    if (thumbData) {
      if (onCaptureThumbnail) onCaptureThumbnail(thumbData);
      if (onChange) {
        onChange({
          ...model,
          thumbnailDataUrl: thumbData,
          thumbnailPath: thumbData,
        });
      }
      setCaptureFeedback(true);
      setTimeout(() => setCaptureFeedback(false), 2200);
    }
  };

  const handleFieldChange = (field, value) => {
    if (onChange) {
      onChange({
        ...model,
        [field]: value,
      });
    }
  };

  const handleDimensionChange = (axis, val) => {
    const num = Math.max(0.05, parseFloat(val) || 0.1);
    const updatedDims = {
      ...(model.dimensions || {}),
      width: axis === 'x' ? num : (model.dimensions?.width || model.dimensionX || 1),
      height: axis === 'y' ? num : (model.dimensions?.height || model.dimensionY || 1),
      depth: axis === 'z' ? num : (model.dimensions?.depth || model.dimensionZ || 1),
    };

    if (onChange) {
      onChange({
        ...model,
        dimensionX: updatedDims.width,
        dimensionY: updatedDims.height,
        dimensionZ: updatedDims.depth,
        dimensions: updatedDims,
      });
    }
  };

  const handleJsonChange = (e) => {
    const val = e.target.value;
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setJsonError(null);
      if (onChange) onChange({ ...model, metadata: parsed });
    } catch {
      setJsonError('Cú pháp JSON chưa hợp lệ');
    }
  };

  return (
    <div className="w-80 md:w-[380px] bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl z-30 select-none font-sans">
      {/* 1. Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 truncate max-w-[190px]">
              {model.name || model.code}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[190px]">
              Mã: {model.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Thu gọn panel để mở rộng không gian 3D"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Đóng chi tiết"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Khung Xem Trước 3D Turntable Studio */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
          <div ref={canvasRef} className="h-52 w-full bg-slate-950">
            <Canvas
              shadows
              gl={{
                preserveDrawingBuffer: true,
                antialias: true,
                alpha: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.15,
              }}
              camera={{ position: [2.5, 2.0, 2.8], fov: 38 }}
            >
              <hemisphereLight color="#ffffff" groundColor="#1e293b" intensity={0.9} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[6, 12, 7]} intensity={2.0} castShadow />
              <directionalLight position={[-6, 6, -6]} intensity={0.8} color="#93c5fd" />
              <gridHelper args={[10, 20, '#334155', '#172033']} position={[0, -0.01, 0]} />

              <Suspense
                fallback={
                  <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    <meshStandardMaterial color="#334155" wireframe />
                  </mesh>
                }
              >
                {modelUrl && (
                  <TurntableModel
                    modelUrl={modelUrl}
                    rotationY={rotationY}
                    autoRotate={autoRotate}
                    model={model}
                  />
                )}
              </Suspense>

              <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={1.0}
                maxDistance={12}
                maxPolarAngle={Math.PI / 2 - 0.02}
              />
            </Canvas>
          </div>

          {/* Quick Floating Status Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[10px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Góc quay: {Math.round((rotationY * 180) / Math.PI)}°</span>
          </div>

          {/* Toast Notification khi chụp Thumbnail */}
          {captureFeedback && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs shadow-xl animate-bounce">
              <Check className="w-3.5 h-3.5" /> Đã lưu Thumbnail!
            </div>
          )}

          {/* Thumbnail Preview nhỏ góc dưới */}
          {(model.thumbnailDataUrl || model.thumbnailPath) && (
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-xl flex items-center gap-2">
              <img
                src={model.thumbnailDataUrl || model.thumbnailPath}
                alt="Thumbnail"
                className="w-8 h-8 rounded object-contain bg-slate-950"
              />
              <span className="text-[10px] text-slate-400 pr-1.5">Ảnh xem trước</span>
            </div>
          )}
        </div>

        {/* Thanh Điều Khiển Xoay & Chụp Thumbnail Chống Ngược */}
        <div className="mt-3 grid grid-cols-6 gap-1.5">
          <button
            type="button"
            onClick={() => handleRotate(-Math.PI / 2)}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition"
            title="Xoay ngược chiều 90°"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" /> -90°
          </button>

          <button
            type="button"
            onClick={() => handleRotate(Math.PI / 2)}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition"
            title="Xoay xuôi chiều 90°"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" /> +90°
          </button>

          <button
            type="button"
            onClick={() => handleRotate(Math.PI)}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold text-xs border border-amber-500/30 transition"
            title="Lật 180° để sửa mô hình bị quay lưng"
          >
            180°
          </button>

          <button
            type="button"
            onClick={handleResetRotation}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition"
            title="Căn lại góc 0° ban đầu"
          >
            <Compass className="w-3.5 h-3.5 text-slate-400" /> 0°
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs border transition ${
              autoRotate
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Bật/Tắt tự động xoay 360°"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleCapture}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/40 transition transform active:scale-95"
            title="Chụp lại Thumbnail ở góc nhìn hiện tại"
          >
            <Camera className="w-3.5 h-3.5" /> Chụp
          </button>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs px-4 gap-1">
        {[
          { id: 'general', label: 'Cơ bản', icon: Tag },
          { id: 'specs', label: 'Quy cách 3D', icon: Box },
          { id: 'pricing', label: 'Gói cước', icon: DollarSign },
          { id: 'json', label: 'Metadata JSONB', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
                isActive
                  ? 'border-amber-400 text-amber-400 font-bold bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Form Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: THÔNG TIN CƠ BẢN */}
        {activeTab === 'general' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Tên hiển thị (Tiếng Việt)</label>
              <input
                type="text"
                value={model.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="VD: Sofa Văng Da 3 Chỗ"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mã nhận diện (Code)</label>
                <input
                  type="text"
                  value={model.code || ''}
                  onChange={(e) => handleFieldChange('code', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Bộ sưu tập</label>
                <select
                  value={model.collectionId || ''}
                  onChange={(e) => handleFieldChange('collectionId', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition"
                >
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Không gian phòng</label>
                <select
                  value={model.category || 'living-room'}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition"
                >
                  <option value="living-room">🛋️ Phòng khách</option>
                  <option value="bedroom">🛏️ Phòng ngủ</option>
                  <option value="kitchen">🍳 Phòng bếp</option>
                  <option value="office">💼 Làm việc</option>
                  <option value="bathroom">🚿 Phòng tắm</option>
                  <option value="decor">🪴 Trang trí</option>
                  <option value="wall-decor">🖼️ Gắn tường</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Phân loại món đồ</label>
                <input
                  type="text"
                  value={model.modelType || 'furniture'}
                  onChange={(e) => handleFieldChange('modelType', e.target.value)}
                  placeholder="VD: seating, table, bed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Đường dẫn tệp mô hình 3D (.glb)</label>
              <input
                type="text"
                value={model.modelPath || ''}
                readOnly
                className="w-full bg-slate-950/70 border border-slate-800 text-slate-400 rounded-lg px-3 py-2 font-mono text-[11px]"
              />
            </div>
          </div>
        )}

        {/* TAB 2: QUY CÁCH 3D & CÔNG THÁI HỌC */}
        {activeTab === 'specs' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-2 font-medium">
                Kích thước thực tế (Dài × Cao × Sâu [mét])
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 mb-1 block">Rộng (W - trục X)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={model.dimensionX || model.dimensions?.width || 1}
                    onChange={(e) => handleDimensionChange('x', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 mb-1 block">Cao (H - trục Y)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={model.dimensionY || model.dimensions?.height || 1}
                    onChange={(e) => handleDimensionChange('y', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 mb-1 block">Sâu (D - trục Z)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={model.dimensionZ || model.dimensions?.depth || 1}
                    onChange={(e) => handleDimensionChange('z', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Kiểu lắp đặt</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFieldChange('mountType', 'floor')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                    model.mountType !== 'wall'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🏠 Đặt trên sàn (Floor)
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('mountType', 'wall')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                    model.mountType === 'wall'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🖼️ Neo trên tường (Wall)
                </button>
              </div>
            </div>

            {/* Công thái học & Ràng buộc con */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="block text-slate-400 font-medium">Ràng buộc mặt bàn / bề mặt đỡ</label>
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!model.isSurfaceHost}
                  onChange={(e) => handleFieldChange('isSurfaceHost', e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="text-white font-medium">Là bề mặt đỡ đồ con (Surface Host)</div>
                  <div className="text-[10px] text-slate-400">Cho phép laptop, đèn bàn, chậu cây nhỏ đặt dính lên mặt trên</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!model.canPlaceOnSurface}
                  onChange={(e) => handleFieldChange('canPlaceOnSurface', e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="text-white font-medium">Có thể đặt lên bàn/kệ (Can Place On Surface)</div>
                  <div className="text-[10px] text-slate-400">Tự động gắn dính và chuyển động theo khi bàn di chuyển</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: GÓI CƯỚC & GIÁ BÁN */}
        {activeTab === 'pricing' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Phân hạng mô hình</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('tier', 'free');
                    handleFieldChange('requiredPlan', 'FREE');
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                    model.tier !== 'premium'
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🟢 Miễn Phí (Free)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('tier', 'premium');
                    if (model.requiredPlan === 'FREE') handleFieldChange('requiredPlan', 'PLUS');
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                    model.tier === 'premium'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  💎 Cao Cấp (PRO)
                </button>
              </div>
            </div>

            {model.tier === 'premium' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Gói cước mở khóa tối thiểu</label>
                  <select
                    value={model.requiredPlan || 'PLUS'}
                    onChange={(e) => handleFieldChange('requiredPlan', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-400 transition"
                  >
                    <option value="PLUS">Gói PLUS (Thiết kế nâng cao)</option>
                    <option value="STUDIO">Gói STUDIO (Kiến trúc sư & Doanh nghiệp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Giá bán lẻ tham khảo (VNĐ)</label>
                  <input
                    type="number"
                    step="10000"
                    value={model.price || 0}
                    onChange={(e) => handleFieldChange('price', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: METADATA JSONB */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-medium">Cấu hình JSONB mở rộng</label>
              {jsonError && (
                <span className="text-rose-400 text-[10px] flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {jsonError}
                </span>
              )}
            </div>
            <textarea
              rows={8}
              value={jsonText}
              onChange={handleJsonChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 focus:outline-none focus:border-amber-400 transition resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Trường dữ liệu JSONB tối ưu lưu trữ các mesh cho phép đổi vật liệu/màu sắc, ánh sáng phát quang emissive hoặc các thông số kiến trúc mở rộng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
