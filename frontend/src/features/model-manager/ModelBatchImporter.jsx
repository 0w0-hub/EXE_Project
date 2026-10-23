import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  Grid,
  List,
  Sparkles,
  FileCode,
  Image,
  X,
} from 'lucide-react';
import { ModelGridShowcaseCanvas } from './ModelGridShowcaseCanvas';
import { ModelInspectorPanel } from './ModelInspectorPanel';
import { inferModelMetadata } from './autoModelInference';
import { fetchCollections, uploadModelFile, saveBatchImport } from './modelManagerApi';

export function ModelBatchImporter({ isOpen, onClose, onImportSuccess }) {
  const fileInputRef = useRef(null);
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('col-modern-realistic');
  const [importedModels, setImportedModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [viewMode, setViewMode] = useState('grid3d'); // 'grid3d' | 'table'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkTier, setBulkTier] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  // Nạp danh sách bộ sưu tập khi mở modal
  useEffect(() => {
    if (isOpen) {
      fetchCollections().then((cols) => {
        setCollections(cols);
        if (cols.length > 0) {
          setSelectedCollectionId((prev) => prev || cols[0].id);
        }
      });
    }
  }, [isOpen]);

  // Giải phóng Blob URLs khi đóng hoặc unmount
  useEffect(() => {
    return () => {
      importedModels.forEach((m) => {
        if (m.blobUrl) URL.revokeObjectURL(m.blobUrl);
      });
    };
  }, [importedModels]);

  // Xử lý nạp thư mục từ File API
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const modelFiles = files.filter((f) => /\.(glb|gltf)$/i.test(f.name));
    const imageFiles = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f.name));

    if (modelFiles.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Không tìm thấy tệp mô hình 3D (.glb hoặc .gltf) nào trong thư mục đã chọn!',
      });
      return;
    }

    // Tạo map ảnh preview theo tên gốc (không đuôi)
    const imageMap = new Map();
    imageFiles.forEach((img) => {
      const base = img.name.replace(/\.[^/.]+$/, '').toLowerCase();
      imageMap.set(base, URL.createObjectURL(img));
    });

    const parsedModels = modelFiles.map((file, idx) => {
      const id = `import-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
      const blobUrl = URL.createObjectURL(file);
      const thumbnailDataUrl = imageMap.get(baseName) || null;

      const inferred = inferModelMetadata(file.name);

      return {
        id,
        file,
        blobUrl,
        thumbnailDataUrl,
        thumbnailPath: thumbnailDataUrl,
        collectionId: selectedCollectionId,
        fileSizeBytes: file.size,
        rotationY: 0,
        ...inferred,
        dimensions: { width: 1.0, height: 1.0, depth: 1.0 },
      };
    });

    setImportedModels(parsedModels);
    setSelectedModelId(parsedModels[0]?.id || null);
    setStatusMessage({
      type: 'success',
      text: `Đã nạp ${parsedModels.length} mô hình 3D và ${imageFiles.length} ảnh preview từ thư mục!`,
    });
  };

  // Cập nhật kích thước thực tế khi Three.js đo xong Box3
  const handleModelMeasured = useCallback((id, dims) => {
    setImportedModels((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              dimensions: dims,
              dimensionX: dims.width,
              dimensionY: dims.height,
              dimensionZ: dims.depth,
            }
          : m
      )
    );
  }, []);

  // Cập nhật thông tin mô hình khi chỉnh sửa trong Inspector
  const handleModelChange = (updated) => {
    setImportedModels((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  };

  // Bulk Edit áp dụng cho toàn bộ danh sách vừa import
  const handleBulkApplyCategory = (cat) => {
    if (!cat) return;
    setImportedModels((prev) => prev.map((m) => ({ ...m, category: cat })));
    setBulkCategory(cat);
  };

  const handleBulkApplyTier = (tier) => {
    if (!tier) return;
    const requiredPlan = tier === 'premium' ? 'PLUS' : 'FREE';
    setImportedModels((prev) =>
      prev.map((m) => ({ ...m, tier, requiredPlan }))
    );
    setBulkTier(tier);
  };

  // Lưu tất cả vào Database
  const handleSaveToDatabase = async () => {
    if (importedModels.length === 0) return;

    setIsUploading(true);
    setStatusMessage(null);
    setUploadProgress({ current: 0, total: importedModels.length });

    try {
      const preparedItems = [];
      const col = collections.find((c) => c.id === selectedCollectionId);
      const subDir = col ? col.code : 'custom';

      for (let i = 0; i < importedModels.length; i++) {
        const item = importedModels[i];
        setUploadProgress({ current: i + 1, total: importedModels.length });

        let modelPath = item.modelPath;
        if (item.file) {
          try {
            const uploadRes = await uploadModelFile(item.file, subDir);
            modelPath = uploadRes.path;
          } catch (uploadErr) {
            console.warn(`[BatchImport] Upload file ${item.name} thất bại, dùng fallback path:`, uploadErr);
            modelPath = `/uploads/models/${subDir}/${item.code}.glb`;
          }
        }

        preparedItems.push({
          ...item,
          modelPath,
        });
      }

      const result = await saveBatchImport(selectedCollectionId, preparedItems);

      setStatusMessage({
        type: 'success',
        text: `Tuyệt vời! Đã lưu thành công ${result.totalImported || preparedItems.length} mô hình vào Database!`,
      });

      if (onImportSuccess) {
        setTimeout(() => {
          onImportSuccess(result);
        }, 1200);
      }
    } catch (err) {
      console.error('[BatchImport] Lỗi lưu vào DB:', err);
      setStatusMessage({
        type: 'error',
        text: `Lỗi lưu vào Database: ${err.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const currentSelectedModel = importedModels.find((m) => m.id === selectedModelId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col overflow-hidden select-none font-sans animate-fadeIn">
      {/* 1. Header Studio */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              Nhập Thư Mục Mô Hình 3D (Batch Importer Studio)
            </h2>
            <p className="text-[11px] text-slate-400">
              Quét folder GLB, tự động đo kích thước 3D thực tế và xem trên Lưới 3D Trưng Bày
            </p>
          </div>
        </div>

        {/* Thanh Điều Hướng Nhanh */}
        <div className="flex items-center gap-3">
          {/* Chọn Bộ Sưu Tập */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span>Bộ sưu tập:</span>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="bg-transparent text-amber-400 font-bold focus:outline-none"
            >
              {collections.map((col) => (
                <option key={col.id} value={col.id} className="bg-slate-900 text-white">
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
          >
            <FolderPlus className="w-4 h-4 text-sky-400" />
            {importedModels.length > 0 ? 'Chọn Thư Mục Khác' : 'Chọn Thư Mục Mô Hình'}
          </button>

          {importedModels.length > 0 && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'grid3d'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> Lưới 3D
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Danh Sách
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={importedModels.length === 0 || isUploading}
            onClick={handleSaveToDatabase}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              importedModels.length === 0 || isUploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang lưu ({uploadProgress.current}/{uploadProgress.total})...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Lưu Tất Cả Vào Database ({importedModels.length})
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Status / Feedback Banner */}
      {statusMessage && (
        <div
          className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            statusMessage.type === 'error'
              ? 'bg-rose-950/70 text-rose-300 border-rose-900/80'
              : 'bg-emerald-950/70 text-emerald-300 border-emerald-900/80'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-[11px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Bulk Action Bar (Hiển thị khi đã nạp mô hình) */}
      {importedModels.length > 0 && (
        <div className="h-12 px-6 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between shrink-0 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Áp dụng hàng loạt cho tất cả ({importedModels.length} mô hình):</span>

            {/* Bulk Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Phòng:</span>
              <select
                value={bulkCategory}
                onChange={(e) => handleBulkApplyCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Chọn phòng --</option>
                <option value="living-room">🛋️ Phòng khách</option>
                <option value="bedroom">🛏️ Phòng ngủ</option>
                <option value="kitchen">🍳 Phòng bếp</option>
                <option value="office">💼 Làm việc</option>
                <option value="bathroom">🚿 Phòng tắm</option>
                <option value="decor">🪴 Trang trí</option>
                <option value="wall-decor">🖼️ Gắn tường</option>
              </select>
            </div>

            {/* Bulk Tier */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Phân hạng:</span>
              <select
                value={bulkTier}
                onChange={(e) => handleBulkApplyTier(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Chọn hạng --</option>
                <option value="free">🟢 Miễn phí (Free)</option>
                <option value="premium">💎 Gói Cao Cấp (PRO)</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Đã chọn: <span className="text-amber-400 font-bold">{currentSelectedModel?.name || currentSelectedModel?.code || 'Chưa chọn'}</span>
          </div>
        </div>
      )}

      {/* 4. Main Body: Drag & Drop Zone HOẶC Dual-View 3D Showcase */}
      <div className="flex-1 flex overflow-hidden relative">
        {importedModels.length === 0 ? (
          /* Empty State: Khu Vực Thả Thư Mục Đẹp Mắt */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="max-w-xl w-full p-12 rounded-3xl border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-slate-900/40 hover:bg-slate-900/80 transition cursor-pointer flex flex-col items-center group shadow-2xl"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition transform">
                <FolderPlus className="w-10 h-10" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                Chọn hoặc Thả Thư Mục Mô Hình Vào Đây
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                Hệ thống sẽ quét tự động toàn bộ các tệp mô hình <span className="text-amber-300 font-mono">.glb</span>, <span className="text-amber-300 font-mono">.gltf</span> và các tệp ảnh preview đi kèm để hiển thị ngay trên lưới 3D.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-900/30 transition transform group-hover:scale-105"
                >
                  Chọn Thư Mục Từ Máy Tính
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-[11px] text-slate-400 border-t border-slate-800/80 pt-6">
                <div className="flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-sky-400" />
                  <span>Định dạng 3D: GLB / GLTF</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-emerald-400" />
                  <span>Ảnh Thumbnail: PNG / JPG</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tự động đo kích thước Box3</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Đã Nạp Mô Hình: Hiển Thị Lưới 3D / Bảng & Inspector Bên Phải */
          <>
            <div className="flex-1 relative w-full h-full bg-slate-950">
              {viewMode === 'grid3d' ? (
                <ModelGridShowcaseCanvas
                  models={importedModels}
                  selectedModelId={selectedModelId}
                  onSelectModel={(m) => setSelectedModelId(m.id)}
                  onModelMeasured={handleModelMeasured}
                />
              ) : (
                <div className="h-full overflow-y-auto p-6">
                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="p-3 w-16 text-center">Xem</th>
                          <th className="p-3">Tên & Mã Code</th>
                          <th className="p-3">Phòng & Loại</th>
                          <th className="p-3">Kích Thước Đo Được (W×H×D)</th>
                          <th className="p-3">Phân Hạng</th>
                          <th className="p-3">Dung Lượng File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {importedModels.map((item) => {
                          const isSelected = item.id === selectedModelId;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedModelId(item.id)}
                              className={`cursor-pointer transition ${
                                isSelected ? 'bg-amber-500/15 text-white' : 'hover:bg-slate-800/40 text-slate-300'
                              }`}
                            >
                              <td className="p-3 text-center">
                                {item.thumbnailDataUrl ? (
                                  <img
                                    src={item.thumbnailDataUrl}
                                    alt={item.name}
                                    className="w-10 h-10 object-contain rounded-lg bg-slate-950 border border-slate-800 mx-auto"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-[10px] mx-auto">
                                    3D
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-white text-[13px]">{item.name}</div>
                                <div className="font-mono text-[11px] text-slate-400">{item.code}</div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[11px] mr-1.5 capitalize">
                                  {item.category}
                                </span>
                                <span className="text-slate-400 text-[11px]">{item.modelType}</span>
                              </td>
                              <td className="p-3 font-mono text-slate-300">
                                {item.dimensions?.width || item.dimensionX} ×{' '}
                                {item.dimensions?.height || item.dimensionY} ×{' '}
                                {item.dimensions?.depth || item.dimensionZ} m
                              </td>
                              <td className="p-3">
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
                              <td className="p-3 font-mono text-slate-400 text-[11px]">
                                {item.fileSizeBytes
                                  ? `${(item.fileSizeBytes / 1024).toFixed(1)} KB`
                                  : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Inspector Panel Cho Mô Hình Được Chọn Dạng Overlay Drawer */}
            {currentSelectedModel && (
              <div className="absolute right-0 top-0 bottom-0 z-30 flex shadow-2xl animate-fadeIn">
                <ModelInspectorPanel
                  model={currentSelectedModel}
                  collections={collections}
                  onChange={handleModelChange}
                  onClose={() => setSelectedModelId(null)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
