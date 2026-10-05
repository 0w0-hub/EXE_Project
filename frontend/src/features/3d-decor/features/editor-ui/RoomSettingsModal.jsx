import React, { useState } from 'react';
import {
  X,
  Check,
  Home,
  Sliders,
  Palette,
  Eye,
  LayoutGrid,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';
import {
  ROOM_LIMITS,
  PRESET_FLOOR_COLORS,
  PRESET_WALL_COLORS,
  FLOOR_MATERIALS,
  WALL_MATERIALS,
  getMaterialScaledDimensionText,
} from '../../constants/roomDefaults';
import { getPatternDataUrl } from '../materials/textureGenerators';

export function RoomSettingsModal() {
  const [activeTab, setActiveTab] = useState('dimensions'); // 'dimensions' | 'floor' | 'wall'

  const isRoomModalOpen = useEditorStore((state) => state.isRoomModalOpen);
  const setRoomModalOpen = useEditorStore((state) => state.setRoomModalOpen);

  const showGrid = useEditorStore((state) => state.showGrid);
  const toggleGrid = useEditorStore((state) => state.toggleGrid);
  const transparentWalls = useEditorStore((state) => state.transparentWalls);
  const toggleTransparentWalls = useEditorStore((state) => state.toggleTransparentWalls);

  const room = useSceneStore((state) => state.room);
  const updateRoom = useSceneStore((state) => state.updateRoom);

  if (!isRoomModalOpen) return null;

  const handleDimensionChange = (key, val) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      updateRoom({ [key]: num });
    }
  };

  const currentFloorMat = FLOOR_MATERIALS.find((m) => m.id === room.floorMaterialId) || FLOOR_MATERIALS[0];
  const currentWallMat = WALL_MATERIALS.find((m) => m.id === room.wallMaterialId) || WALL_MATERIALS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Cài Đặt Căn Phòng & Vật Liệu</h2>
          </div>
          <button
            onClick={() => setRoomModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('dimensions')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'dimensions'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Kích Thước</span>
          </button>

          <button
            onClick={() => setActiveTab('floor')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'floor'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sàn Nhà ({currentFloorMat.name})</span>
          </button>

          <button
            onClick={() => setActiveTab('wall')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'wall'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tường Nhà ({currentWallMat.name})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: KÍCH THƯỚC & GÓC NHÌN
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'dimensions' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-3">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kích Thước Mặt Bằng & Trần (Mét)</span>
                </div>

                <div className="space-y-3.5">
                  {/* Chiều ngang X */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Chiều rộng mặt sàn (Trục X)</span>
                      <span className="text-white font-semibold">{room.width} m</span>
                    </div>
                    <input
                      type="range"
                      min={ROOM_LIMITS.MIN_WIDTH}
                      max={ROOM_LIMITS.MAX_WIDTH}
                      step="0.5"
                      value={room.width}
                      onChange={(e) => handleDimensionChange('width', e.target.value)}
                      className="w-full accent-blue-600 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Chiều sâu Z */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Chiều sâu mặt sàn (Trục Z)</span>
                      <span className="text-white font-semibold">{room.length} m</span>
                    </div>
                    <input
                      type="range"
                      min={ROOM_LIMITS.MIN_LENGTH}
                      max={ROOM_LIMITS.MAX_LENGTH}
                      step="0.5"
                      value={room.length}
                      onChange={(e) => handleDimensionChange('length', e.target.value)}
                      className="w-full accent-blue-600 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Chiều cao Y */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Chiều cao tường (Trục Y)</span>
                      <span className="text-white font-semibold">{room.height} m</span>
                    </div>
                    <input
                      type="range"
                      min={ROOM_LIMITS.MIN_HEIGHT}
                      max={ROOM_LIMITS.MAX_HEIGHT}
                      step="0.1"
                      value={room.height}
                      onChange={(e) => handleDimensionChange('height', e.target.value)}
                      className="w-full accent-blue-600 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Tùy chọn hiển thị & Tường kính */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Ẩn Tường Theo Góc Nhìn Camera</div>
                      <div className="text-[10px] text-slate-400">
                        Tự động ẩn các bức tường chắn tầm nhìn phía trước camera để nhìn thẳng vào phòng
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleTransparentWalls}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      transparentWalls ? 'bg-cyan-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                        transparentWalls ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Đường Lưới Sàn</div>
                      <div className="text-[10px] text-slate-400">
                        Hiển thị các ô lưới 0.5m kẻ trên mặt sàn
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleGrid}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      showGrid ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                        showGrid ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: VẬT LIỆU SÀN NHÀ (FLOORING)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'floor' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Thư viện mẫu hoa văn sàn */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Chọn Loại Vật Liệu Sàn</span>
                  <span className="text-[11px] text-amber-400 font-normal">{FLOOR_MATERIALS.length} mẫu cao cấp</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {FLOOR_MATERIALS.map((mat) => {
                    const isSelected = (room.floorMaterialId || 'wood-straight') === mat.id;
                    const previewUrl = getPatternDataUrl('floor', mat.id, room.floorColor || mat.defaultColor);

                    return (
                      <button
                        key={mat.id}
                        onClick={() => {
                          updateRoom({
                            floorMaterialId: mat.id,
                            floorRoughness: mat.defaultRoughness,
                            floorRepeat: mat.defaultRepeat,
                          });
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                            : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img
                          src={previewUrl}
                          alt={mat.name}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-700 shadow-sm flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate">{mat.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{mat.description}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/70 text-slate-300">
                              {mat.categoryLabel}
                            </span>
                            {mat.unitSizeLabel && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                📐 {mat.unitSizeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Màu sắc & Tone sàn */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Màu Nhuộm Nền (Base Tint)</span>
                  </span>
                  <input
                    type="color"
                    value={room.floorColor || '#d6c7b2'}
                    onChange={(e) => updateRoom({ floorColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_FLOOR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateRoom({ floorColor: color })}
                      className={`h-7 rounded-lg border transition-all ${
                        (room.floorColor || '').toLowerCase() === color.toLowerCase()
                          ? 'border-amber-400 scale-105 shadow-md ring-2 ring-amber-500/40'
                          : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Tinh chỉnh PBR (Độ lặp & Độ bóng) */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                {/* Tỷ lệ lặp hoa văn */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs text-slate-400">
                    <span>Tỷ lệ hoa văn (Khổ ván / Khổ gạch)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-semibold">{(room.floorRepeat || 1.0).toFixed(2)}x</span>
                      <span className="text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        📐 {getMaterialScaledDimensionText(currentFloorMat, room.floorRepeat || 1.0)}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={room.floorRepeat || 1.0}
                    onChange={(e) => updateRoom({ floorRepeat: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  {/* Preset Buttons kích thước nhanh */}
                  {currentFloorMat?.presets && currentFloorMat.presets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentFloorMat.presets.map((preset) => {
                        const isActive = Math.abs((room.floorRepeat || 1.0) - preset.scale) < 0.03;
                        return (
                          <button
                            key={preset.label}
                            onClick={() => updateRoom({ floorRepeat: preset.scale })}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                              isActive
                                ? 'bg-amber-500/25 text-amber-300 border-amber-500 font-semibold shadow-sm'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Độ bóng / Độ nhám */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Độ phản chiếu bề mặt (Roughness)</span>
                    <span className="text-white font-semibold">
                      {(room.floorRoughness ?? 0.45) < 0.25
                        ? 'Bóng gương (Glossy)'
                        : (room.floorRoughness ?? 0.45) < 0.6
                        ? 'Bán bóng (Semi-gloss)'
                        : 'Mờ lì (Matte)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={room.floorRoughness ?? 0.45}
                    onChange={(e) => updateRoom({ floorRoughness: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: VẬT LIỆU TƯỜNG NHÀ & GIẤY DÁN TƯỜNG (WALLS)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'wall' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Thư viện mẫu tường */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Chọn Mẫu Vật Liệu & Giấy Dán Tường</span>
                  <span className="text-[11px] text-emerald-400 font-normal">{WALL_MATERIALS.length} mẫu thiết kế</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {WALL_MATERIALS.map((mat) => {
                    const isSelected = (room.wallMaterialId || 'wall-paint') === mat.id;
                    const previewUrl = getPatternDataUrl('wall', mat.id, room.wallColor || mat.defaultColor);

                    return (
                      <button
                        key={mat.id}
                        onClick={() => {
                          updateRoom({
                            wallMaterialId: mat.id,
                            wallRoughness: mat.defaultRoughness,
                            wallRepeat: mat.defaultRepeat,
                          });
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img
                          src={previewUrl}
                          alt={mat.name}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-700 shadow-sm flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate">{mat.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{mat.description}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/70 text-slate-300">
                              {mat.categoryLabel}
                            </span>
                            {mat.unitSizeLabel && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                📐 {mat.unitSizeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Màu sơn & Nền tường */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Màu Nền / Nhuộm Hoa Văn</span>
                  </span>
                  <input
                    type="color"
                    value={room.wallColor || '#f1f5f9'}
                    onChange={(e) => updateRoom({ wallColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {PRESET_WALL_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateRoom({ wallColor: color })}
                      className={`h-7 rounded-lg border transition-all ${
                        (room.wallColor || '').toLowerCase() === color.toLowerCase()
                          ? 'border-emerald-400 scale-105 shadow-md ring-2 ring-emerald-500/40'
                          : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Tinh chỉnh hoa văn tường */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs text-slate-400">
                    <span>Tỷ lệ hoa văn tường (Scale/Repeat)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-semibold">{(room.wallRepeat || 1.0).toFixed(2)}x</span>
                      <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        📐 {getMaterialScaledDimensionText(currentWallMat, room.wallRepeat || 1.0)}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={room.wallRepeat || 1.0}
                    onChange={(e) => updateRoom({ wallRepeat: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  {/* Preset Buttons kích thước nhanh cho tường */}
                  {currentWallMat?.presets && currentWallMat.presets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentWallMat.presets.map((preset) => {
                        const isActive = Math.abs((room.wallRepeat || 1.0) - preset.scale) < 0.03;
                        return (
                          <button
                            key={preset.label}
                            onClick={() => updateRoom({ wallRepeat: preset.scale })}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                              isActive
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500 font-semibold shadow-sm'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Độ bóng / Độ nhám tường (Roughness)</span>
                    <span className="text-white font-semibold">
                      {(room.wallRoughness ?? 0.65) < 0.3
                        ? 'Bóng sáng (Glossy)'
                        : (room.wallRoughness ?? 0.65) < 0.65
                        ? 'Bán bóng (Satin)'
                        : 'Mờ lì (Matte)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={room.wallRoughness ?? 0.65}
                    onChange={(e) => updateRoom({ wallRoughness: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Banner hướng dẫn Tường điểm nhấn Accent Wall */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300">
                <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Mẹo thiết kế Tường Điểm Nhấn (Accent Wall):</span>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Bạn có thể chọn riêng từng bức tường (trong 2D CAD hoặc click trực tiếp vào tường trong 3D Scene) để ốp gạch thẻ, nan gỗ hoặc dán giấy dán tường riêng biệt tại bảng Inspector!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900">
          <button
            onClick={() => setRoomModalOpen(false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Hoàn Tất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
