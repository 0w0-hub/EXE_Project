import React, { useState, useEffect } from 'react';
import { X, CloudUpload, Check, AlertCircle, PlusCircle, Save } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';
import { studioDesignApi } from '../../../../services/api';

export function SaveDesignModal({ onSaveSuccess }) {
  const isSaveModalOpen = useEditorStore((state) => state.isSaveModalOpen);
  const setSaveModalOpen = useEditorStore((state) => state.setSaveModalOpen);
  const currentDesignId = useEditorStore((state) => state.currentDesignId);
  const currentDesignName = useEditorStore((state) => state.currentDesignName);
  const setCurrentDesign = useEditorStore((state) => state.setCurrentDesign);

  const getSceneData = useSceneStore((state) => state.getSceneData);

  const [name, setName] = useState('');
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isSaveModalOpen) {
      setName(currentDesignName || 'Thiết kế phòng mới');
      setSaveAsNew(!currentDesignId);
      setError(null);
      setSuccessMsg('');
    }
  }, [isSaveModalOpen, currentDesignName, currentDesignId]);

  if (!isSaveModalOpen) return null;

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên cho bản thiết kế');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const sceneData = getSceneData();
      const dataString = JSON.stringify(sceneData);

      const targetId = saveAsNew ? null : currentDesignId;
      const res = await studioDesignApi.save({
        id: targetId,
        name: name.trim(),
        data: dataString,
      });

      setCurrentDesign(res.id, res.name);
      setSuccessMsg('Đã lưu thiết kế thành công vào database!');

      if (onSaveSuccess) {
        onSaveSuccess(res);
      }

      setTimeout(() => {
        setSaveModalOpen(false);
      }, 900);
    } catch (err) {
      console.error('Lỗi khi lưu thiết kế:', err);
      setError(err?.message || 'Không thể lưu thiết kế vào máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {currentDesignId && !saveAsNew ? 'Cập Nhật Bản Thiết Kế' : 'Lưu Bản Thiết Kế Mới'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentDesignId && !saveAsNew
                  ? 'Cập nhật trực tiếp dữ liệu phòng vào dự án này'
                  : 'Tạo bản thiết kế mới trong mục Dự án của tôi'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSaveModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tên Bản Thiết Kế
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Phòng khách chung cư 25m2..."
              disabled={isSaving}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              autoFocus
            />
          </div>

          {currentDesignId && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-2">Chế độ lưu:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaveAsNew(false)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    !saveAsNew
                      ? 'bg-blue-600/20 border-blue-500/60 text-blue-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Save className="w-3.5 h-3.5 text-blue-400" />
                    <span>Ghi đè hiện tại</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Cập nhật thiết kế này</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSaveAsNew(true)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    saveAsNew
                      ? 'bg-purple-600/20 border-purple-500/60 text-purple-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>Lưu bản sao mới</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Tạo bản ghi mới độc lập</div>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSaveModalOpen(false)}
              disabled={isSaving}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>{saveAsNew ? 'Lưu mới vào DB' : 'Lưu cập nhật'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
