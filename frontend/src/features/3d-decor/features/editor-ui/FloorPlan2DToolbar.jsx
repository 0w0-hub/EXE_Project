import React from 'react';
import {
  MousePointer2,
  Pencil,
  DoorOpen,
  AppWindowMac,
  Trash2,
  Grid3X3,
  Undo2,
  Redo2,
  Camera,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';

export function FloorPlan2DToolbar() {
  const activeTab = useEditorStore((state) => state.activeTab);
  const mode = useEditorStore((state) => state.floorPlan2DMode);
  const setMode = useEditorStore((state) => state.setFloorPlan2DMode);
  const gridSnap = useEditorStore((state) => state.gridSnap);
  const toggleGridSnap = useEditorStore((state) => state.toggleGridSnap);

  const undo = useSceneStore((state) => state.undo);
  const redo = useSceneStore((state) => state.redo);
  const historyLen = useSceneStore((state) => state.history.length);
  const redoLen = useSceneStore((state) => state.redoStack.length);

  if (activeTab !== '2d-plan') return null;

  const handleCapturePng = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `homely-floorplan-2d-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none select-none">
      {/* 1. Thanh nút công cụ chính */}
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl pointer-events-auto">
        <button
          onClick={() => setMode('select')}
          title="Chọn & Di chuyển đồ / Đỉnh tường (S)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'select'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <MousePointer2 className="w-4 h-4" />
          <span>Chọn & Kéo</span>
        </button>

        <button
          onClick={() => setMode('add-node')}
          title="Thêm nút tường mới trên cạnh (A hoặc W) • Click lên tường để thêm nút bẻ góc"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'add-node'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Pencil className="w-4 h-4" />
          <span>Thêm nút tường</span>
        </button>

        <button
          onClick={() => setMode('place-door')}
          title="Đặt cửa đi vào tường (D)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'place-door'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Đặt cửa</span>
        </button>

        <button
          onClick={() => setMode('place-window')}
          title="Đặt cửa sổ vào tường (N)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'place-window'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <AppWindowMac className="w-4 h-4" />
          <span>Cửa sổ</span>
        </button>

        <button
          onClick={() => setMode('delete')}
          title="Xóa nút tường (Click nút để xóa, 2 cạnh kề sẽ tự động nối lại)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'delete'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
              : 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Xóa nút</span>
        </button>

        <div className="w-px h-5 bg-slate-800 mx-1" />

        <button
          onClick={toggleGridSnap}
          title="Bật/tắt bắt dính lưới 0.25m (G)"
          className={`p-1.5 rounded-xl text-xs font-medium transition-all ${
            gridSnap
              ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <button
          onClick={undo}
          disabled={historyLen === 0}
          title="Hoàn tác (Ctrl+Z)"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={redoLen === 0}
          title="Làm lại (Ctrl+Y)"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-800 mx-1" />

        <button
          onClick={handleCapturePng}
          title="Tải ảnh sơ đồ mặt bằng PNG"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-all"
        >
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>Chụp ảnh</span>
        </button>
      </div>

      {/* 2. Dòng hướng dẫn thao tác theo từng chế độ */}
      <div className="px-3.5 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-full text-[11px] text-slate-400 shadow-md">
        {mode === 'select' && '💡 Kéo nút tròn xanh để co giãn phòng • Kéo đồ nội thất để sắp xếp'}
        {mode === 'add-node' && '➕ Click lên đoạn tường bất kỳ để thêm 1 nút mới • Kéo nút để bẻ góc phòng'}
        {mode === 'place-door' && '🚪 Rê chuột lên tường và click để đặt cửa đi 3D'}
        {mode === 'place-window' && '🪟 Rê chuột lên tường và click để đặt cửa sổ 3D'}
        {mode === 'delete' && '🗑️ Click vào nút tròn đỉnh tường để xóa (2 cạnh kề sẽ tự động nối lại)'}
      </div>
    </div>
  );
}
