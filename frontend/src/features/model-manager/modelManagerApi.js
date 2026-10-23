/**
 * API Client kết nối Backend Spring Boot cho Quản Lý Mô Hình 3D
 * Hỗ trợ fallback an toàn khi backend offline hoặc đang dev độc lập
 */

const API_BASE = '/api/v1';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('homely_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCollections() {
  try {
    const res = await fetch(`${API_BASE}/models/collections`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (err) {
    console.warn('[ModelApi] Backend offline, sử dụng default collections:', err);
  }
  return [
    { id: 'col-stylized-kenney', code: 'stylized-kenney', name: 'Bộ Hoạt Họa Kenney Low-Poly', style: 'STYLIZED', defaultTier: 'FREE' },
    { id: 'col-modern-realistic', code: 'modern-realistic', name: 'Bộ Chân Thực Hiện Đại PBR', style: 'REALISTIC', defaultTier: 'PREMIUM' },
  ];
}

export async function fetchAdminModels(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.style && params.style !== 'all') query.append('style', params.style);
    if (params.tier && params.tier !== 'all') query.append('tier', params.tier);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.collectionId && params.collectionId !== 'all') query.append('collectionId', params.collectionId);
    if (params.q) query.append('q', params.q);

    const res = await fetch(`${API_BASE}/admin/models?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (err) {
    console.warn('[ModelApi] Không thể kết nối Backend, trả về mảng rỗng:', err);
  }
  return [];
}

export async function uploadModelFile(file, subDir = 'custom') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subDir', subDir);

  const token = typeof window !== 'undefined' ? localStorage.getItem('homely_token') : null;
  const res = await fetch(`${API_BASE}/admin/models/upload-file`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload thất bại (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.data; // { path, fileName }
}

export async function saveBatchImport(collectionId, items) {
  const payload = {
    collectionId,
    items: items.map((item) => ({
      code: item.code,
      name: item.name,
      category: item.category,
      modelType: item.modelType,
      mountType: item.mountType || 'floor',
      style: item.style || 'stylized',
      tier: item.tier || 'free',
      requiredPlan: item.requiredPlan || 'FREE',
      price: item.price || 0,
      modelPath: item.modelPath,
      thumbnailPath: item.thumbnailPath || item.thumbnailDataUrl,
      dimensionX: item.dimensionX ?? (item.dimensions?.width || 1),
      dimensionY: item.dimensionY ?? (item.dimensions?.height || 1),
      dimensionZ: item.dimensionZ ?? (item.dimensions?.depth || 1),
      isSurfaceHost: !!item.isSurfaceHost,
      canPlaceOnSurface: !!item.canPlaceOnSurface,
      fileSizeBytes: item.fileSizeBytes || null,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
      metadata: item.metadata || null,
    })),
  };

  const res = await fetch(`${API_BASE}/admin/models/batch-import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || `Lưu batch import thất bại (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

export async function updateModel(id, updateData) {
  const res = await fetch(`${API_BASE}/admin/models/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });

  if (!res.ok) {
    throw new Error(`Cập nhật thất bại (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteModel(id) {
  const res = await fetch(`${API_BASE}/admin/models/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Xóa thất bại (HTTP ${res.status})`);
  }
  return true;
}
