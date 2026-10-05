import { create } from 'zustand';
import { DEFAULT_ROOM } from '../constants/roomDefaults';
import {
  resolveCollisionsBox3,
  layoutErgonomics,
  layoutDistribute,
  findCollisionsFor,
  findSupportingSurface,
  isItemPlaceableOnSurface,
  snapWallItemTransform,
  getRoomWallSurfaces,
  syncWallItemsWithGraph,
  cascadeItemTransform,
} from '../features/collision/collisionResolver';
import {
  buildDefaultWallGraph,
  addVertex as wgAddVertex,
  moveVertex as wgMoveVertex,
  addSegment as wgAddSegment,
  removeSegment as wgRemoveSegment,
  removeVertex as wgRemoveVertex,
  addOpening as wgAddOpening,
  removeOpening as wgRemoveOpening,
  updateOpening as wgUpdateOpening,
  splitSegmentAtPoint,
  dissolveVertex,
  clampOpeningU,
} from '../features/room/wallGraphUtils';

const MAX_HISTORY = 25;

function computeRoomDimensionsFromGraph(wallGraph, currentRoom) {
  const verts = Object.values(wallGraph.vertices || {});
  if (verts.length === 0) return currentRoom;
  const xs = verts.map((v) => v.x);
  const zs = verts.map((v) => v.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const width = Number(Math.max(1, maxX - minX).toFixed(2));
  const length = Number(Math.max(1, maxZ - minZ).toFixed(2));
  return { ...currentRoom, width, length };
}

export const useSceneStore = create((set, get) => ({
  // Cấu hình phòng (chiều rộng, dài, cao, màu sắc)
  room: { ...DEFAULT_ROOM },

  // Đồ thị tường tùy ý (Graph-based wall model)
  // Layer 1: Nguồn sự thật — vertices (đỉnh) + segments (đoạn tường) + openings (cửa/cửa sổ)
  // Layer 2 (mesh, SVG paths) và Layer 3 (collision OBBs) được derive trong useMemo tại component
  wallGraph: buildDefaultWallGraph(DEFAULT_ROOM),

  // ID vertex / segment / opening đang được chọn trong 2D editor
  selectedVertexId: null,
  selectedSegmentId: null,
  selectedOpeningId: null,

  // Danh sách các vật thể đang có trong phòng (nạp model .glb thực tế)
  items: [
    {
      instanceId: 'initial-sofa',
      catalogId: 'sofa-classic',
      name: 'Sofa Văng Dài 3 Chỗ',
      modelPath: '/furniture/seating.glb',
      modelType: 'seating',
      dimensions: { width: 2.1, height: 0.85, depth: 0.9 },
      position: [0, 0, 1.2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#3b82f6',
    },
    {
      instanceId: 'initial-table',
      catalogId: 'coffee-table-wood',
      name: 'Bàn Trà Gỗ Chữ Nhật',
      modelPath: '/furniture/table.glb',
      modelType: 'table',
      dimensions: { width: 1.2, height: 0.45, depth: 0.6 },
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#78350f',
    },
    {
      instanceId: 'initial-tv',
      catalogId: 'tv-console-modern',
      name: 'Kệ Tivi Hiện Đại',
      modelPath: '/furniture/storage-3.glb',
      modelType: 'storage',
      dimensions: { width: 1.8, height: 0.5, depth: 0.42 },
      position: [0, 0, -2.1],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#1e293b',
    },
    {
      instanceId: 'initial-plant',
      catalogId: 'plant-monstera',
      name: 'Chậu Cây Trầu Bà Chậu Sứ',
      modelPath: '/furniture/decor-plant.glb',
      modelType: 'plant',
      dimensions: { width: 0.6, height: 1.1, depth: 0.6 },
      position: [-2.1, 0, -1.9],
      rotation: [0, 0.4, 0],
      scale: [1, 1, 1],
      color: '#16a34a',
    },
    {
      instanceId: 'initial-lamp',
      catalogId: 'floor-lamp-nordic',
      name: 'Đèn Cây Đứng Đèn Vàng',
      modelPath: '/furniture/lighting.glb',
      modelType: 'lamp',
      dimensions: { width: 0.45, height: 1.6, depth: 0.45 },
      position: [1.8, 0, 1.4],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#eab308',
      isLightOn: true,
    },
    {
      instanceId: 'initial-laptop',
      catalogId: 'laptop-work',
      name: 'Laptop Mỏng Nhẹ',
      modelPath: '/furniture/decor-laptop.glb',
      modelType: 'decor',
      dimensions: { width: 0.35, height: 0.22, depth: 0.25 },
      position: [0, 0.45, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#64748b',
      attachedTo: 'initial-table',
    },
    {
      instanceId: 'initial-tv-screen',
      catalogId: 'tv-screen-flat',
      name: 'Tivi Màn Hình Phẳng 65 inch',
      modelPath: '/furniture/decor-tv.glb',
      modelType: 'decor',
      dimensions: { width: 1.45, height: 0.85, depth: 0.15 },
      position: [0, 0.5, -2.1],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#0f172a',
      attachedTo: 'initial-tv',
    },
    // {
    //   instanceId: 'initial-proc-chair',
    //   catalogId: 'proc-chair',
    //   name: 'Ghế Tựa (Mô Hình Code - Đổi Màu)',
    //   modelPath: null, // Đồ tạo từ code thủ công (Procedural)
    //   modelType: 'armchair',
    //   dimensions: { width: 0.85, height: 0.85, depth: 0.8 },
    //   position: [-1.4, 0, 0.2],
    //   rotation: [0, 1.2, 0],
    //   scale: [1, 1, 1],
    //   color: '#ef4444', // Màu đỏ nổi bật để dễ quan sát và test đổi màu
    // },
  ],

  // ID vật thể đang được chọn
  selectedItemId: null,

  // Ngăn xếp lưu lịch sử Undo / Redo
  history: [],
  redoStack: [],

  // Đẩy snapshot vào history
  pushHistorySnapshot: () => {
    const { items, room, wallGraph } = get();
    set((state) => ({
      history: [
        ...state.history.slice(-(MAX_HISTORY - 1)),
        {
          items: JSON.parse(JSON.stringify(items)),
          room: { ...room },
          wallGraph: JSON.parse(JSON.stringify(wallGraph)),
        },
      ],
      redoStack: [],
    }));
  },

  // Hoàn tác (Undo)
  undo: () => {
    const { history, items, room, wallGraph, redoStack } = get();
    if (history.length === 0) return;

    const previousSnapshot = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    set({
      redoStack: [
        ...redoStack,
        {
          items: JSON.parse(JSON.stringify(items)),
          room: { ...room },
          wallGraph: JSON.parse(JSON.stringify(wallGraph)),
        },
      ],
      history: newHistory,
      items: previousSnapshot.items,
      room: previousSnapshot.room,
      wallGraph: previousSnapshot.wallGraph ?? wallGraph,
      selectedItemId: null,
      selectedVertexId: null,
      selectedSegmentId: null,
      selectedOpeningId: null,
    });
  },

  // Làm lại (Redo)
  redo: () => {
    const { redoStack, items, room, wallGraph, history } = get();
    if (redoStack.length === 0) return;

    const nextSnapshot = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    set({
      history: [
        ...history,
        {
          items: JSON.parse(JSON.stringify(items)),
          room: { ...room },
          wallGraph: JSON.parse(JSON.stringify(wallGraph)),
        },
      ],
      redoStack: newRedoStack,
      items: nextSnapshot.items,
      room: nextSnapshot.room,
      wallGraph: nextSnapshot.wallGraph ?? wallGraph,
      selectedItemId: null,
      selectedVertexId: null,
      selectedSegmentId: null,
      selectedOpeningId: null,
    });
  },

  // Chọn hoặc bỏ chọn vật thể
  selectItem: (instanceId) => {
    set({ selectedItemId: instanceId });
  },

  // Thêm một vật thể mới từ catalog vào giữa phòng hoặc gắn lên tường
  addItem: (catalogItem) => {
    get().pushHistorySnapshot();

    const instanceId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const tempDims = { ...catalogItem.dimensions };

    let initialPos = [0, 0, 0];
    let initialRot = [0, 0, 0];
    let attachedTo = null;
    let wallInfo = null;

    if (catalogItem.mountType === 'wall') {
      const room = get().room;
      const wallGraph = get().wallGraph;
      const elev =
        catalogItem.defaultElevation !== undefined ? catalogItem.defaultElevation : 1.4;
      wallInfo = snapWallItemTransform(
        [0, 0, -room.length / 2],
        tempDims,
        room,
        elev,
        null,
        wallGraph
      );
      initialPos = wallInfo.position;
      initialRot = wallInfo.rotation;
    } else if (isItemPlaceableOnSurface(catalogItem)) {
      // Kiểm tra xem vị trí tâm phòng (0, 0, 0) có trùng với bề mặt đỡ nào không
      const surface = findSupportingSurface([0, 0, 0], tempDims, get().items);
      if (surface) {
        initialPos = [0, surface.surfaceY, 0];
        attachedTo = surface.hostItem.instanceId;
      }
    }

    const newItem = {
      instanceId,
      catalogId: catalogItem.id,
      name: catalogItem.name,
      modelPath: catalogItem.modelPath || null,
      modelType: catalogItem.modelType,
      mountType: catalogItem.mountType || 'floor',
      defaultElevation: catalogItem.defaultElevation ?? 0,
      wallId: wallInfo?.wallId || null,
      wallName: wallInfo?.wallName || null,
      wallU: wallInfo?.wallU || null,
      wallT: wallInfo?.wallT || null,
      wallLength: wallInfo?.wallLength || null,
      dimensions: tempDims,
      position: initialPos,
      rotation: initialRot,
      scale: [1, 1, 1],
      color: catalogItem.defaultColor || '#3b82f6',
      isLightOn: catalogItem.modelType === 'lamp' ? true : undefined,
      attachedTo,
    };

    set((state) => ({
      items: [...state.items, newItem],
      selectedItemId: instanceId,
    }));

    return instanceId;
  },

  // Cập nhật vị trí, góc xoay hoặc tỉ lệ (tự động đồng bộ các vật thể con gắn bên trên)
  updateItemTransform: (instanceId, transform) => {
    set((state) => ({
      items: cascadeItemTransform(state.items, instanceId, transform),
    }));
  },

  // Gỡ liên kết cha - con và hạ vật thể xuống mặt sàn Y = 0
  detachItemFromHost: (instanceId) => {
    get().pushHistorySnapshot();
    set((state) => ({
      items: state.items.map((item) => {
        if (item.instanceId === instanceId) {
          return {
            ...item,
            attachedTo: null,
            position: [item.position[0], 0, item.position[2]],
          };
        }
        return item;
      }),
    }));
  },

  // Ghi nhận sau khi kéo thả xong (để lưu vào history)
  commitTransform: () => {
    get().pushHistorySnapshot();
  },

  // Bật/tắt công tắc đèn
  toggleLamp: (instanceId) => {
    get().pushHistorySnapshot();
    set((state) => ({
      items: state.items.map((item) =>
        item.instanceId === instanceId
          ? { ...item, isLightOn: item.isLightOn !== undefined ? !item.isLightOn : false }
          : item
      ),
    }));
  },

  // Cập nhật màu sắc của vật thể
  updateItemColor: (instanceId, color) => {
    get().pushHistorySnapshot();
    set((state) => ({
      items: state.items.map((item) =>
        item.instanceId === instanceId ? { ...item, color } : item
      ),
    }));
  },

  // Xóa một vật thể khỏi phòng (nếu là vật đỡ, hạ các vật thể con xuống sàn Y=0 thay vì xóa mất)
  removeItem: (instanceId) => {
    get().pushHistorySnapshot();
    set((state) => ({
      items: state.items
        .filter((item) => item.instanceId !== instanceId)
        .map((item) => {
          if (item.attachedTo === instanceId) {
            return {
              ...item,
              attachedTo: null,
              position: [item.position[0], 0, item.position[2]],
            };
          }
          return item;
        }),
      selectedItemId: state.selectedItemId === instanceId ? null : state.selectedItemId,
    }));
  },

  // Chuyển đồ gắn tường sang bức tường khác
  moveWallItemToWall: (instanceId, targetWallId) => {
    const { items, room, wallGraph } = get();
    const item = items.find((i) => i.instanceId === instanceId);
    if (!item || item.mountType !== 'wall') return;

    get().pushHistorySnapshot();
    const walls = getRoomWallSurfaces(room, wallGraph);
    const targetWall = walls.find((w) => w.id === targetWallId);
    if (!targetWall) return;

    // Chiếu tâm của bức tường mới
    const midX = (targetWall.start.x + targetWall.end.x) / 2;
    const midZ = (targetWall.start.z + targetWall.end.z) / 2;
    const currentElevation = item.position ? item.position[1] : 1.4;

    const snap = snapWallItemTransform(
      [midX, currentElevation, midZ],
      item.dimensions,
      room,
      currentElevation,
      targetWallId,
      wallGraph
    );

    set((state) => ({
      items: cascadeItemTransform(state.items, instanceId, {
        position: snap.position,
        rotation: snap.rotation,
        wallId: snap.wallId,
        wallName: snap.wallName,
        wallU: snap.wallU,
        wallT: snap.wallT,
        wallLength: snap.wallLength,
        elevation: snap.elevation,
      }),
    }));
  },

  // Điều chỉnh độ cao gắn tường (Elevation Y)
  setWallItemElevation: (instanceId, elevation) => {
    const { items, room, wallGraph } = get();
    const item = items.find((i) => i.instanceId === instanceId);
    if (!item || item.mountType !== 'wall') return;

    const snap = snapWallItemTransform(
      item.position,
      item.dimensions,
      room,
      elevation,
      item.wallId,
      wallGraph
    );

    set((state) => ({
      items: cascadeItemTransform(state.items, instanceId, {
        position: snap.position,
        rotation: snap.rotation,
        wallId: snap.wallId,
        wallName: snap.wallName,
        wallU: snap.wallU,
        wallT: snap.wallT,
        wallLength: snap.wallLength,
        elevation: snap.elevation,
      }),
    }));
  },

  // Điều chỉnh vị trí trượt ngang dọc theo tường (u: 0 -> L)
  setWallItemPositionU: (instanceId, targetU) => {
    const { items, room, wallGraph } = get();
    const item = items.find((i) => i.instanceId === instanceId);
    if (!item || item.mountType !== 'wall') return;

    const walls = getRoomWallSurfaces(room, wallGraph);
    const wall = walls.find((w) => w.id === item.wallId) || walls[0];
    const wallThick = wall.thickness || room?.wallThickness || 0.15;
    const halfW = (item.dimensions?.width || 1) / 2;
    const cornerMargin = wallThick / 2 + halfW;
    const minU = Math.min(wall.length / 2, cornerMargin);
    const maxU = Math.max(minU, wall.length - cornerMargin);
    const clampedU = Math.max(minU, Math.min(maxU, targetU));
    const t = clampedU / (wall.length || 1);

    const worldPointOnWall = [
      wall.start.x + t * (wall.end.x - wall.start.x),
      item.position[1],
      wall.start.z + t * (wall.end.z - wall.start.z),
    ];

    const snap = snapWallItemTransform(
      worldPointOnWall,
      item.dimensions,
      room,
      item.position[1],
      wall.id,
      wallGraph
    );

    set((state) => ({
      items: cascadeItemTransform(state.items, instanceId, {
        position: snap.position,
        rotation: snap.rotation,
        wallId: snap.wallId,
        wallName: snap.wallName,
        wallU: snap.wallU,
        wallT: snap.wallT,
        wallLength: snap.wallLength,
        elevation: snap.elevation,
      }),
    }));
  },

  // Nhân bản một vật thể đang có
  duplicateItem: (instanceId) => {
    const state = get();
    const itemToDup = state.items.find((i) => i.instanceId === instanceId);
    if (!itemToDup) return;

    state.pushHistorySnapshot();
    const newInstanceId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let newPos = [
      itemToDup.position[0] + 0.2,
      itemToDup.position[1],
      itemToDup.position[2] + 0.2,
    ];
    let newRot = itemToDup.rotation ? [...itemToDup.rotation] : [0, 0, 0];
    let newWallId = itemToDup.wallId || null;
    let newWallName = itemToDup.wallName || null;
    let newWallU = itemToDup.wallU || null;
    let newWallT = itemToDup.wallT || null;
    let newWallLength = itemToDup.wallLength || null;

    if (itemToDup.mountType === 'wall') {
      const snap = snapWallItemTransform(
        [itemToDup.position[0] + 0.3, itemToDup.position[1], itemToDup.position[2] + 0.3],
        itemToDup.dimensions,
        state.room,
        itemToDup.position[1],
        itemToDup.wallId,
        state.wallGraph
      );
      newPos = snap.position;
      newRot = snap.rotation;
      newWallId = snap.wallId;
      newWallName = snap.wallName;
      newWallU = snap.wallU;
      newWallT = snap.wallT;
      newWallLength = snap.wallLength;
    }

    const duplicated = {
      ...itemToDup,
      instanceId: newInstanceId,
      position: newPos,
      rotation: newRot,
      wallId: newWallId,
      wallName: newWallName,
      wallU: newWallU,
      wallT: newWallT,
      wallLength: newWallLength,
      attachedTo: itemToDup.attachedTo || null,
    };

    set({
      items: [...state.items, duplicated],
      selectedItemId: newInstanceId,
    });
  },

  // Thuật toán giãn cách & Bố trí không gian linh hoạt
  // mode: 'ergonomic' (Bố trí công thái học) | 'push' (Tách va chạm an toàn) | 'distribute' (Dàn đều lưới)
  autoArrangeScene: (mode = 'ergonomic') => {
    const { items, room } = get();
    get().pushHistorySnapshot();

    let arranged;
    if (mode === 'push') {
      arranged = resolveCollisionsBox3(items, room, 0.2);
    } else if (mode === 'distribute') {
      arranged = layoutDistribute(items, room);
    } else {
      arranged = layoutErgonomics(items, room);
    }

    set({ items: arranged });
  },

  // Lấy danh sách các vật thể đang va chạm với vật thể được chọn
  getCollidingItemsForSelected: () => {
    const { items, selectedItemId } = get();
    if (!selectedItemId) return [];
    const selected = items.find((i) => i.instanceId === selectedItemId);
    if (!selected) return [];
    return findCollisionsFor(selected, items);
  },

  // Cập nhật thông số phòng (kích thước, màu sắc) và tự động đồng bộ đồ gắn tường
  updateRoom: (partialRoom) => {
    get().pushHistorySnapshot();
    const state = get();
    const newRoom = { ...state.room, ...partialRoom };
    let nextGraph = { ...state.wallGraph };

    const widthChanged = partialRoom.width !== undefined && partialRoom.width !== state.room.width;
    const lengthChanged = partialRoom.length !== undefined && partialRoom.length !== state.room.length;
    const heightChanged = partialRoom.height !== undefined && partialRoom.height !== state.room.height;

    if (widthChanged || lengthChanged || heightChanged) {
      const verts = Object.values(nextGraph.vertices || {});
      if (verts.length > 0) {
        const xs = verts.map((v) => v.x);
        const zs = verts.map((v) => v.z);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minZ = Math.min(...zs);
        const maxZ = Math.max(...zs);

        const curW = Math.max(0.01, maxX - minX);
        const curL = Math.max(0.01, maxZ - minZ);
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;

        const targetW = partialRoom.width ?? curW;
        const targetL = partialRoom.length ?? curL;
        const scaleX = widthChanged ? targetW / curW : 1;
        const scaleZ = lengthChanged ? targetL / curL : 1;

        // Cập nhật tọa độ đỉnh theo tỷ lệ co giãn Bounding Box
        const newVertices = {};
        for (const [id, v] of Object.entries(nextGraph.vertices)) {
          newVertices[id] = {
            ...v,
            x: Number((centerX + (v.x - centerX) * scaleX).toFixed(3)),
            z: Number((centerZ + (v.z - centerZ) * scaleZ).toFixed(3)),
          };
        }

        // Cập nhật chiều cao tường nếu height thay đổi
        const newSegments = {};
        for (const [id, seg] of Object.entries(nextGraph.segments)) {
          newSegments[id] = {
            ...seg,
            height: partialRoom.height ?? (seg.height || 2.8),
          };
        }

        nextGraph = {
          ...nextGraph,
          vertices: newVertices,
          segments: newSegments,
        };
      }
    }

    const syncedItems = syncWallItemsWithGraph(state.items, nextGraph, newRoom);
    set({
      room: newRoom,
      wallGraph: nextGraph,
      items: syncedItems,
    });
  },

  // Xóa toàn bộ đồ đạc trong phòng
  resetScene: () => {
    get().pushHistorySnapshot();
    set({
      items: [],
      selectedItemId: null,
    });
  },

  // Nạp lại toàn bộ thiết kế từ dữ liệu JSON
  loadScene: (sceneData) => {
    if (!sceneData) return;
    get().pushHistorySnapshot();
    const newRoom = { ...DEFAULT_ROOM, ...(sceneData.room || {}) };
    const newGraph = sceneData.wallGraph || buildDefaultWallGraph(newRoom);
    const rawItems = sceneData.items || [];
    const syncedItems = syncWallItemsWithGraph(rawItems, newGraph, newRoom);
    set({
      room: newRoom,
      wallGraph: newGraph,
      items: syncedItems,
      selectedItemId: null,
    });
  },

  // Lấy dữ liệu toàn cảnh dạng Object để lưu vào Database
  getSceneData: () => {
    const state = get();
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      room: state.room,
      wallGraph: state.wallGraph,
      items: state.items,
    };
  },

  // Xuất file JSON thiết kế phòng
  exportSceneJson: () => {
    const state = get();
    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      room: state.room,
      wallGraph: state.wallGraph,
      items: state.items,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `homely-decor-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WALL GRAPH ACTIONS
  // Mọi thay đổi wallGraph đều push history snapshot trước và đồng bộ đồ gắn tường
  // ─────────────────────────────────────────────────────────────────────────

  // Thêm đỉnh tường mới
  wgAddVertex: (x, z) => {
    get().pushHistorySnapshot();
    set((state) => {
      const nextGraph = wgAddVertex(state.wallGraph, x, z);
      const nextRoom = computeRoomDimensionsFromGraph(nextGraph, state.room);
      return {
        wallGraph: nextGraph,
        room: nextRoom,
      };
    });
  },

  // Di chuyển đỉnh tường (kéo trong 2D editor) - Tự động bám sát và xoay đồ gắn tường trong thời gian thực
  wgMoveVertex: (vertexId, x, z) => {
    set((state) => {
      const nextGraph = wgMoveVertex(state.wallGraph, vertexId, x, z);
      const nextItems = syncWallItemsWithGraph(state.items, nextGraph, state.room);
      return {
        wallGraph: nextGraph,
        items: nextItems,
      };
    });
  },

  // Ghi nhận sau khi kéo vertex xong (lưu vào history và đồng bộ kích thước phòng)
  wgCommitVertex: () => {
    get().pushHistorySnapshot();
    const { items, wallGraph, room } = get();
    const nextRoom = computeRoomDimensionsFromGraph(wallGraph, room);
    set({
      room: nextRoom,
      items: syncWallItemsWithGraph(items, wallGraph, nextRoom),
    });
  },

  // Thêm đoạn tường mới giữa 2 đỉnh
  wgAddSegment: (v1Id, v2Id, options) => {
    get().pushHistorySnapshot();
    set((state) => {
      const nextGraph = wgAddSegment(state.wallGraph, v1Id, v2Id, options);
      return {
        wallGraph: nextGraph,
        items: syncWallItemsWithGraph(state.items, nextGraph, state.room),
      };
    });
  },

  // Xóa đoạn tường (và các cửa/cửa sổ của nó) - re-anchor đồ gắn tường sang đoạn tường gần nhất
  wgRemoveSegment: (segId) => {
    get().pushHistorySnapshot();
    set((state) => {
      const nextGraph = wgRemoveSegment(state.wallGraph, segId);
      return {
        wallGraph: nextGraph,
        selectedSegmentId: state.selectedSegmentId === segId ? null : state.selectedSegmentId,
        items: syncWallItemsWithGraph(state.items, nextGraph, state.room),
      };
    });
  },

  // Thêm một nút mới trên một đoạn tường (chia cạnh thành 2 cạnh mới)
  wgSplitSegment: (segId, clickX, clickZ) => {
    get().pushHistorySnapshot();
    const result = splitSegmentAtPoint(get().wallGraph, segId, clickX, clickZ);
    const nextRoom = computeRoomDimensionsFromGraph(result.wallGraph, get().room);
    const nextItems = syncWallItemsWithGraph(get().items, result.wallGraph, nextRoom);
    set({
      wallGraph: result.wallGraph,
      room: nextRoom,
      selectedVertexId: result.newVertexId,
      selectedSegmentId: null,
      items: nextItems,
    });
    return result.newVertexId;
  },

  // Xóa nút và tự động nối 2 cạnh kề lại với nhau (giữ phòng luôn khép kín)
  wgDissolveVertex: (vertexId) => {
    get().pushHistorySnapshot();
    set((state) => {
      const nextGraph = dissolveVertex(state.wallGraph, vertexId);
      const nextRoom = computeRoomDimensionsFromGraph(nextGraph, state.room);
      return {
        wallGraph: nextGraph,
        room: nextRoom,
        selectedVertexId: state.selectedVertexId === vertexId ? null : state.selectedVertexId,
        items: syncWallItemsWithGraph(state.items, nextGraph, nextRoom),
      };
    });
  },

  // Xóa đỉnh (ưu tiên dissolve nếu phòng là đa giác khép kín)
  wgRemoveVertex: (vertexId) => {
    get().pushHistorySnapshot();
    set((state) => {
      const vCount = Object.keys(state.wallGraph.vertices).length;
      const nextGraph =
        vCount > 3
          ? dissolveVertex(state.wallGraph, vertexId)
          : wgRemoveVertex(state.wallGraph, vertexId);
      const nextRoom = computeRoomDimensionsFromGraph(nextGraph, state.room);
      return {
        wallGraph: nextGraph,
        room: nextRoom,
        selectedVertexId: null,
        items: syncWallItemsWithGraph(state.items, nextGraph, nextRoom),
      };
    });
  },

  // Thêm cửa hoặc cửa sổ vào một đoạn tường
  wgAddOpening: (opening) => {
    get().pushHistorySnapshot();
    const { wallGraph } = get();
    const seg = wallGraph.segments[opening.segmentId];
    if (!seg) return;
    // Clamp u sao cho opening không lọt ra ngoài mép tường
    const clampedOpening = {
      ...opening,
      u: clampOpeningU(opening, seg, wallGraph.vertices),
    };
    set((state) => ({
      wallGraph: wgAddOpening(state.wallGraph, clampedOpening),
    }));
  },

  // Xóa cửa / cửa sổ
  wgRemoveOpening: (openingId) => {
    get().pushHistorySnapshot();
    set((state) => ({
      wallGraph: wgRemoveOpening(state.wallGraph, openingId),
      selectedOpeningId: state.selectedOpeningId === openingId ? null : state.selectedOpeningId,
    }));
  },

  // Cập nhật thuộc tính cửa / cửa sổ (vị trí u, kích thước, ...)
  wgUpdateOpening: (openingId, patch) => {
    get().pushHistorySnapshot();
    set((state) => {
      const op = state.wallGraph.openings[openingId];
      if (!op) return {};
      const seg = state.wallGraph.segments[op.segmentId];
      const merged = { ...op, ...patch };
      if (seg) merged.u = clampOpeningU(merged, seg, state.wallGraph.vertices);
      return { wallGraph: wgUpdateOpening(state.wallGraph, openingId, merged) };
    });
  },

  // Cập nhật chất liệu / hoa văn riêng cho từng đoạn tường (Accent Wall)
  updateSegmentMaterial: (segId, patch) => {
    get().pushHistorySnapshot();
    set((state) => {
      const seg = state.wallGraph.segments[segId];
      if (!seg) return {};
      const updatedSeg = {
        ...seg,
        ...patch,
      };
      return {
        wallGraph: {
          ...state.wallGraph,
          segments: {
            ...state.wallGraph.segments,
            [segId]: updatedSeg,
          },
        },
      };
    });
  },

  // Chọn vertex / segment / opening trong 2D editor
  selectVertex: (id) => set({ selectedVertexId: id, selectedSegmentId: null, selectedOpeningId: null }),
  selectSegment: (id) => set({ selectedSegmentId: id, selectedVertexId: null, selectedOpeningId: null }),
  selectOpening: (id) => set({ selectedOpeningId: id, selectedVertexId: null, selectedSegmentId: null }),
  clearWallSelection: () => set({ selectedVertexId: null, selectedSegmentId: null, selectedOpeningId: null }),

  // Rebuild wallGraph từ room.width/length (gọi sau khi user thay đổi kích thước phòng qua modal)
  rebuildDefaultWallGraph: () => {
    const { room, wallGraph, items } = get();
    // Chỉ rebuild nếu wallGraph hiện tại là mặc định (4 segment, không có cửa)
    // Nếu user đã vẽ tường tùy ý → hỏi xác nhận trước (UI xử lý)
    const newGraph = { ...buildDefaultWallGraph(room), openings: wallGraph.openings };
    const nextItems = syncWallItemsWithGraph(items, newGraph, room);
    set({ wallGraph: newGraph, items: nextItems });
  },
}));

