import React, { useRef, useState } from 'react';
import {
  Move,
  RotateCw,
  Grid,
  Eye,
  Settings2,
  Download,
  Upload,
  Trash2,
  Plus,
  Box,
  Layers,
  Sun,
  Moon,
  Camera,
  Undo2,
  Redo2,
  Sparkles,
  Footprints,
  Rotate3d,
  LayoutGrid,
  MousePointer2,
  PlusCircle,
  DoorOpen,
  AppWindowMac,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CloudUpload,
  FolderOpen,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';
import { pregenerateAllCatalogTopViews } from '../catalog/topViewRegistry';

export function TopBar() {
  const activeTab = useEditorStore((state) => state.activeTab);
  const setActiveTab = useEditorStore((state) => state.setActiveTab);

  const cameraMode = useEditorStore((state) => state.cameraMode);
  const setCameraMode = useEditorStore((state) => state.setCameraMode);

  const lightingMode = useEditorStore((state) => state.lightingMode);
  const toggleLightingMode = useEditorStore((state) => state.toggleLightingMode);

  const autoRotate = useEditorStore((state) => state.autoRotate);
  const toggleAutoRotate = useEditorStore((state) => state.toggleAutoRotate);

  const transformMode = useEditorStore((state) => state.transformMode);
  const setTransformMode = useEditorStore((state) => state.setTransformMode);

  const gridSnap = useEditorStore((state) => state.gridSnap);
  const toggleGridSnap = useEditorStore((state) => state.toggleGridSnap);

  const showGrid = useEditorStore((state) => state.showGrid);
  const toggleGrid = useEditorStore((state) => state.toggleGrid);

  const transparentWalls = useEditorStore((state) => state.transparentWalls);
  const toggleTransparentWalls = useEditorStore((state) => state.toggleTransparentWalls);

  const isCatalogOpen = useEditorStore((state) => state.isCatalogOpen);
  const setCatalogOpen = useEditorStore((state) => state.setCatalogOpen);

  const setRoomModalOpen = useEditorStore((state) => state.setRoomModalOpen);
  const userRole = useEditorStore((state) => state.userRole);

  const setSaveModalOpen = useEditorStore((state) => state.setSaveModalOpen);
  const setSavedListModalOpen = useEditorStore((state) => state.setSavedListModalOpen);
  const currentDesignName = useEditorStore((state) => state.currentDesignName);
  const currentDesignId = useEditorStore((state) => state.currentDesignId);

  // 2D Floor Plan Editor State
  const floorPlan2DMode = useEditorStore((state) => state.floorPlan2DMode);
  const setFloorPlan2DMode = useEditorStore((state) => state.setFloorPlan2DMode);
  const floorPlan2DViewport = useEditorStore((state) => state.floorPlan2DViewport);
  const updateFloorPlan2DViewport = useEditorStore((state) => state.updateFloorPlan2DViewport);
  const resetFloorPlan2DViewport = useEditorStore((state) => state.resetFloorPlan2DViewport);
  const floorPlan2DRenderMode = useEditorStore((state) => state.floorPlan2DRenderMode);
  const setFloorPlan2DRenderMode = useEditorStore((state) => state.setFloorPlan2DRenderMode);

  const exportSceneJson = useSceneStore((state) => state.exportSceneJson);
  const loadScene = useSceneStore((state) => state.loadScene);
  const resetScene = useSceneStore((state) => state.resetScene);
  const undo = useSceneStore((state) => state.undo);
  const redo = useSceneStore((state) => state.redo);
  const historyLen = useSceneStore((state) => state.history.length);
  const redoLen = useSceneStore((state) => state.redoStack.length);
  const itemCount = useSceneStore((state) => state.items.length);

  const [isGeneratingTopViews, setIsGeneratingTopViews] = useState(false);
  const [topViewProgress, setTopViewProgress] = useState('');

  const handleGenerateAllTopViews = async () => {
    setIsGeneratingTopViews(true);
    setTopViewProgress('0%');
    try {
      await pregenerateAllCatalogTopViews((done, total) => {
        setTopViewProgress(`${Math.round((done / total) * 100)}%`);
      });
      alert('Đã tạo và lưu thành công toàn bộ ảnh Top-View vào thư mục public/topviews/!');
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi tạo ảnh: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsGeneratingTopViews(false);
      setTopViewProgress('');
    }
  };

  const handleCaptureScreenshot = () => {
    const canvas = document.querySelector('#decor-canvas-container canvas');
    if (!canvas) {
      alert('Không tìm thấy màn hình 3D để chụp ảnh');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `homely-3d-render-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả đồ nội thất trong phòng?')) {
      resetScene();
    }
  };

  return (
    <header className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      {/* 1. Logo, Switch Tab & Thêm đồ */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-xl">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-[200px]" title={currentDesignName || '3D Decor Studio'}>
              {currentDesignName || '3D Decor Studio'}
            </h1>
            <p className="text-[10px] text-slate-400">{itemCount} món nội thất</p>
          </div>
        </div>

        {/* Tab 3D vs 2D CAD */}
        <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === '3d'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Không Gian 3D</span>
          </button>
          <button
            onClick={() => setActiveTab('2d-plan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === '2d-plan'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sơ Đồ 2D CAD</span>
          </button>
        </div>

        {/* Nút Thêm Nội Thất */}
        <button
          onClick={() => setCatalogOpen(!isCatalogOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs transition-all shadow-lg ${
            isCatalogOpen
              ? 'bg-blue-600 text-white shadow-blue-500/30'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Danh mục</span>
        </button>
      </div>

      {/* 2. Thanh công cụ giữa: Góc nhìn, Gizmo, Ánh sáng, Undo/Redo */}
      {activeTab === '3d' && (
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto">
          {/* Góc nhìn Camera */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setCameraMode('3d')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                cameraMode === '3d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="3D Phối cảnh tự do"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCameraMode('2d')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                cameraMode === '2d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Nhìn từ trên trần vuông góc xuống sàn"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCameraMode('walkthrough')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                cameraMode === 'walkthrough' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Góc nhìn tầm mắt người 1.6m đứng trong phòng"
            >
              <Footprints className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tự động xoay 360 */}
          <button
            onClick={toggleAutoRotate}
            className={`p-1.5 rounded-lg text-xs border transition-all ${
              autoRotate
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Bật/Tắt tự động xoay 360°"
          >
            <Rotate3d className="w-3.5 h-3.5" />
          </button>

          {/* Chế độ Ánh sáng Ngày / Buổi tối */}
          <button
            onClick={toggleLightingMode}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              lightingMode === 'evening'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/80 text-amber-400 border-slate-700 hover:text-amber-300'
            }`}
            title="Đổi giữa ánh sáng ban ngày và ban đêm thắp đèn vàng"
          >
            {lightingMode === 'evening' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">{lightingMode === 'evening' ? 'Đêm' : 'Ngày'}</span>
          </button>

          <div className="w-[1px] h-5 bg-slate-700 my-auto" />

          {/* Di chuyển / Xoay */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setTransformMode('translate')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                transformMode === 'translate' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Chế độ di chuyển (Kéo mũi tên trục X, Z)"
            >
              <Move className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTransformMode('rotate')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                transformMode === 'rotate' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Chế độ xoay quanh trục thẳng đứng"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bắt Lưới Snap */}
          <button
            onClick={toggleGridSnap}
            className={`p-1.5 rounded-lg text-xs border transition-all ${
              gridSnap
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={gridSnap ? 'Bắt dính lưới snap: Đang BẬT' : 'Bắt dính lưới snap: Đang TẮT'}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Bật/Tắt Lưới Sàn */}
          <button
            onClick={toggleGrid}
            className={`p-1.5 rounded-lg text-xs border transition-all ${
              showGrid
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={showGrid ? 'Đường lưới sàn: Đang BẬT' : 'Đường lưới sàn: Đang TẮT'}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          {/* Bật/Tắt Tường Trong Suốt Theo Góc Nhìn */}
          <button
            onClick={toggleTransparentWalls}
            className={`p-1.5 rounded-lg text-xs border transition-all ${
              transparentWalls
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={
              transparentWalls
                ? 'Ẩn tường chắn theo góc nhìn camera: Đang BẬT'
                : 'Hiển thị tất cả tường kín: Đang TẮT'
            }
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* FEATURE_AUTO_ARRANGE: Tạm ẩn menu Bố trí trên thanh công cụ do tính năng đang thử nghiệm (xem hướng dẫn tại docs/architecture/refactoring-and-backend-integration-plan.md) */}
          {/*
          <div className="relative" ref={arrangeMenuRef}>
            <button
              onClick={() => setShowArrangeMenu(!showArrangeMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition-all"
              title="Bố trí và căn chỉnh khoảng cách các vật thể"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[11px] hidden md:inline">Bố trí</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showArrangeMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1">
                <button
                  onClick={() => handleArrange('ergonomic')}
                  className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors"
                >
                  <Compass className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">Bố trí Công thái học</div>
                    <div className="text-[10px] text-slate-400">
                      Căn khoảng cách chuẩn: Sofa cách bàn 0.45m, Tivi cách 2m, Giường bám tường
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleArrange('push')}
                  className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">Tách va chạm an toàn</div>
                    <div className="text-[10px] text-slate-400">
                      Giữ nguyên bố cục hiện tại, chỉ đẩy tách các món đang đè lên nhau
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleArrange('distribute')}
                  className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors"
                >
                  <LayoutGrid className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">Dàn đều khoảng cách</div>
                    <div className="text-[10px] text-slate-400">
                      Căn đều các vật thể theo lưới tạo lối đi thông thoáng
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
          */}

          <div className="w-[1px] h-5 bg-slate-700 my-auto" />

          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={historyLen === 0}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={redoLen === 0}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2b. Thanh công cụ giữa khi ở Tab Mặt bằng 2D CAD */}
      {activeTab === '2d-plan' && (
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto">
          {/* Chế độ tương tác */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setFloorPlan2DMode('select')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                floorPlan2DMode === 'select' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Chọn / kéo đồ hoặc đỉnh tường (S)"
            >
              <MousePointer2 className="w-3.5 h-3.5" />
            </button>
            {/* FEATURE_WALL_DRAWING: Tạm ẩn nút vẽ đoạn tường (xem hướng dẫn tại docs/architecture/refactoring-and-backend-integration-plan.md) */}
            {/*
            <button
              onClick={() => setFloorPlan2DMode('draw-wall')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                floorPlan2DMode === 'draw-wall' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Vẽ đoạn tường mới (W)"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            */}
            <button
              onClick={() => setFloorPlan2DMode('add-node')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                floorPlan2DMode === 'add-node' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Thêm nút bẻ góc tường (A)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFloorPlan2DMode('place-door')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                floorPlan2DMode === 'place-door' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Đặt cửa đi lên tường (D)"
            >
              <DoorOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFloorPlan2DMode('place-window')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                floorPlan2DMode === 'place-window' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Đặt cửa sổ lên tường (N)"
            >
              <AppWindowMac className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFloorPlan2DMode('delete')}
              className={`p-1.5 rounded-md text-xs transition-all ${
                floorPlan2DMode === 'delete' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
              }`}
              title="Xóa tường / đỉnh / cửa (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-5 bg-slate-700 my-auto" />

          {/* Chuyển đổi phong cách hiển thị: 3D Ortho vs 2D CAD */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setFloorPlan2DRenderMode('ortho')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                floorPlan2DRenderMode === 'ortho'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Chế độ ảnh chụp trực giao 3D thực tế từ mô hình (Orthographic)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden md:inline">3D Thực Tế</span>
            </button>
            <button
              onClick={() => setFloorPlan2DRenderMode('cad')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                floorPlan2DRenderMode === 'cad'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Chế độ bản vẽ kỹ thuật CAD có đổ bóng mờ (Technical Drawing)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Bản Vẽ CAD</span>
            </button>
          </div>

          <div className="w-[1px] h-5 bg-slate-700 my-auto" />

          {/* Bắt lưới Snap */}
          <button
            onClick={toggleGridSnap}
            className={`p-1.5 rounded-lg text-xs border transition-all ${
              gridSnap
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={gridSnap ? 'Bắt dính lưới snap: Đang BẬT' : 'Bắt dính lưới snap: Đang TẮT'}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-5 bg-slate-700 my-auto" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateFloorPlan2DViewport({ zoom: Math.max(0.3, floorPlan2DViewport.zoom * 0.8) })}
              className="p-1.5 rounded-lg text-xs bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-white transition-all"
              title="Thu nhỏ (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 min-w-[2.5rem] text-center">
              {Math.round(floorPlan2DViewport.zoom * 100)}%
            </span>
            <button
              onClick={() => updateFloorPlan2DViewport({ zoom: Math.min(4.0, floorPlan2DViewport.zoom * 1.25) })}
              className="p-1.5 rounded-lg text-xs bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-white transition-all"
              title="Phóng to (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetFloorPlan2DViewport}
              className="p-1.5 rounded-lg text-xs bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-white transition-all"
              title="Đặt lại góc nhìn vừa màn hình (0)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-5 bg-slate-700 my-auto" />

          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={historyLen === 0}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={redoLen === 0}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Chụp ảnh, Cài đặt phòng, JSON */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto">
        {/* Chụp ảnh render 3D */}
        {activeTab === '3d' && (
          <button
            onClick={handleCaptureScreenshot}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
            title="Chụp ảnh kết xuất 3D độ nét cao"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline text-[11px]">Chụp ảnh</span>
          </button>
        )}

        {/* Tải ảnh bản vẽ 2D CAD */}
        {activeTab === '2d-plan' && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('export-2d-floorplan-png'))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
            title="Tải ảnh bản vẽ mặt bằng 2D CAD (PNG)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline text-[11px]">Tải PNG</span>
          </button>
        )}

        {/* FEATURE_GENERATE_TOPVIEWS: Chỉ hiển thị cho Quản trị viên (Admin) */}
        {activeTab === '2d-plan' && userRole === 'admin' && (
          <button
            onClick={handleGenerateAllTopViews}
            disabled={isGeneratingTopViews}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-amber-300 border border-amber-500/40 hover:bg-slate-700 disabled:opacity-40 transition-all"
            title="[Admin] Tạo và lưu sẵn toàn bộ ảnh 2D của danh mục vào thư mục public/topviews/"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isGeneratingTopViews ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline text-[11px]">
              {isGeneratingTopViews ? `Đang tạo ${topViewProgress}` : 'Lưu kho ảnh 2D (Admin)'}
            </span>
          </button>
        )}

        {/* Kích thước phòng */}
        <button
          onClick={() => setRoomModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
          title="Tùy chỉnh kích thước phòng và màu sơn"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Kích thước</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700 my-auto" />

        {/* Lưu vào Database Homely */}
        <button
          onClick={() => setSaveModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all"
          title="Lưu thiết kế này vào cơ sở dữ liệu Homely"
        >
          <CloudUpload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Lưu DB</span>
        </button>

        {/* Xem danh sách bản vẽ đã lưu trong Database */}
        <button
          onClick={() => setSavedListModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
          title="Xem danh sách bản thiết kế đã lưu trong Database"
        >
          <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline text-[11px]">Bản vẽ đã lưu</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700 my-auto" />

        {/* Xóa sạch phòng */}
        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
          title="Xóa toàn bộ đồ đạc"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
