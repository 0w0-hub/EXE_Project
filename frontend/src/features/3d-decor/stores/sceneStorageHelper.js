/**
 * Helper quản lý lưu trữ LocalStorage tự động và đồng bộ bản thiết kế phòng 3D
 */

const STORAGE_PREFIX = 'homely_decor_autosave_';
export const DEFAULT_DEBOUNCE_MS = 2500; // 2.5 giây sau khi ngừng thao tác mới ghi vào localStorage

/**
 * Tạo key lưu trữ cho từng người dùng
 * @param {string} userId 
 * @returns {string}
 */
export function getStorageKey(userId) {
  const safeId = userId || 'guest';
  return `${STORAGE_PREFIX}${safeId}`;
}

/**
 * Đọc bản lưu từ localStorage an toàn
 * @param {string} userId 
 * @returns {Object|null}
 */
export function readLocalStorageDraft(userId) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[AutoSave] Không thể đọc localStorage:', err);
    return null;
  }
}

/**
 * Ghi bản lưu vào localStorage an toàn
 * @param {string} userId 
 * @param {Object} data 
 * @returns {boolean}
 */
export function writeLocalStorageDraft(userId, data) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('[AutoSave] Lỗi ghi localStorage (có thể vượt quota):', err);
    return false;
  }
}

/**
 * Xóa bản lưu của người dùng trong localStorage
 * @param {string} userId 
 */
export function removeLocalStorageDraft(userId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getStorageKey(userId));
  } catch (err) {
    console.warn('[AutoSave] Lỗi xóa localStorage:', err);
  }
}

/**
 * Kiểm tra và đồng bộ giữa useSceneStore và LocalStorage dựa theo userId và updateDate.
 * 
 * Quy tắc cách ly dữ liệu:
 * 1. Khi chuyển tài khoản (storeState.userId !== effectiveUserId):
 *    - Tuyệt đối không so sánh mốc thời gian giữa 2 tài khoản khác nhau để tránh rò rỉ dữ liệu.
 *    - Nếu tài khoản mới đã có bản lưu trong LocalStorage -> Nạp bản lưu của tài khoản mới ('loaded_from_local').
 *    - Nếu tài khoản mới chưa có bản lưu -> Reset về mặc định ban đầu sạch sẽ cho tài khoản mới ('reset_to_default').
 * 
 * 2. Khi cùng một tài khoản (storeState.userId === effectiveUserId):
 *    - So sánh updateDate giữa useSceneStore và LocalStorage:
 *      + Nếu LocalStorage mới hơn (hoặc store chỉ là mặc định) -> Nạp từ LocalStorage ('loaded_from_local').
 *      + Nếu useSceneStore mới hơn -> Đẩy bản mới nhất vào LocalStorage ('saved_to_local').
 *      + Nếu bằng nhau -> 'synced'.
 *      + Nếu LocalStorage chưa có nhưng store đã thay đổi -> Lưu vào LocalStorage ('saved_to_local').
 * 
 * @param {Object} storeState - Trạng thái hiện tại từ useSceneStore ({ userId, updateDate, room, wallGraph, items, isInitialDefault })
 * @param {string} [targetUserId] - userId mong muốn đồng bộ (nếu có)
 * @returns {{ action: 'loaded_from_local' | 'saved_to_local' | 'reset_to_default' | 'synced' | 'no_action', payload: Object|null }}
 */
export function syncStoreAndLocalStorage(storeState, targetUserId) {
  const currentUserId = storeState.userId || 'guest';
  const effectiveUserId = targetUserId || currentUserId;
  const isUserSwitch = currentUserId !== effectiveUserId;

  const localDraft = readLocalStorageDraft(effectiveUserId);

  // 1. CHUYỂN ĐỔI TÀI KHOẢN (User A -> User B hoặc User -> Guest hoặc ngược lại)
  if (isUserSwitch) {
    if (localDraft && localDraft.updateDate) {
      return {
        action: 'loaded_from_local',
        payload: {
          ...localDraft,
          userId: effectiveUserId,
        },
      };
    } else {
      return {
        action: 'reset_to_default',
        payload: {
          userId: effectiveUserId,
        },
      };
    }
  }

  // 2. CÙNG MỘT TÀI KHOẢN (F5 tải lại trang, mở tab mới, v.v.)
  const storeTime = storeState.updateDate
    ? new Date(storeState.updateDate).getTime()
    : 0;

  if (localDraft && localDraft.updateDate) {
    const localTime = new Date(localDraft.updateDate).getTime();

    // Nếu bản lưu trong LocalStorage mới hơn bản trong useSceneStore (hoặc store chỉ là mặc định ban đầu)
    if (localTime > storeTime || storeState.isInitialDefault) {
      return {
        action: 'loaded_from_local',
        payload: {
          ...localDraft,
          userId: effectiveUserId,
        },
      };
    }

    // Nếu store mới hơn bản lưu trong LocalStorage
    if (storeTime > localTime && !storeState.isInitialDefault) {
      const latestDataToSave = {
        version: '2.0',
        userId: effectiveUserId,
        updateDate: storeState.updateDate || new Date().toISOString(),
        room: storeState.room,
        wallGraph: storeState.wallGraph,
        items: storeState.items,
      };
      writeLocalStorageDraft(effectiveUserId, latestDataToSave);
      return {
        action: 'saved_to_local',
        payload: latestDataToSave,
      };
    }

    return {
      action: 'synced',
      payload: localDraft,
    };
  }

  // Bản lưu chưa có trong LocalStorage nhưng Store đã có thao tác tùy biến
  if (!storeState.isInitialDefault && storeState.items && storeState.items.length > 0) {
    const latestDataToSave = {
      version: '2.0',
      userId: effectiveUserId,
      updateDate: storeState.updateDate || new Date().toISOString(),
      room: storeState.room,
      wallGraph: storeState.wallGraph,
      items: storeState.items,
    };
    writeLocalStorageDraft(effectiveUserId, latestDataToSave);
    return {
      action: 'saved_to_local',
      payload: latestDataToSave,
    };
  }

  return {
    action: 'no_action',
    payload: null,
  };
}

/**
 * Trình quản lý AutoSave Debounced giúp hạn chế việc ghi LocalStorage quá thường xuyên
 */
export class AutoSaveManager {
  constructor(debounceMs = DEFAULT_DEBOUNCE_MS) {
    this.debounceMs = debounceMs;
    this.timer = null;
    this.pendingData = null;
    this.pendingUserId = null;
  }

  /**
   * Lên lịch lưu sau khoảng thời gian debounce (chỉ ghi khi người dùng ngừng thao tác)
   */
  schedule(userId, data, onSaved) {
    this.pendingUserId = userId || 'guest';
    this.pendingData = data;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush(onSaved);
    }, this.debounceMs);
  }

  /**
   * Thực hiện ghi ngay lập tức dữ liệu đang chờ vào localStorage (dùng khi rời trang hoặc gọi thủ công)
   */
  flush(onSaved) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pendingData && this.pendingUserId) {
      writeLocalStorageDraft(this.pendingUserId, this.pendingData);
      if (typeof onSaved === 'function') {
        onSaved(this.pendingData);
      }
      this.pendingData = null;
      this.pendingUserId = null;
    }
  }

  /**
   * Hủy bỏ lịch lưu đang chờ
   */
  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingData = null;
    this.pendingUserId = null;
  }
}
