import { create } from 'zustand';

export const useEditorStore = create((set) => ({
  // Tab hiển thị: '3d' (Canvas 3D) hoặc '2d-plan' (Sơ đồ mặt bằng CAD 2D)
  activeTab: '3d',

  // Chế độ quan sát camera: '3d' | '2d' (Top-down) | 'walkthrough' (Tầm mắt người 1.6m)
  cameraMode: '3d',

  // Chế độ ánh sáng: 'day' (Ban ngày) hoặc 'evening' (Buổi tối / Đèn vàng)
  lightingMode: 'day',

  // Tự động xoay camera 360 độ
  autoRotate: false,

  // Chế độ biến đổi của Gizmo: 'translate' (Di chuyển) hoặc 'rotate' (Xoay)
  transformMode: 'translate',

  // Bật/tắt tự động bắt dính theo lưới
  gridSnap: true,
  snapStep: 0.25, // Bước nhảy vị trí: 0.25 mét
  snapAngle: Math.PI / 12, // Bước nhảy xoay: 15 độ

  // Hiển thị lưới sàn
  showGrid: true,

  // Chế độ tường & trần trong suốt (mặc định tắt để tường đặc sắc nét, không bị bóng ma)
  transparentWalls: false,

  // Trạng thái hiển thị các cửa sổ UI modal/drawer
  isCatalogOpen: false,
  isRoomModalOpen: false,
  isShortcutsOpen: false,
  isSaveModalOpen: false,
  isSavedListModalOpen: false,

  // Thông tin thiết kế hiện tại đang mở từ Database
  currentDesignId: null,
  currentDesignName: 'Thiết kế phòng mới',

  // Phân quyền người dùng: 'user' (mặc định) hoặc 'admin' (quản trị viên)
  // Hỗ trợ cấu hình qua URL (?role=admin hoặc ?admin=true) hoặc localStorage('homely_role')
  userRole: (() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('role') === 'admin' || params.get('admin') === 'true') return 'admin';
        const stored = localStorage.getItem('homely_role');
        if (stored) return stored;
      } catch {
        // ignore
      }
    }
    return 'user';
  })(),
  setUserRole: (role) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('homely_role', role);
      } catch {
        // ignore
      }
    }
    set({ userRole: role });
  },

  // Trạng thái đang kéo rê vật thể trực tiếp bằng chuột (để tạm khoá OrbitControls)
  isDraggingItem: false,
  setIsDraggingItem: (isDragging) => set({ isDraggingItem: isDragging }),

  // ─────────────────────────────────────────────────────────────────────────
  // 2D FLOOR PLAN EDITOR STATE
  // ─────────────────────────────────────────────────────────────────────────

  // Chế độ tương tác trong 2D editor
  // 'select'       → Chọn / click đồ nội thất, tường, cửa
  // 'move'         → Kéo thả đồ nội thất
  // 'draw-wall'    → Vẽ đoạn tường mới bằng chuột
  // 'place-door'   → Click vào tường để đặt cửa đi
  // 'place-window' → Click vào tường để đặt cửa sổ
  // 'delete'       → Click vào tường/đỉnh/cửa để xóa
  floorPlan2DMode: 'select',

  // Trạng thái vẽ tường đang thực hiện (null nếu không đang vẽ)
  wallDrawingState: null,
  // Ví dụ khi đang vẽ:
  // {
  //   v1Id: 'v-abc123',       // ID đỉnh bắt đầu (đã confirmed)
  //   v1x: -2.5, v1z: -1.5,  // Toạ độ world của v1 (để preview)
  //   previewX: 0, previewZ: 0, // Toạ độ cursor hiện tại (real-time)
  //   snapAngle: false,        // Có đang giữ Shift (snap góc) không
  // }

  // Viewport state cho SVG pan & zoom trong 2D editor
  floorPlan2DViewport: {
    zoom: 1.0,      // Hệ số phóng to: 0.3 → 3.0
    panX: 0,        // Offset pan theo X (pixels)
    panZ: 0,        // Offset pan theo Z (pixels)
  },

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setLightingMode: (mode) => set({ lightingMode: mode }),
  toggleLightingMode: () =>
    set((state) => ({ lightingMode: state.lightingMode === 'day' ? 'evening' : 'day' })),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  setTransformMode: (mode) => set({ transformMode: mode }),
  toggleGridSnap: () => set((state) => ({ gridSnap: !state.gridSnap })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleTransparentWalls: () => set((state) => ({ transparentWalls: !state.transparentWalls })),
  setCatalogOpen: (isOpen) => set({ isCatalogOpen: isOpen }),
  setRoomModalOpen: (isOpen) => set({ isRoomModalOpen: isOpen }),
  setShortcutsOpen: (isOpen) => set({ isShortcutsOpen: isOpen }),
  setSaveModalOpen: (isOpen) => set({ isSaveModalOpen: isOpen }),
  setSavedListModalOpen: (isOpen) => set({ isSavedListModalOpen: isOpen }),
  setCurrentDesign: (id, name) => set({ currentDesignId: id, currentDesignName: name || 'Thiết kế phòng mới' }),

  // 2D editor actions
  setFloorPlan2DMode: (mode) => set({
    floorPlan2DMode: mode,
    // Hủy vẽ tường khi chuyển mode
    wallDrawingState: null,
  }),

  setWallDrawingState: (state) => set({ wallDrawingState: state }),

  updateFloorPlan2DViewport: (patch) =>
    set((state) => ({
      floorPlan2DViewport: { ...state.floorPlan2DViewport, ...patch },
    })),

  // Chế độ phong cách hiển thị đồ nội thất 2D: 'ortho' (Ảnh 3D thực tế) hoặc 'cad' (Bản vẽ CAD kỹ thuật)
  floorPlan2DRenderMode: 'ortho',
  setFloorPlan2DRenderMode: (mode) => set({ floorPlan2DRenderMode: mode }),

  resetFloorPlan2DViewport: () =>
    set({ floorPlan2DViewport: { zoom: 1.0, panX: 0, panZ: 0 } }),
}));

