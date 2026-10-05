import React, { useEffect } from 'react';
import { SceneCanvas } from './features/scene-3d/SceneCanvas';
import { FloorPlan2DView } from './features/editor-ui/FloorPlan2DView';
import { TopBar } from './features/editor-ui/TopBar';
import { CatalogDrawer } from './features/editor-ui/CatalogDrawer';
import { InspectorPanel } from './features/editor-ui/InspectorPanel';
import { RoomSettingsModal } from './features/editor-ui/RoomSettingsModal';
import { SaveDesignModal } from './features/editor-ui/SaveDesignModal';
import { SavedDesignsModal } from './features/editor-ui/SavedDesignsModal';
import { useSceneStore } from './stores/useSceneStore';
import { useEditorStore } from './stores/useEditorStore';

export default function App({ onSaveSuccess, onLoadDesign }) {
  const selectedItemId = useSceneStore((state) => state.selectedItemId);
  const selectItem = useSceneStore((state) => state.selectItem);
  const removeItem = useSceneStore((state) => state.removeItem);
  const selectedOpeningId = useSceneStore((state) => state.selectedOpeningId);
  const selectOpening = useSceneStore((state) => state.selectOpening);
  const wgRemoveOpening = useSceneStore((state) => state.wgRemoveOpening);
  const undo = useSceneStore((state) => state.undo);
  const redo = useSceneStore((state) => state.redo);

  const activeTab = useEditorStore((state) => state.activeTab);
  const setTransformMode = useEditorStore((state) => state.setTransformMode);
  const toggleGridSnap = useEditorStore((state) => state.toggleGridSnap);
  const setFloorPlan2DMode = useEditorStore((state) => state.setFloorPlan2DMode);

  // Lắng nghe các phím tắt tiện ích
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bỏ qua nếu đang gõ văn bản
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // Phím tắt Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId) {
          removeItem(selectedItemId);
        } else if (selectedOpeningId) {
          wgRemoveOpening(selectedOpeningId);
        }
      } else if (e.key === 'Escape') {
        selectItem(null);
        selectOpening(null);
      } else if (e.key === 't' || e.key === 'T') {
        setTransformMode('translate');
      } else if (e.key === 'r' || e.key === 'R') {
        setTransformMode('rotate');
      } else if (e.key === 'g' || e.key === 'G') {
        toggleGridSnap();
      } else if (activeTab === '2d-plan') {
        // Phím tắt chế độ 2D
        if (e.key === 's' || e.key === 'S') setFloorPlan2DMode('select');
        if (e.key === 'w' || e.key === 'W') setFloorPlan2DMode('draw-wall');
        if (e.key === 'a' || e.key === 'A') setFloorPlan2DMode('add-node');
        if (e.key === 'd' || e.key === 'D') setFloorPlan2DMode('place-door');
        if (e.key === 'n' || e.key === 'N') setFloorPlan2DMode('place-window');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedItemId,
    removeItem,
    selectItem,
    selectedOpeningId,
    selectOpening,
    wgRemoveOpening,
    setTransformMode,
    toggleGridSnap,
    undo,
    redo,
    activeTab,
    setFloorPlan2DMode,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* 1. Thanh công cụ trên cùng */}
      <TopBar />

      {/* 2. Không gian hiển thị: 3D Canvas hoặc 2D CAD độc lập (cùng 1 dữ liệu căn phòng useSceneStore) */}
      <div className="w-full h-full">
        {activeTab === '2d-plan' ? (
          <FloorPlan2DView />
        ) : (
          <SceneCanvas />
        )}
      </div>

      {/* 3. Khay chọn đồ nội thất bên trái */}
      <CatalogDrawer />

      {/* 4. Bảng thuộc tính đối tượng bên phải */}
      <InspectorPanel />

      {/* 5. Hộp thoại cài đặt kích thước phòng */}
      <RoomSettingsModal />

      {/* 5b. Hộp thoại lưu thiết kế vào Database */}
      <SaveDesignModal onSaveSuccess={onSaveSuccess} />

      {/* 5c. Hộp thoại mở bản vẽ đã lưu trong Database */}
      <SavedDesignsModal onLoadDesign={onLoadDesign} />

      {/* 6. Hướng dẫn phím tắt nhanh ở góc dưới màn hình */}
      {activeTab === '3d' ? (
        <div className="absolute bottom-3 left-4 z-10 hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
          <span>Phím tắt:</span>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">T</span> Di chuyển
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">R</span> Xoay
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">G</span> Bắt lưới
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Ctrl+Z</span> Hoàn tác
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Del</span> Xóa
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Esc</span> Bỏ chọn
        </div>
      ) : (
        <div className="absolute bottom-3 left-4 z-10 hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
          <span>Phím tắt 2D:</span>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">S</span> Chọn
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">W</span> Vẽ tường
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">A</span> Thêm nút
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">D</span> Cửa đi
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">N</span> Cửa sổ
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">R</span> Xoay 45°
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Del</span> Xóa
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Chuột phải+Kéo</span> Pan
        </div>
      )}
    </div>
  );
}
