import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderPlus,
  Grid,
  List,
  Search,
  Trash2,
  Edit2,
  Layers,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ModelBatchImporter } from './ModelBatchImporter';
import { ModelGridShowcaseCanvas } from './ModelGridShowcaseCanvas';
import { ModelInspectorPanel } from './ModelInspectorPanel';
import { fetchAdminModels, fetchCollections, updateModel, deleteModel } from './modelManagerApi';
import '../3d-decor/index.css';
import { FURNITURE_CATALOG } from '../3d-decor/features/catalog/furnitureCatalog';

export function AdminModelManager({ onClose }) {
  const [collections, setCollections] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid3d'); // Default to 3D Grid Showcase!
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState('all'); // 'all' | 'stylized' | 'realistic'
  const [tierFilter, setTierFilter] = useState('all');   // 'all' | 'free' | 'premium'
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cols, dbModels] = await Promise.all([
        fetchCollections(),
        fetchAdminModels({
          style: styleFilter,
          tier: tierFilter,
          category: categoryFilter,
          q: searchQuery,
        }),
      ]);

      setCollections(cols);

      if (dbModels && dbModels.length > 0) {
        setModels(dbModels);
      } else {
        setModels(
          FURNITURE_CATALOG.map((item) => ({
            id: item.id,
            code: item.id,
            name: item.name,
            collectionId: item.style === 'realistic' ? 'col-modern-realistic' : 'col-stylized-kenney',
            category: item.category,
            modelType: item.modelType,
            mountType: item.mountType || 'floor',
            style: item.style || 'stylized',
            tier: item.tier || 'free',
            requiredPlan: item.requiredPlan || 'FREE',
            price: item.price || 0,
            modelPath: item.modelPath,
            thumbnailPath: item.thumbnailPath,
            dimensionX: item.dimensions?.width ?? (Array.isArray(item.dimensions) ? item.dimensions[0] : 1),
            dimensionY: item.dimensions?.height ?? (Array.isArray(item.dimensions) ? item.dimensions[1] : 1),
            dimensionZ: item.dimensions?.depth ?? (Array.isArray(item.dimensions) ? item.dimensions[2] : 1),
            dimensions: item.dimensions,
            isSurfaceHost: item.isSurfaceHost,
            canPlaceOnSurface: item.canPlaceOnSurface,
            status: 'ACTIVE',
            metadata: { description: item.description, icon: item.icon },
          }))
        );
      }
    } catch (err) {
      console.warn('[AdminModelManager] Lỗi nạp dữ liệu, dùng local fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [styleFilter, tierFilter, categoryFilter]);

  // Client-side filtering
  const filteredModels = useMemo(() => {
    return models.filter((item) => {
      if (styleFilter !== 'all' && item.style !== styleFilter) return false;
      if (tierFilter !== 'all' && item.tier !== tierFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchCode = item.code?.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [models, styleFilter, tierFilter, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = models.length;
    const stylized = models.filter((m) => m.style === 'stylized').length;
    const realistic = models.filter((m) => m.style === 'realistic').length;
    const pro = models.filter((m) => m.tier === 'premium').length;
    return { total, stylized, realistic, pro };
  }, [models]);

  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId) || null;
  }, [models, selectedModelId]);

  const handleModelUpdate = async (updated) => {
    setModels((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    try {
      await updateModel(updated.id, updated);
    } catch (err) {
      console.warn('[AdminModelManager] Cập nhật metadata server thất bại, cập nhật local:', err);
    }
  };

  const handleDeleteModel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn lưu trữ (xóa mềm) mô hình này không?')) return;
    setModels((prev) => prev.filter((m) => m.id !== id));
    if (selectedModelId === id) setSelectedModelId(null);
    try {
      await deleteModel(id);
    } catch (err) {
      console.warn('[AdminModelManager] Xóa trên server thất bại:', err);
    }
  };

  return (
    <div className={`flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans relative ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* 1. Unified Slim Command Header (Chiều cao chỉ 52px, tiết kiệm tối đa diện tích hiển thị) */}
      {!isFullscreen && (
        <header className="h-[52px] px-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg z-20 backdrop-blur-md gap-3">
          {/* Logo & Stats */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white tracking-wide">Kho Mô Hình 3D</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
                  {filteredModels.length}
                </span>
                <span className="text-[10px] text-slate-400 hidden lg:inline">
                  ({stats.stylized} stylized, {stats.realistic} PBR)
                </span>
              </div>
            </div>
          </div>

          {/* Integrated Search & Filters */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên mô hình, mã code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Quick Style Filter */}
            <div className="hidden md:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 shrink-0">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'stylized', label: '🎨 Stylized' },
                { id: 'realistic', label: '✨ PBR' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyleFilter(s.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                    styleFilter === s.id
                      ? 'bg-slate-800 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Quick Room Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 shrink-0"
            >
              <option value="all">Mọi phòng</option>
              <option value="living-room">Khách</option>
              <option value="bedroom">Ngủ</option>
              <option value="kitchen">Bếp</option>
              <option value="office">Làm việc</option>
              <option value="wall-decor">Gắn tường</option>
            </select>

            {/* Quick Tier Select */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 shrink-0"
            >
              <option value="all">Mọi hạng</option>
              <option value="free">Miễn phí (Free)</option>
              <option value="premium">💎 PRO Plan</option>
            </select>
          </div>

          {/* Mode Switcher & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid3d')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  viewMode === 'grid3d'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Lưới 3D Trưng Bày"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lưới 3D</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bảng Danh Sách"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bảng</span>
              </button>
            </div>

            {/* Batch Importer Button */}
            <button
              type="button"
              onClick={() => setIsImporterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-900/30 transition transform hover:scale-[1.02]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nhập Thư Mục</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình không gian 3D'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Studio</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Floating Exit Fullscreen Button */}
      {isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-3 right-3 z-40 flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl border border-slate-700 text-xs shadow-2xl backdrop-blur-md transition"
        >
          <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> Thoát Toàn Màn Hình
        </button>
      )}

      {/* 2. Main Viewport Area (100% diện tích không gian cho 3D) */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full min-h-0 min-w-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Đang nạp không gian 3D và các mô hình nội thất...</span>
          </div>
        ) : viewMode === 'grid3d' ? (
          /* Chế Độ Lưới 3D Chiếm Trọn 100% Khung Nhìn */
          <div className="flex-1 relative w-full h-full min-h-0 min-w-0">
            <ModelGridShowcaseCanvas
              models={filteredModels}
              selectedModelId={selectedModelId}
              onSelectModel={(m) => setSelectedModelId(m.id)}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          </div>
        ) : (
          /* Chế Độ Bảng Dữ Liệu */
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl backdrop-blur-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-16 text-center">Xem</th>
                    <th className="p-3">Tên & Mã Code</th>
                    <th className="p-3">Phong Cách</th>
                    <th className="p-3">Phòng & Loại</th>
                    <th className="p-3">Kích Thước (W×H×D)</th>
                    <th className="p-3">Phân Hạng</th>
                    <th className="p-3">Kiểu Lắp</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredModels.map((item) => {
                    const isSelected = item.id === selectedModelId;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedModelId(item.id)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-amber-500/15 text-white'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          {item.thumbnailPath ? (
                            <img
                              src={item.thumbnailPath}
                              alt={item.name}
                              className="w-10 h-10 object-contain rounded-lg bg-slate-950 border border-slate-800 mx-auto"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-[10px] mx-auto">
                              3D
                            </div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-white text-[12px]">{item.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.style === 'realistic'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {item.style === 'realistic' ? 'Realistic PBR' : 'Stylized'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[10px] mr-1.5 capitalize">
                            {item.category}
                          </span>
                          <span className="text-slate-400 text-[10px]">{item.modelType}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-300">
                          {item.dimensionX} × {item.dimensionY} × {item.dimensionZ} m
                        </td>
                        <td className="p-2.5">
                          {item.tier === 'premium' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                              💎 {item.requiredPlan}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-400 text-[11px]">
                          {item.mountType === 'wall' ? '🖼️ Gắn tường' : '🏠 Sàn'}
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedModelId(item.id);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-800 text-amber-400 transition"
                              title="Chỉnh sửa chi tiết"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModel(item.id);
                              }}
                              className="p-1 rounded-lg hover:bg-rose-950/60 text-rose-400 transition"
                              title="Xóa / Lưu trữ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel Inspector Bên Phải Dạng Overlay Drawer Nổi (Không bóp méo khung nhìn 3D) */}
        {selectedModel && (
          <div className="absolute right-0 top-0 bottom-0 z-30 flex shadow-2xl animate-fadeIn">
            <ModelInspectorPanel
              model={selectedModel}
              collections={collections}
              onChange={handleModelUpdate}
              onClose={() => setSelectedModelId(null)}
            />
          </div>
        )}
      </div>

      {/* 3. Modal Nhập Thư Mục Mô Hình */}
      <ModelBatchImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={() => {
          setIsImporterOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
