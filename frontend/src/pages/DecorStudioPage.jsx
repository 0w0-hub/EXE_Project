import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studioDesignApi } from '../services/api';
const RoomDecorStudio = lazy(() => import('../features/3d-decor/RoomDecorStudio'));
import { useSceneStore } from '../features/3d-decor/stores/useSceneStore';
import { useEditorStore } from '../features/3d-decor/stores/useEditorStore';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function DecorStudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadScene = useSceneStore((state) => state.loadScene);
  const setCurrentDesign = useEditorStore((state) => state.setCurrentDesign);
  const currentDesignName = useEditorStore((state) => state.currentDesignName);

  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useDocumentTitle(
    currentDesignName ? `${currentDesignName} — 3D Decor Studio` : '3D Decor Studio — Homely'
  );

  // Khóa cuộn trang khi ở trang Studio để đạt trải nghiệm Full Screen tối đa
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Tải thiết kế từ database khi có ID trên URL
  useEffect(() => {
    if (!id) {
      setCurrentDesign(null, 'Thiết kế phòng mới');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchDesign = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await studioDesignApi.get(id);
        if (!isMounted) return;

        if (res && res.data) {
          const parsed = JSON.parse(res.data);
          loadScene(parsed);
          setCurrentDesign(res.id, res.name);
        }
      } catch (err) {
        console.error('Lỗi khi nạp thiết kế từ database:', err);
        if (isMounted) {
          setError(err?.message || 'Không tìm thấy hoặc không có quyền truy cập bản thiết kế này');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDesign();
    return () => {
      isMounted = false;
    };
  }, [id, loadScene, setCurrentDesign]);

  const handleSaveSuccess = (savedDesign) => {
    if (savedDesign?.id && savedDesign.id !== id) {
      navigate(`/designs/${savedDesign.id}`, { replace: true });
    }
  };

  const handleLoadDesign = (design) => {
    if (design?.id) {
      navigate(`/designs/${design.id}`);
    } else {
      navigate('/designs');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Đang tải bản thiết kế 3D...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto my-12 p-6 bg-slate-900 border border-rose-500/30 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl font-bold">
          !
        </div>
        <h2 className="text-base font-bold text-white">Không Thể Mở Bản Thiết Kế</h2>
        <p className="text-xs text-rose-300">{error}</p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/designs')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Tạo thiết kế mới
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
          >
            Quay lại dự án
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="decor-studio-page relative w-full h-full overflow-hidden bg-slate-950 flex flex-col">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center flex-1 w-full h-full gap-3 text-slate-400 bg-slate-950">
            <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs font-medium tracking-wide text-slate-300">Đang khởi tạo không gian 3D Decor Studio...</p>
          </div>
        }
      >
        <RoomDecorStudio
          key={id || 'new-design'}
          userRole={user?.role?.toLowerCase() || 'user'}
          onSaveSuccess={handleSaveSuccess}
          onLoadDesign={handleLoadDesign}
          className="w-full h-full flex-1"
        />
      </Suspense>
    </div>
  );
}
