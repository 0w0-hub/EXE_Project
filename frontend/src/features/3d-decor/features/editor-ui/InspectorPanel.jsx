import {
  X,
  Copy,
  Trash2,
  RotateCw,
  Palette,
  Compass,
  Maximize2,
  AlertTriangle,
  Ruler,
  Sparkles,
  Lightbulb,
  Layers,
  ArrowDown,
  MoveHorizontal,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { useSceneStore } from '../../stores/useSceneStore';
import {
  WALL_MATERIALS,
  PRESET_WALL_COLORS,
} from '../../constants/roomDefaults';
import { getPatternDataUrl } from '../materials/textureGenerators';
import {
  findCollisionsFor,
  calculateWallDistances,
  clampItemInsideRoom,
  findSupportingSurface,
  isItemPlaceableOnSurface,
  getRoomWallSurfaces,
} from '../collision/collisionResolver';

const COLOR_SWATCHES = [
  '#3b82f6', // Xanh dương
  '#f59e0b', // Cam ấm
  '#10b981', // Xanh lá ngọc
  '#ef4444', // Đỏ thẫm
  '#8b5cf6', // Tím thạch anh
  '#78350f', // Gỗ nâu đậm
  '#a16207', // Gỗ sồi vàng
  '#0f172a', // Đen than
  '#475569', // Xám tro
  '#f8fafc', // Trắng ngà
];

export function InspectorPanel() {
  const selectedItemId = useSceneStore((state) => state.selectedItemId);
  const selectItem = useSceneStore((state) => state.selectItem);
  const items = useSceneStore((state) => state.items);
  const room = useSceneStore((state) => state.room);
  const updateItemTransform = useSceneStore((state) => state.updateItemTransform);
  const detachItemFromHost = useSceneStore((state) => state.detachItemFromHost);
  const updateItemColor = useSceneStore((state) => state.updateItemColor);
  const toggleLamp = useSceneStore((state) => state.toggleLamp);
  const removeItem = useSceneStore((state) => state.removeItem);
  const duplicateItem = useSceneStore((state) => state.duplicateItem);
  const autoArrangeScene = useSceneStore((state) => state.autoArrangeScene);
  const setWallItemElevation = useSceneStore((state) => state.setWallItemElevation);
  const setWallItemPositionU = useSceneStore((state) => state.setWallItemPositionU);

  // Opening (Cửa / Cửa sổ) đang được chọn
  const selectedOpeningId = useSceneStore((state) => state.selectedOpeningId);
  const selectOpening = useSceneStore((state) => state.selectOpening);
  const wallGraph = useSceneStore((state) => state.wallGraph);
  const wgUpdateOpening = useSceneStore((state) => state.wgUpdateOpening);
  const wgRemoveOpening = useSceneStore((state) => state.wgRemoveOpening);

  // Đoạn tường (Wall Segment) đang được chọn
  const selectedSegmentId = useSceneStore((state) => state.selectedSegmentId);
  const selectSegment = useSceneStore((state) => state.selectSegment);
  const updateSegmentMaterial = useSceneStore((state) => state.updateSegmentMaterial);
  const wgRemoveSegment = useSceneStore((state) => state.wgRemoveSegment);

  const selectedOpening = selectedOpeningId ? wallGraph?.openings?.[selectedOpeningId] : null;

  // Nếu đang chọn Cửa hoặc Cửa sổ: Hiển thị bảng điều khiển Cửa / Cửa sổ
  if (selectedOpening) {
    const isWindow = selectedOpening.type === 'window';
    return (
      <aside className="absolute right-4 top-16 z-20 w-80 max-h-[calc(100vh-80px)] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-semibold text-white text-sm">
              {isWindow ? '🪟 Cửa sổ tường' : '🚪 Cửa đi chính'}
            </h3>
            <span className="text-[11px] text-blue-400 font-mono">
              ID: {selectedOpening.id.slice(0, 10)}
            </span>
          </div>
          <button
            onClick={() => selectOpening(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Vị trí trượt dọc tường */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Vị trí trên tường (u):</span>
              <span className="font-mono text-white">{Math.round((selectedOpening.u ?? 0.5) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.02"
              value={selectedOpening.u ?? 0.5}
              onChange={(e) => wgUpdateOpening(selectedOpening.id, { u: parseFloat(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Chiều rộng */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Chiều rộng (m):</span>
              <span className="font-mono text-white">{(selectedOpening.width ?? (isWindow ? 1.2 : 0.9)).toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={selectedOpening.width ?? (isWindow ? 1.2 : 0.9)}
              onChange={(e) => wgUpdateOpening(selectedOpening.id, { width: parseFloat(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Chiều cao */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Chiều cao (m):</span>
              <span className="font-mono text-white">{(selectedOpening.height ?? (isWindow ? 1.2 : 2.1)).toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min={isWindow ? '0.5' : '1.6'}
              max={isWindow ? '2.2' : '2.6'}
              step="0.05"
              value={selectedOpening.height ?? (isWindow ? 1.2 : 2.1)}
              onChange={(e) => wgUpdateOpening(selectedOpening.id, { height: parseFloat(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Cao độ bậu cửa sổ (Elevation) */}
          {isWindow && (
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Cao độ bậu cửa (m):</span>
                <span className="font-mono text-white">{(selectedOpening.elevation ?? 0.9).toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.6"
                step="0.05"
                value={selectedOpening.elevation ?? 0.9}
                onChange={(e) => wgUpdateOpening(selectedOpening.id, { elevation: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {/* Tùy chỉnh kiểu dáng Model 3D hoặc Cửa sổ kiến trúc */}
          {isWindow ? (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <span className="block text-slate-400 mb-1.5 font-medium">Kiểu dáng cửa sổ kiến trúc:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'sliding', name: '🪟 Cửa sổ lùa 2 cánh' },
                    { id: 'casement', name: '🪟 Cửa mở quay/hất' },
                    { id: 'picture', name: '🪟 Kính lớn tràn viền' },
                    { id: 'grid', name: '🪟 Cửa chia ô cổ điển' },
                  ].map((style) => {
                    const isSel = (selectedOpening.windowStyle || 'sliding') === style.id && !selectedOpening.modelPath;
                    return (
                      <button
                        key={style.id}
                        onClick={() => wgUpdateOpening(selectedOpening.id, { windowStyle: style.id, modelPath: undefined })}
                        className={`px-2 py-1.5 rounded-lg border text-left text-[11px] truncate transition-all ${
                          isSel
                            ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-medium'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        {style.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Màu sắc khung cửa sổ */}
              <div>
                <span className="block text-slate-400 mb-1.5 font-medium">Màu khung nhôm/gỗ:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: '#1e293b', label: 'Đen Xingfa' },
                    { id: '#f8fafc', label: 'Trắng sứ' },
                    { id: '#854d0e', label: 'Gỗ sồi' },
                    { id: '#475569', label: 'Xám ghi' },
                  ].map((col) => {
                    const isCur = (selectedOpening.frameColor || '#1e293b') === col.id;
                    return (
                      <button
                        key={col.id}
                        onClick={() => wgUpdateOpening(selectedOpening.id, { frameColor: col.id })}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                          isCur
                            ? 'border-blue-500 bg-blue-950/40 text-blue-300 ring-1 ring-blue-500/50'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-slate-600 shadow-sm" style={{ backgroundColor: col.id }} />
                        <span className="text-[10px] truncate">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thanh trượt độ mở cửa sổ */}
              {selectedOpening.windowStyle !== 'picture' && (
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{(selectedOpening.windowStyle || 'sliding') === 'sliding' ? 'Độ trượt mở cánh:' : 'Góc mở cánh:'}</span>
                    <span className="font-mono text-white">
                      {(selectedOpening.windowStyle || 'sliding') === 'sliding'
                        ? `${Math.round(((selectedOpening.openAngle ?? 0) / 90) * 100)}%`
                        : `${selectedOpening.openAngle ?? 0}°`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={selectedOpening.openAngle ?? 0}
                    onChange={(e) => wgUpdateOpening(selectedOpening.id, { openAngle: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="block text-slate-400 mb-1.5 font-medium">Mô hình 3D thực tế:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => wgUpdateOpening(selectedOpening.id, { modelPath: '/furniture/doorway.glb' })}
                  className={`px-2 py-1.5 rounded-lg border text-left text-[11px] truncate ${
                    (selectedOpening.modelPath || '/furniture/doorway.glb') === '/furniture/doorway.glb'
                      ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-medium'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  🚪 Cửa gỗ đơn
                </button>
                <button
                  onClick={() => wgUpdateOpening(selectedOpening.id, { modelPath: '/furniture/doorwayFront.glb' })}
                  className={`px-2 py-1.5 rounded-lg border text-left text-[11px] truncate ${
                    selectedOpening.modelPath === '/furniture/doorwayFront.glb'
                      ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-medium'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  🚪 Cửa kính xingfa
                </button>
              </div>
            </div>
          )}

          {/* Hướng mở cửa & Công tắc Đóng/Mở (chỉ dành cho cửa đi) */}
          {!isWindow && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              {/* Công tắc Đóng / Mở cửa */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <span className="text-slate-300 font-medium">Trạng thái cửa:</span>
                <button
                  onClick={() => {
                    const isOpen = (selectedOpening.openAngle ?? 75) > 0;
                    wgUpdateOpening(selectedOpening.id, { openAngle: isOpen ? 0 : 75 });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    (selectedOpening.openAngle ?? 75) > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>{(selectedOpening.openAngle ?? 75) > 0 ? '🟢 Đang mở' : '🔴 Đang đóng'}</span>
                </button>
              </div>

              {/* Thanh trượt góc mở cửa */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Góc mở cánh cửa:</span>
                  <span className="font-mono text-white">{selectedOpening.openAngle ?? 75}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={selectedOpening.openAngle ?? 75}
                  onChange={(e) => wgUpdateOpening(selectedOpening.id, { openAngle: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <span className="block text-slate-400 font-medium pt-1">Bố trí mở cửa:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Bên gắn bản lề:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => wgUpdateOpening(selectedOpening.id, { swingSide: 'left' })}
                      className={`flex-1 py-1 rounded text-center text-[11px] ${
                        (selectedOpening.swingSide || 'left') === 'left'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Bên Trái
                    </button>
                    <button
                      onClick={() => wgUpdateOpening(selectedOpening.id, { swingSide: 'right' })}
                      className={`flex-1 py-1 rounded text-center text-[11px] ${
                        selectedOpening.swingSide === 'right'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Bên Phải
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Hướng xoay:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => wgUpdateOpening(selectedOpening.id, { swingDir: 'inward' })}
                      className={`flex-1 py-1 rounded text-center text-[11px] ${
                        (selectedOpening.swingDir || 'inward') === 'inward'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Vào trong
                    </button>
                    <button
                      onClick={() => wgUpdateOpening(selectedOpening.id, { swingDir: 'outward' })}
                      className={`flex-1 py-1 rounded text-center text-[11px] ${
                        selectedOpening.swingDir === 'outward'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Ra ngoài
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nút xóa cửa / cửa sổ */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => wgRemoveOpening(selectedOpening.id)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa khỏi tường (Delete)</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const selectedSegment = selectedSegmentId ? wallGraph?.segments?.[selectedSegmentId] : null;

  // Nếu đang chọn một đoạn tường: Hiển thị bảng điều khiển Tường & Tường điểm nhấn (Accent Wall)
  if (selectedSegment) {
    const v1 = wallGraph?.vertices?.[selectedSegment.v1];
    const v2 = wallGraph?.vertices?.[selectedSegment.v2];
    const dx = (v2?.x ?? 0) - (v1?.x ?? 0);
    const dz = (v2?.z ?? 0) - (v1?.z ?? 0);
    const segLength = (Math.sqrt(dx * dx + dz * dz) || 0).toFixed(2);
    const isCustomMat = selectedSegment.materialId && selectedSegment.materialId !== 'wall-default';
    const activeMatId = isCustomMat ? selectedSegment.materialId : (room.wallMaterialId || 'wall-paint');
    const activeColor = selectedSegment.color || room.wallColor || '#f1f5f9';

    return (
      <aside className="absolute right-4 top-16 z-20 w-80 max-h-[calc(100vh-80px)] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-200 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
              <span>🧱</span>
              <span>{selectedSegment.label || 'Đoạn tường phòng'}</span>
            </h3>
            <span className="text-[11px] text-blue-400 font-mono">
              Dài: {segLength}m • Cao: {selectedSegment.height || room.height}m
            </span>
          </div>
          <button
            onClick={() => selectSegment(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Chọn Tường Điểm Nhấn (Accent Wall) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Vật Liệu Đoạn Tường:</span>
              <span className="text-[10px] text-emerald-400 font-medium">
                {isCustomMat ? '★ Tường điểm nhấn' : 'Theo phòng'}
              </span>
            </div>

            {/* Nút tùy chọn theo phòng */}
            <button
              onClick={() => updateSegmentMaterial(selectedSegment.id, { materialId: 'wall-default', color: undefined })}
              className={`w-full mb-2 p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                !isCustomMat
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                  : 'bg-slate-800/40 border-slate-700/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>Dùng vật liệu chung của phòng</span>
              {!isCustomMat && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            {/* Danh sách các mẫu vật liệu tường */}
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {WALL_MATERIALS.map((mat) => {
                const isSelected = activeMatId === mat.id && isCustomMat;
                const previewUrl = getPatternDataUrl('wall', mat.id, activeColor);

                return (
                  <button
                    key={mat.id}
                    onClick={() => {
                      updateSegmentMaterial(selectedSegment.id, { materialId: mat.id });
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/50'
                        : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <img
                      src={previewUrl}
                      alt={mat.name}
                      className="w-7 h-7 rounded object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-white block truncate">{mat.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 truncate">{mat.categoryLabel}</span>
                        {mat.unitSizeLabel && (
                          <span className="text-[9px] text-emerald-400 font-mono">({mat.unitSizeLabel})</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Màu sắc riêng cho đoạn tường này nếu là custom */}
          {isCustomMat && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">Màu Nền Điểm Nhấn:</span>
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => updateSegmentMaterial(selectedSegment.id, { color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_WALL_COLORS.slice(0, 6).map((col) => (
                  <button
                    key={col}
                    onClick={() => updateSegmentMaterial(selectedSegment.id, { color: col })}
                    className={`h-6 rounded border transition-all ${
                      activeColor.toLowerCase() === col.toLowerCase()
                        ? 'border-emerald-400 ring-1 ring-emerald-400 scale-105'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Nút xóa đoạn tường */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => wgRemoveSegment(selectedSegment.id)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa đoạn tường này</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const selectedItem = items.find((i) => i.instanceId === selectedItemId);

  if (!selectedItem) return null;

  const {
    position,
    rotation,
    dimensions,
    color,
    name,
    modelType,
    modelPath,
    isLightOn = true,
  } = selectedItem;

  const isGLTF = !!modelPath;
  const isLamp = modelType === 'lamp';
  const isWallMounted = selectedItem.mountType === 'wall';
  const walls = getRoomWallSurfaces(room, wallGraph);
  const currentWall = isWallMounted
    ? walls.find((w) => w.id === selectedItem.wallId) || walls[0]
    : null;

  // Tính góc xoay quanh trục Y theo độ (0 - 360)
  const currentDegY = Math.round((((rotation[1] * 180) / Math.PI) % 360 + 360) % 360);

  // Danh sách các vật thể đang va chạm với vật thể được chọn (sử dụng Three.js Box3)
  const collidingItems = findCollisionsFor(selectedItem, items);
  const hasCollision = collidingItems.length > 0;

  // Vật thể đỡ (nếu item này đang đặt trên bàn/kệ)
  const hostParentItem = items.find((i) => i.instanceId === selectedItem.attachedTo);

  // Danh sách các vật thể con đang đặt trên bề mặt của vật thể này
  const hostedChildItems = items.filter((i) => i.attachedTo === selectedItemId);

  // Tính khoảng cách tới 4 mặt tường phòng (chỉ hiển thị cho đồ dưới sàn)
  const wallDist = !isWallMounted ? calculateWallDistances(selectedItem, room) : null;

  const handlePositionChange = (axisIndex, val) => {
    const num = parseFloat(val) || 0;
    const newPos = [...position];
    newPos[axisIndex] = num;
    const [clampedX, , clampedZ] = clampItemInsideRoom(newPos, dimensions, rotation[1], room);

    let nextY = 0;
    let newAttachedTo = selectedItem.attachedTo || null;

    if (axisIndex === 1) {
      nextY = Math.max(0, num);
      if (nextY === 0) newAttachedTo = null;
    } else {
      if (isItemPlaceableOnSurface(selectedItem)) {
        const surface = findSupportingSurface(
          [clampedX, 0, clampedZ],
          dimensions,
          items,
          selectedItemId
        );
        if (surface) {
          nextY = surface.surfaceY;
          newAttachedTo = surface.hostItem.instanceId;
        } else {
          nextY = 0;
          newAttachedTo = null;
        }
      } else {
        nextY = position[1] || 0;
      }
    }

    updateItemTransform(selectedItemId, {
      position: [clampedX, nextY, clampedZ],
      attachedTo: newAttachedTo,
    });
  };

  const handleRotateQuick = (degDelta) => {
    const radDelta = (degDelta * Math.PI) / 180;
    const newRad = rotation[1] + radDelta;
    const clampedPos = clampItemInsideRoom(position, dimensions, newRad, room);
    const newRot = [rotation[0], newRad, rotation[2]];
    updateItemTransform(selectedItemId, { position: clampedPos, rotation: newRot });
  };

  const handleRotateDeg = (deg) => {
    const rad = (deg * Math.PI) / 180;
    const clampedPos = clampItemInsideRoom(position, dimensions, rad, room);
    updateItemTransform(selectedItemId, {
      position: clampedPos,
      rotation: [rotation[0], rad, rotation[2]],
    });
  };

  return (
    <div className="absolute top-20 right-4 w-80 z-20 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Thuộc tính đối tượng
          </span>
          <h2 className="text-sm font-bold text-white truncate max-w-[200px]">{name}</h2>
        </div>
        <button
          onClick={() => selectItem(null)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Bỏ chọn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-160px)] overflow-y-auto">
        {/* Khối cảnh báo va chạm hiển thị rõ ràng thông tin các vật thể va chạm */}
        {hasCollision && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Đang va chạm với ({collidingItems.length} món):</span>
            </div>

            {/* Danh sách các vật thể đang bị va chạm cùng box đỏ hiển thị trên 3D */}
            <div className="flex flex-wrap gap-1.5 pl-6">
              {collidingItems.map((cItem) => (
                <button
                  key={cItem.instanceId}
                  onClick={() => selectItem(cItem.instanceId)}
                  className="px-2 py-0.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded text-[11px] font-medium transition-colors"
                  title="Nhấp để chuyển sang chọn món này"
                >
                  {cItem.name} ↗
                </button>
              ))}
            </div>

            <p className="text-[11px] text-rose-300/80 pl-6">
              Các món bị va chạm đang hiển thị hộp bao viền đỏ trên màn hình 3D.
            </p>

            <button
              onClick={() => autoArrangeScene('push')}
              className="w-full mt-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tách va chạm an toàn</span>
            </button>
          </div>
        )}

        {/* Liên kết Bề Mặt & Đồ Đỡ (Surface Attachment) */}
        {hostParentItem && (
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/40 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Đang đặt trên bề mặt:</span>
              </div>
              <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-200 border border-cyan-700/60 rounded text-[11px] font-mono font-bold">
                +{position[1].toFixed(2)}m
              </span>
            </div>
            <div className="flex items-center justify-between pl-6 text-slate-300 gap-2">
              <span className="font-medium text-white truncate max-w-[140px]">{hostParentItem.name}</span>
              <button
                onClick={() => detachItemFromHost(selectedItemId)}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-600 transition-colors shrink-0"
                title="Hạ đồ vật xuống mặt sàn (Y = 0)"
              >
                <ArrowDown className="w-3 h-3 text-cyan-400" />
                <span>Hạ sàn</span>
              </button>
            </div>
          </div>
        )}

        {hostedChildItems.length > 0 && (
          <div className="p-3 bg-indigo-500/15 border border-indigo-500/40 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Đang đỡ ({hostedChildItems.length} đồ vật bên trên):</span>
            </div>
            <p className="text-[11px] text-indigo-200/80 pl-6">
              Khi di chuyển hoặc xoay món này, các đồ bên trên sẽ tự động đi theo.
            </p>
            <div className="flex flex-wrap gap-1.5 pl-6">
              {hostedChildItems.map((cItem) => (
                <button
                  key={cItem.instanceId}
                  onClick={() => selectItem(cItem.instanceId)}
                  className="px-2 py-0.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded text-[11px] font-medium transition-colors"
                  title="Nhấp để chọn món này"
                >
                  {cItem.name} ↗
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Kích thước */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Kích thước thật (Dài × Sâu × Cao)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-center">
              <span className="text-[10px] text-slate-400 block">Dài (X)</span>
              <span className="text-xs font-semibold text-white">{dimensions.width}m</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-center">
              <span className="text-[10px] text-slate-400 block">Sâu (Z)</span>
              <span className="text-xs font-semibold text-white">{dimensions.depth}m</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-center">
              <span className="text-[10px] text-slate-400 block">Cao (Y)</span>
              <span className="text-xs font-semibold text-white">{dimensions.height}m</span>
            </div>
          </div>
        </div>

        {/* Thước đo khoảng cách tới tường */}
        {wallDist && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Ruler className="w-3.5 h-3.5 text-slate-400" />
              <span>Khoảng cách tới tường</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 rounded-lg flex justify-between">
                <span className="text-slate-400 text-[11px]">Tường sau:</span>
                <span className="font-semibold text-blue-300 font-mono">{wallDist.backWall}m</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 rounded-lg flex justify-between">
                <span className="text-slate-400 text-[11px]">Tường trái:</span>
                <span className="font-semibold text-blue-300 font-mono">{wallDist.leftWall}m</span>
              </div>
            </div>
          </div>
        )}

        {/* ĐIỀU KHIỂN RIÊNG CHO ĐỒ GẮN TƯỜNG (CỬA, CỬA SỔ, TRANH, GƯƠNG, ĐÈN VÁCH) */}
        {isWallMounted ? (
          <div className="space-y-3 p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl">
            {/* 1. Thông tin đoạn tường đang neo */}
            <div className="bg-slate-900/60 border border-blue-500/20 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  <span>Đoạn tường gắn</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Mặt trong tường
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-0.5">
                <span className="font-medium text-slate-200">
                  {currentWall?.name || selectedItem.wallName || 'Tường phòng'}
                </span>
                <span className="font-mono text-[11px] text-blue-300">
                  Dài {currentWall ? currentWall.length : room.width}m × Cao {currentWall?.height || room.height}m
                </span>
              </div>
            </div>

            {/* 2. Độ cao treo tường (Elevation Y) */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Độ cao treo tường (Y)</span>
                </span>
                <span className="text-cyan-300 font-mono text-xs font-bold">
                  {position[1].toFixed(2)}m
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, (room.height || 2.8) - dimensions.height).toFixed(2)}
                  step="0.05"
                  value={position[1]}
                  onChange={(e) => setWallItemElevation(selectedItemId, parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max={room.height || 2.8}
                  value={position[1].toFixed(2)}
                  onChange={(e) => setWallItemElevation(selectedItemId, parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-cyan-300 font-mono text-center focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Các mốc cao độ kiến trúc chuẩn nhanh */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: 'Sàn 0m', val: 0 },
                  { label: 'Cửa sổ 0.9m', val: 0.9 },
                  { label: 'Tranh 1.5m', val: 1.5 },
                  { label: 'Đèn 1.8m', val: 1.8 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setWallItemElevation(selectedItemId, preset.val)}
                    className={`px-1 py-1 rounded text-[10px] font-medium transition-colors ${
                      Math.abs(position[1] - preset.val) < 0.04
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Vị trí trượt ngang dọc mặt tường (u) */}
            {currentWall && (() => {
              const wallThick = currentWall.thickness || 0.15;
              const halfW = (dimensions.width || 1) / 2;
              const minU = Math.min(currentWall.length / 2, wallThick / 2 + halfW);
              const maxU = Math.max(minU, currentWall.length - minU);
              const curU =
                selectedItem.wallU !== undefined && selectedItem.wallU !== null
                  ? Math.max(minU, Math.min(maxU, selectedItem.wallU))
                  : currentWall.length / 2;

              return (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MoveHorizontal className="w-3.5 h-3.5 text-blue-400" />
                      <span>Trượt ngang theo tường</span>
                    </span>
                    <span className="text-blue-300 font-mono text-xs font-bold">
                      {curU.toFixed(2)}m / {Number(currentWall.length).toFixed(2)}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={Number(minU.toFixed(2))}
                    max={Number(maxU.toFixed(2))}
                    step="0.05"
                    value={curU}
                    onChange={(e) => setWallItemPositionU(selectedItemId, parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })()}

            {/* Thông báo góc xoay tự động */}
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Định hướng mặt chính:</span>
              <span className="text-emerald-400 font-medium">Vuông góc vào phòng ({currentDegY}°)</span>
            </div>
          </div>
        ) : (
          <>
            {/* Tọa độ vị trí trên sàn / bàn */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tọa độ vị trí (mét)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {position[1] > 0 ? 'Trên mặt bàn' : 'Trên mặt sàn'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">X (Ngang)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={position[0].toFixed(2)}
                    onChange={(e) => handlePositionChange(0, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Y (Độ cao)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={position[1].toFixed(2)}
                    onChange={(e) => handlePositionChange(1, e.target.value)}
                    className={`w-full bg-slate-800 border rounded-lg px-2 py-1.5 text-xs font-mono text-center focus:outline-none ${
                      position[1] > 0
                        ? 'border-cyan-500/60 text-cyan-300 font-bold'
                        : 'border-slate-700 text-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Z (Sâu)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={position[2].toFixed(2)}
                    onChange={(e) => handlePositionChange(2, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Góc xoay Y */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Góc xoay</span>
                </span>
                <span className="text-blue-400 font-mono text-xs font-bold">{currentDegY}°</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRotateQuick(-45)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs font-mono transition-colors"
                  title="Xoay trái 45°"
                >
                  -45°
                </button>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={currentDegY}
                  onChange={(e) => handleRotateDeg(parseInt(e.target.value, 10))}
                  className="flex-1 accent-blue-600 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => handleRotateQuick(45)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs font-mono transition-colors"
                  title="Xoay phải 45°"
                >
                  +45°
                </button>
              </div>
            </div>
          </>
        )}

        {/* Công tắc Bật / Tắt Đèn */}
        {isLamp && (
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  isLightOn ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-700 text-slate-500'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Công tắc đèn</div>
                <div className="text-[11px] text-slate-400">
                  {isLightOn ? 'Đèn đang bật phát sáng' : 'Đèn đang tắt'}
                </div>
              </div>
            </div>

            {/* Nút bấm Toggle Switch */}
            <button
              onClick={() => toggleLamp(selectedItemId)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isLightOn ? 'bg-amber-500' : 'bg-slate-700'
              }`}
              title={isLightOn ? 'Nhấp để tắt đèn' : 'Nhấp để bật đèn'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                  isLightOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Bảng màu sắc & Chất liệu (Chỉ áp dụng cho đồ tự dựng primitive, ẩn hoàn toàn đối với đồ GLB) */}
        {!isGLTF && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <span>Màu sắc tùy biến</span>
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateItemColor(selectedItemId, e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Chọn màu tùy biến"
                />
                <span className="text-[11px] font-mono text-slate-400 uppercase">{color}</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => updateItemColor(selectedItemId, swatch)}
                  className={`w-full h-6 rounded-md border transition-all ${
                    color.toLowerCase() === swatch.toLowerCase()
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Nút hành động Nhân bản / Xóa */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
          <button
            onClick={() => duplicateItem(selectedItemId)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Nhân Bản</span>
          </button>
          <button
            onClick={() => removeItem(selectedItemId)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Đồ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
