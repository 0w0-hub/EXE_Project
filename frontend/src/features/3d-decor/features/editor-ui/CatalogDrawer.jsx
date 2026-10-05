import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
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
import { FURNITURE_CATALOG, FURNITURE_CATEGORIES } from '../catalog/furnitureCatalog';

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
  const addItem = useSceneStore((state) => state.addItem);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isCatalogOpen) return null;

  // Danh mục hiển thị (loại bỏ các danh mục tạm ẩn)
  const visibleCategories = FURNITURE_CATEGORIES.filter((cat) => !cat.hidden);

  // Lọc sản phẩm theo danh mục và từ khóa tìm kiếm (loại bỏ đồ code và cửa sổ khỏi kho hiển thị)
  const filteredItems = FURNITURE_CATALOG.filter((item) => {
    if (item.category === 'doors-windows' || item.category === 'procedural') {
      return false;
    }
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddItem = (item) => {
    addItem(item);
  };

  return (
    <div className="absolute top-20 left-4 bottom-6 w-96 z-20 flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Kho Đồ Nội Thất</h2>
          <p className="text-xs text-slate-400">Chọn đồ để đưa vào phòng</p>
        </div>
        <button
          onClick={() => setCatalogOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Ô tìm kiếm */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm sofa, bàn, giường, đèn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Danh mục lọc (Categories) */}
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

      {/* Danh sách thẻ sản phẩm */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          filteredItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Box;
            return (
              <div
                key={item.id}
                className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 rounded-xl p-3 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner"
                    style={{ backgroundColor: item.defaultColor }}
                  >
                    <IconComponent className="w-5 h-5 text-white/90 drop-shadow" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {item.dimensions.width}m × {item.dimensions.depth}m × {item.dimensions.height}m
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddItem(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-all"
                  title="Thêm món đồ này vào phòng"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
