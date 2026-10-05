/**
 * topViewRegistry.js — Quản lý bộ nhớ cache, kiểm tra thư mục /topviews/ và tự động lưu ảnh Top-View
 *
 * Tính năng:
 * - Khởi tạo danh sách file đã có sẵn trong public/topviews/ qua GET /api/check-topviews (1 request duy nhất)
 * - Cung cấp hook React `useTopViewImage(item, mode)` tự động tải hoặc sinh ảnh ngầm
 * - Tự động gửi POST /api/save-topview để lưu vĩnh viễn vào đĩa khi một ảnh mới được sinh ra
 * - Hỗ trợ cả 2 chế độ:
 *   + 'ortho': Ảnh chụp trực giao 3D thực tế từ file .glb
 *   + 'cad': Bản vẽ kỹ thuật 2D CAD có đổ bóng mềm
 */

import { useState, useEffect } from 'react';
import { renderOrthoSnapshot } from '../scene-3d/orthoSnapshotService';
import { generateCADTopViewDataUrl } from '../scene-3d/topViewSnapshotService';
import { FURNITURE_CATALOG } from './furnitureCatalog';

// Bộ nhớ cache URL trong RAM
const memoryCache = new Map(); // key -> url
// Tập hợp các file đã tồn tại trên đĩa trong public/topviews/
let knownServerFiles = null;
let initPromise = null;
// Bản đồ các tác vụ đang render dở (để tránh render trùng lặp khi nhiều item cùng catalogId)
const inFlightRenders = new Map();
// Danh sách người đăng ký lắng nghe cập nhật ảnh
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

/**
 * Khởi tạo kiểm tra danh sách file trong public/topviews/
 */
export async function initTopViewRegistry() {
  if (knownServerFiles) return knownServerFiles;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/api/check-topviews');
      if (res.ok) {
        const data = await res.json();
        knownServerFiles = new Set(data.files || []);
      } else {
        knownServerFiles = new Set();
      }
    } catch {
      knownServerFiles = new Set();
    }
    return knownServerFiles;
  })();

  return initPromise;
}

/**
 * Tạo tên file chuẩn cho món đồ theo mode
 */
export function getTopViewFilename(item, mode = 'ortho') {
  const baseId = item.catalogId || item.modelType || 'item';
  return mode === 'ortho' ? `${baseId}.png` : `${baseId}_cad.png`;
}

/**
 * Gửi ảnh DataURL lên Vite Dev Server để lưu vào thư mục public/topviews/
 */
async function saveTopViewToServer(filename, dataUrl) {
  try {
    const res = await fetch('/api/save-topview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, dataUrl }),
    });
    if (res.ok) {
      if (knownServerFiles) {
        knownServerFiles.add(filename);
      }
    }
  } catch (err) {
    console.warn('[topViewRegistry] Không thể gửi ảnh lên server:', err);
  }
}

/**
 * Tải hoặc kích hoạt sinh ảnh cho một món đồ
 */
export async function requestTopViewImage(item, mode = 'ortho') {
  const filename = getTopViewFilename(item, mode);
  const cacheKey = mode === 'ortho' ? filename : `${filename}_${item.color || 'default'}`;

  // 1. Kiểm tra RAM cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // 2. Đảm bảo đã check server files
  await initTopViewRegistry();

  // 3. Nếu file đã tồn tại trên server public/topviews/
  if (knownServerFiles && knownServerFiles.has(filename)) {
    const url = `/topviews/${filename}`;
    memoryCache.set(cacheKey, url);
    return url;
  }

  // 4. Nếu đang có tác vụ render dở cho file này
  if (inFlightRenders.has(cacheKey)) {
    return inFlightRenders.get(cacheKey);
  }

  // 5. Kích hoạt sinh ảnh mới
  const renderPromise = (async () => {
    let dataUrl = null;

    if (mode === 'ortho' && item.modelPath) {
      // Ưu tiên chụp trực giao 3D từ file .glb
      dataUrl = await renderOrthoSnapshot(item);
    }

    // Nếu mode là 'cad' hoặc chụp 3D không thành công (ví dụ đồ procedural không có .glb)
    if (!dataUrl) {
      dataUrl = generateCADTopViewDataUrl(item);
    }

    if (dataUrl) {
      memoryCache.set(cacheKey, dataUrl);
      // Gửi ngầm lên server để lưu vào đĩa
      saveTopViewToServer(filename, dataUrl);
      notifyListeners();
    }

    inFlightRenders.delete(cacheKey);
    return dataUrl;
  })();

  inFlightRenders.set(cacheKey, renderPromise);
  return renderPromise;
}

/**
 * Hook React tiện lợi lấy ảnh Top-View và tự động cập nhật khi render xong
 */
export function useTopViewImage(item, mode = 'ortho') {
  const filename = getTopViewFilename(item, mode);
  const cacheKey = mode === 'ortho' ? filename : `${filename}_${item.color || 'default'}`;

  // Lấy giá trị tức thì nếu có sẵn
  const [imageUrl, setImageUrl] = useState(() => memoryCache.get(cacheKey) || null);

  useEffect(() => {
    let isMounted = true;

    // Đăng ký listener nhận thông báo khi có ảnh mới
    const updateHandler = () => {
      if (!isMounted) return;
      const cached = memoryCache.get(cacheKey);
      if (cached) setImageUrl(cached);
    };
    listeners.add(updateHandler);

    // Kích hoạt nạp/sinh ảnh
    requestTopViewImage(item, mode).then((url) => {
      if (isMounted && url) {
        setImageUrl(url);
      }
    });

    return () => {
      isMounted = false;
      listeners.delete(updateHandler);
    };
  }, [cacheKey, item, mode]);

  return imageUrl;
}

/**
 * Sinh trước và lưu toàn bộ ảnh Top-View của danh mục vào public/topviews/
 */
export async function pregenerateAllCatalogTopViews(onProgress) {
  await initTopViewRegistry();
  const total = FURNITURE_CATALOG.length;
  let done = 0;

  for (const catItem of FURNITURE_CATALOG) {
    const item = {
      catalogId: catItem.id,
      modelType: catItem.modelType,
      modelPath: catItem.modelPath,
      dimensions: catItem.dimensions,
      color: catItem.defaultColor,
    };

    // Sinh cả 2 chế độ: ortho (3D) và cad (kỹ thuật)
    await requestTopViewImage(item, 'ortho');
    await requestTopViewImage(item, 'cad');
    done++;
    if (onProgress) {
      onProgress(done, total);
    }
  }
}
