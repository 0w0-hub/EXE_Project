import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Calendar,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Box,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';
import { studioDesignApi } from '../../../../services/api';

export function SavedDesignsModal({ onLoadDesign }) {
  const isSavedListModalOpen = useEditorStore((state) => state.isSavedListModalOpen);
  const setSavedListModalOpen = useEditorStore((state) => state.setSavedListModalOpen);
  const currentDesignId = useEditorStore((state) => state.currentDesignId);
  const setCurrentDesign = useEditorStore((state) => state.setCurrentDesign);

  const loadScene = useSceneStore((state) => state.loadScene);
  const resetScene = useSceneStore((state) => state.resetScene);

  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studioDesignApi.listMine();
      setDesigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thiết kế:', err);
      setError(err?.message || 'Không thể tải danh sách thiết kế');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSavedListModalOpen) {
      fetchDesigns();
      setSearchTerm('');
    }
  }, [isSavedListModalOpen]);

  if (!isSavedListModalOpen) return null;

  const handleOpen = async (designSummary) => {
    try {
      setLoadingId(designSummary.id);
      const full = await studioDesignApi.get(designSummary.id);
      if (full && full.data) {
        const parsed = JSON.parse(full.data);
        loadScene(parsed);
        setCurrentDesign(full.id, full.name);

        if (onLoadDesign) {
          onLoadDesign(full);
        }
        setSavedListModalOpen(false);
      }
    } catch (err) {
      console.error('Lỗi khi nạp dữ liệu thiết kế:', err);
      alert('Không thể mở thiết kế này: ' + (err?.message || 'Dữ liệu bị lỗi'));
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản thiết kế này vĩnh viễn?')) return;

    try {
      setDeletingId(id);
      await studioDesignApi.delete(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      if (currentDesignId === id) {
        setCurrentDesign(null, 'Thiết kế phòng mới');
      }
    } catch (err) {
      alert('Lỗi khi xóa thiết kế: ' + (err?.message || 'Không thể xóa'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateNewBlank = () => {
    if (window.confirm('Bạn muốn bắt đầu với một căn phòng trống mới? Mọi thay đổi chưa lưu sẽ bị mất.')) {
      resetScene();
      setCurrentDesign(null, 'Thiết kế phòng mới');
      if (onLoadDesign) {
        onLoadDesign({ id: null, name: 'Thiết kế phòng mới' });
      }
      setSavedListModalOpen(false);
    }
  };

  const filteredDesigns = designs.filter((d) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Bản Vẽ Đã Lưu Của Tôi</h2>
              <p className="text-[11px] text-slate-400">Chọn thiết kế để tiếp tục chỉnh sửa trong Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewBlank}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Phòng Mới</span>
            </button>
            <button
              onClick={() => setSavedListModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm thiết kế theo tên..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={fetchDesigns}
            disabled={loading}
            title="Tải lại danh sách"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading && (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span>Đang tải danh sách bản thiết kế...</span>
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-rose-400 text-xs">
              <p>{error}</p>
              <button
                onClick={fetchDesigns}
                className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && filteredDesigns.length === 0 && (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-600">
                <Box className="w-6 h-6" />
              </div>
              <p className="text-xs">
                {searchTerm
                  ? 'Không tìm thấy thiết kế nào khớp với từ khóa.'
                  : 'Bạn chưa có bản thiết kế nào được lưu trong Database.'}
              </p>
              {!searchTerm && (
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Hãy thiết kế căn phòng của bạn và nhấn nút "Lưu DB" trên thanh công cụ để đồng bộ!
                </p>
              )}
            </div>
          )}

          {!loading &&
            filteredDesigns.map((design) => {
              const isCurrent = currentDesignId === design.id;
              const isLoadingThis = loadingId === design.id;
              const isDeletingThis = deletingId === design.id;

              return (
                <div
                  key={design.id}
                  onClick={() => handleOpen(design)}
                  className={`group p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-blue-600/10 border-blue-500/50 hover:bg-blue-600/15'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'
                      }`}
                    >
                      <Box className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{design.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                            Đang mở
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Sửa lúc: {formatDate(design.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isLoadingThis}
                      onClick={() => handleOpen(design)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                    >
                      {isLoadingThis ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang mở...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3" />
                          <span>Mở</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingThis}
                      onClick={(e) => handleDelete(design.id, e)}
                      title="Xóa thiết kế này"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      {isDeletingThis ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
