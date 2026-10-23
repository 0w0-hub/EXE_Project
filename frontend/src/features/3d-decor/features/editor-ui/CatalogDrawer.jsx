import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  Crown,
  Lock,
  Armchair,
  Table,
  Tv,
  Bed,
  Box,
  Layers,
  Laptop,
  BookOpen,
  Sun,
  Trees,
  DoorOpen,
  Image,
  Clock,
  Square,
  Maximize2,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSceneStore } from '../../stores/useSceneStore';
import {
  FURNITURE_CATEGORIES,
  MODEL_STYLES,
  MODEL_TIERS,
  getFilteredCatalog,
  canUserAccessItem,
} from '../catalog/furnitureCatalog';

// Map icon name thành Lucide Component
const ICON_MAP = {
  Armchair,
  Table,
  Tv,
  Bed,
  Box,
  Layers,
  Laptop,
  BookOpen,
  Sun,
  Trees,
  DoorOpen,
  Image,
  Clock,
  Square,
  Maximize2,
};

export function CatalogDrawer() {
  const isCatalogOpen = useEditorStore((state) => state.isCatalogOpen);
  const setCatalogOpen = useEditorStore((state) => state.setCatalogOpen);
  const catalogStyleFilter = useEditorStore((state) => state.catalogStyleFilter);
  const setCatalogStyleFilter = useEditorStore((state) => state.setCatalogStyleFilter);
  const catalogTierFilter = useEditorStore((state) => state.catalogTierFilter);
  const setCatalogTierFilter = useEditorStore((state) => state.setCatalogTierFilter);
  const openPremiumModal = useEditorStore((state) => state.openPremiumModal);
  const userRole = useEditorStore((state) => state.userRole);
  const userPlan = useEditorStore((state) => state.userPlan);

  const addItem = useSceneStore((state) => state.addItem);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isCatalogOpen) return null;

  // Danh mục phòng hiển thị (loại bỏ các danh mục ẩn)
  const visibleCategories = FURNITURE_CATEGORIES.filter((cat) => !cat.hidden);

  // Lọc sản phẩm qua catalogRegistry tập trung
  const filteredItems = getFilteredCatalog({
    style: catalogStyleFilter,
    category: selectedCategory,
    tier: catalogTierFilter,
    searchQuery,
  });

  const handleItemClick = (item) => {
    const hasAccess = canUserAccessItem(item, userRole, userPlan);
    if (!hasAccess) {
      openPremiumModal(item);
    } else {
      addItem(item);
    }
  };

  return (
    <div className="absolute top-20 left-4 bottom-6 w-96 z-20 flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Kho Đồ Nội Thất</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-normal">
              {filteredItems.length} món
            </span>
          </h2>
          <p className="text-xs text-slate-400">Chọn đồ để kéo thả vào căn phòng</p>
        </div>
        <button
          onClick={() => setCatalogOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 1. Bộ chuyển đổi Style: Tất cả | Stylized | Realistic */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <span>PHONG CÁCH MÔ HÌNH</span>
          <span className="text-[10px] text-slate-500 font-normal">Dual Style</span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800/70 rounded-xl border border-slate-700/60">
          {MODEL_STYLES.map((st) => (
            <button
              key={st.id}
              onClick={() => setCatalogStyleFilter(st.id)}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all text-center truncate ${
                catalogStyleFilter === st.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Ô tìm kiếm & Bộ lọc Phân hạng (Free / PRO) */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm sofa, bàn trà, tủ áo, đèn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Chips phân hạng: Tất cả | Miễn phí | PRO */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Hạng mục:</span>
          {MODEL_TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setCatalogTierFilter(tier.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                catalogTierFilter === tier.id
                  ? tier.id === 'premium'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-700 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tier.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Danh mục lọc theo phòng (Categories) */}
      <div className="px-3 py-2 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
        {visibleCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 4. Danh sách thẻ sản phẩm */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs space-y-2">
            <Box className="w-8 h-8 mx-auto text-slate-600" />
            <p>Không tìm thấy mô hình phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Box;
            const isPremium = item.tier === 'premium';
            const hasAccess = canUserAccessItem(item, userRole, userPlan);

            return (
              <div
                key={item.id}
                className={`group border rounded-xl p-3 flex items-center justify-between transition-all ${
                  isPremium
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-amber-500/20 hover:border-amber-500/50'
                    : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div className="relative w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-700/70 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {item.thumbnailPath ? (
                      <img
                        src={item.thumbnailPath}
                        alt={item.name}
                        className="w-10 h-10 object-contain drop-shadow transition-transform group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: item.defaultColor ? `${item.defaultColor}33` : '#1e293b' }}
                      >
                        <IconComponent className="w-5 h-5 text-slate-300 drop-shadow" />
                      </div>
                    )}

                    {/* Huy hiệu PRO nhỏ trên góc ảnh */}
                    {isPremium && (
                      <div className="absolute top-1 right-1 p-0.5 rounded bg-amber-500/20 text-amber-300">
                        <Crown className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Thông tin mô hình */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                        {item.name}
                      </h3>
                      {isPremium && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" />
                          <span>PRO</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{item.dimensions?.width}m × {item.dimensions?.depth}m × {item.dimensions?.height}m</span>
                      <span className="text-slate-600">•</span>
                      <span className="capitalize text-slate-500">{item.style || 'stylized'}</span>
                    </div>
                  </div>
                </div>

                {/* Nút Thêm hoặc Nâng cấp */}
                <button
                  onClick={() => handleItemClick(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 ml-2 ${
                    isPremium && !hasAccess
                      ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30'
                      : 'bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white'
                  }`}
                  title={isPremium && !hasAccess ? 'Mô hình PRO - Nâng cấp để mở khóa' : 'Thêm món đồ này vào phòng'}
                >
                  {isPremium && !hasAccess ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>PRO</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
