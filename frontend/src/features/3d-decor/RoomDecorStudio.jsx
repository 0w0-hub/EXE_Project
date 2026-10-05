import React, { useEffect } from 'react';
import App from './App';
import { useSceneStore } from './stores/useSceneStore';
import { useEditorStore } from './stores/useEditorStore';
import './index.css';

/**
 * Component đóng gói Studio hoàn chỉnh, sẵn sàng nhúng vào bất kỳ Page nào của EXE-master
 * 
 * @param {Object} props
 * @param {Object} props.initialRoom - Thông số phòng (width, length, height, wallColor, floorColor)
 * @param {Array} props.initialFurniture - Danh sách đồ nội thất ban đầu
 * @param {Function} props.onSave - Callback khi người dùng lưu thiết kế (nhận sceneData: { room, items })
 * @param {string} props.className - Class CSS bổ sung
 */
export default function RoomDecorStudio({
  initialRoom,
  initialFurniture,
  userRole,
  onSaveSuccess,
  onLoadDesign,
  className = '',
}) {
  const loadScene = useSceneStore((state) => state.loadScene);
  const setUserRole = useEditorStore((state) => state.setUserRole);

  useEffect(() => {
    if (userRole) {
      setUserRole(userRole);
    }
  }, [userRole, setUserRole]);

  useEffect(() => {
    if (initialRoom || initialFurniture) {
      loadScene({
        room: initialRoom,
        items: initialFurniture,
      });
    }
  }, [initialRoom, initialFurniture, loadScene]);

  return (
    <div className={`decor-studio-root w-full h-full relative overflow-hidden ${className}`}>
      <App onSaveSuccess={onSaveSuccess} onLoadDesign={onLoadDesign} />
    </div>
  );
}

export { RoomDecorStudio };
