import React from 'react';
import { X, Crown, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';

export function PremiumModelModal() {
  const isPremiumModalOpen = useEditorStore((state) => state.isPremiumModalOpen);
  const pendingPremiumItem = useEditorStore((state) => state.pendingPremiumItem);
  const closePremiumModal = useEditorStore((state) => state.closePremiumModal);
  const userPlan = useEditorStore((state) => state.userPlan);

  if (!isPremiumModalOpen || !pendingPremiumItem) return null;

  const item = pendingPremiumItem;
  const formattedPrice = item.price ? new Intl.NumberFormat('vi-VN').format(item.price) + ' đ' : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Nút đóng */}
        <button
          onClick={closePremiumModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header với icon Crown */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO COLLECTION
              </span>
              <span className="text-xs text-slate-400">Gói {item.requiredPlan || 'PLUS'}+</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">{item.name}</h3>
          </div>
        </div>

        {/* Xem trước món đồ */}
        <div className="relative w-full h-36 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center overflow-hidden mb-4 group">
          {item.thumbnailPath ? (
            <img
              src={item.thumbnailPath}
              alt={item.name}
              className="max-h-28 max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Sparkles className="w-8 h-8 text-amber-400/80" />
              <span className="text-xs">Mô hình PBR Chân thực</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/90 rounded-md border border-slate-700 text-[10px] text-slate-300 font-mono">
            {item.dimensions?.width}m × {item.dimensions?.depth}m × {item.dimensions?.height}m
          </div>
        </div>

        {/* Mô tả tính năng */}
        <div className="space-y-2 mb-5 text-xs text-slate-300">
          <p className="text-slate-400 leading-relaxed">
            {item.description || 'Mô hình 3D thực tế với vân vật liệu chi tiết, đổ bóng PBR cao cấp giúp bản thiết kế của bạn trông chân thực như ảnh chụp.'}
          </p>

          <div className="pt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Độ sắc nét vật liệu 4K & ánh sáng PBR mềm mịn</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tỉ lệ công thái học và kiểm tra va chạm chuẩn xác</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Xuất render ảnh phối cảnh thực tế không giới hạn</span>
            </div>
          </div>
        </div>

        {/* Thông tin gói & CTA */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-amber-300 font-medium">Tài khoản hiện tại: {userPlan}</div>
            <div className="text-xs font-bold text-white">Nâng cấp để mở khóa toàn bộ kho Realistic</div>
          </div>
          {formattedPrice && (
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Mua lẻ</div>
              <div className="text-xs font-bold text-amber-300">{formattedPrice}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={closePremiumModal}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Để sau
          </button>
          <button
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <a
            href="/plans"
            target="_blank"
            rel="noreferrer"
            className=" text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className='text-white'>Nâng Cấp Gói PRO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          </button>
        </div>
      </div>
    </div>
  );
}
