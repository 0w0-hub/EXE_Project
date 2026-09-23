import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { assetApi, roomApi } from '../services/api'
import { resolveFurniturePositions, furnitureSize } from '../lib/furnitureLayout'
import { slugify } from '../lib/slug'
import useEscapeKey from '../hooks/useEscapeKey'

const ROOM_HEIGHT_METERS = 2.8 // Room entity chưa có field chiều cao — dùng hằng số mặc định.
const DEFAULT_SIZE_METERS = 4
const VIEWPORT_HEIGHT = 420
const MIN_ROOM_METERS = 1.5
const MAX_ROOM_METERS = 15

// Màu Three.js (không đọc được CSS custom property) — khớp thủ công với design token trong styles.css
// (bảng màu "Peacock Feather") để scene 3D đồng bộ giao diện. Chỉ dùng khi AI không trả `colors` cụ thể.
const SCENE_BACKGROUND = '#E1EDD4' // --color-bg-tint
// TASK-043: nền + ánh sáng buổi tối (tuỳ chọn, không đụng màu tường/sàn AI thật) — mô phỏng hoàng hôn
// ấm áp thay vì ban ngày sáng rõ, cho cảm nhận không gian về đêm/đèn vàng.
const EVENING_BACKGROUND = '#2E2A4D'
const AMBIENT_GROUND_COLOR = 0x667085 // --color-text-muted
const WALL_FALLBACK_COLOR = '#E7E8F7' // --color-primary-tint
const FLOOR_FALLBACK_COLOR = '#E5F2FC' // --color-secondary-tint
const CEILING_FALLBACK_COLOR = '#F5F6F3' // AI không có role "CEILING" riêng — dùng trắng ngà trung tính cố định
const FURNITURE_FALLBACK_COLOR = '#70D6C5' // --color-accent
const ROOM_OUTLINE_COLOR = 0xb7c2ac
const HANDLE_COLOR = '#C4433D' // --color-danger

// Model 3D tĩnh (CC0, Kenney Furniture Kit — xem frontend/public/furniture/CREDITS.txt) dùng làm
// fallback theo category khi món nội thất chưa có mesh AI thật (item.modelAssetId, chỉ có ở
// AI_PROVIDER=replicate + 1 món "hero" — xem ADR-0005). Key khớp furnitureLayout.js#furnitureSize().
// Mỗi category có vài biến thể để các phòng khác nhau không trông giống hệt nhau.
const STATIC_FURNITURE_MODELS = {
  seating: [
    '/furniture/seating.glb',
    '/furniture/seating-2.glb',
    '/furniture/seating-3.glb',
    '/furniture/seating-4.glb',
    '/furniture/seating-5.glb',
    '/furniture/seating-6.glb',
    '/furniture/seating-7.glb', // TASK-047: bench (ghế dài)
    '/furniture/seating-8.glb', // TASK-047: chairRounded (ghế bo tròn)
  ],
  table: [
    '/furniture/table.glb',
    '/furniture/table-2.glb',
    '/furniture/table-3.glb',
    '/furniture/table-4.glb',
    '/furniture/table-5.glb',
    '/furniture/table-6.glb',
    '/furniture/table-7.glb', // TASK-047: tableCloth (bàn phủ khăn trải bàn)
    '/furniture/table-8.glb', // TASK-047: tableCoffeeSquare (bàn trà vuông)
  ],
  lighting: [
    '/furniture/lighting.glb',
    '/furniture/lighting-2.glb',
    '/furniture/lighting-3.glb',
    '/furniture/lighting-4.glb',
    '/furniture/lighting-5.glb', // TASK-048: lampSquareCeiling (đèn trần)
    '/furniture/lighting-6.glb', // TASK-048: lampWall (đèn tường)
  ],
  storage: [
    '/furniture/storage.glb',
    '/furniture/storage-2.glb',
    '/furniture/storage-3.glb',
    '/furniture/storage-4.glb',
    '/furniture/storage-5.glb',
    '/furniture/storage-6.glb',
    '/furniture/storage-7.glb', // TASK-048: bathroomCabinet (tủ nhỏ có gương)
    '/furniture/storage-8.glb', // TASK-048: kitchenCabinet (tủ bếp)
  ],
  // TASK-031: loại đồ user tự thêm ngoài 4 category cố định của AI — dùng chung nguồn model với
  // đồ trang trí tự động (DECOR_MODELS) vì cùng loại vật thể, chỉ khác cơ chế đặt (tự động vs tự thêm).
  plant: [
    '/furniture/decor-plant.glb',
    '/furniture/decor-plant-2.glb',
    '/furniture/decor-plant-3.glb',
    '/furniture/decor-plant-4.glb',
  ],
  // TASK-070: thêm biến thể thứ 4 (thảm chùi chân hình chữ nhật nhỏ, khác hẳn 3 kiểu thảm tròn/vuông có sẵn).
  rug: ['/furniture/decor-rug.glb', '/furniture/decor-rug-2.glb', '/furniture/decor-rug-3.glb', '/furniture/decor-rug-4.glb'],
  tv: ['/furniture/decor-tv.glb', '/furniture/decor-tv-2.glb'],
  coatrack: ['/furniture/decor-coatrack.glb'],
  // TASK-033
  mirror: ['/furniture/decor-mirror.glb'],
  speaker: ['/furniture/decor-speaker.glb', '/furniture/decor-speaker-2.glb'],
  // TASK-037 (+ TASK-050: bedBunk giường tầng, thêm biến thể thứ 3)
  bed: ['/furniture/decor-bed.glb', '/furniture/decor-bed-2.glb', '/furniture/decor-bed-3.glb'],
  desk: ['/furniture/decor-desk.glb', '/furniture/decor-desk-2.glb'],
  // TASK-038
  fridge: ['/furniture/decor-fridge.glb', '/furniture/decor-fridge-2.glb'],
  stove: ['/furniture/decor-stove.glb', '/furniture/decor-stove-2.glb'],
  // TASK-039
  toilet: ['/furniture/decor-toilet.glb', '/furniture/decor-toilet-2.glb'],
  bathtub: ['/furniture/decor-bathtub.glb'],
  // TASK-045
  nightstand: ['/furniture/decor-nightstand.glb', '/furniture/decor-nightstand-2.glb'],
  washer: ['/furniture/decor-washer.glb', '/furniture/decor-washer-2.glb'],
  // TASK-050
  shower: ['/furniture/decor-shower.glb', '/furniture/decor-shower-2.glb'],
  // TASK-051
  barcounter: ['/furniture/decor-barcounter.glb'],
  barstool: ['/furniture/decor-barstool.glb', '/furniture/decor-barstool-2.glb'],
  // TASK-054
  teddybear: ['/furniture/decor-teddybear.glb'],
  ceilingfan: ['/furniture/decor-ceilingfan.glb'],
  // TASK-057 (+ TASK-070: thêm biến thể xanh dương/dài, đa dạng hình dáng gối tựa hơn)
  pillow: ['/furniture/decor-pillow.glb', '/furniture/decor-pillow-2.glb', '/furniture/decor-pillow-3.glb'],
  books: ['/furniture/decor-books.glb'],
  // TASK-059
  hood: ['/furniture/decor-hood.glb'],
  laptop: ['/furniture/decor-laptop.glb'],
  // TASK-062: bồn rửa mặt bổ sung phòng tắm (toilet/bathtub/shower/washer đã có); lò vi sóng/thùng rác
  // bổ sung phụ kiện nhỏ đi kèm bếp (fridge/stove/hood đã có TASK-038/059) và phòng khách/chung.
  sink: ['/furniture/decor-sink.glb'],
  microwave: ['/furniture/decor-microwave.glb'],
  trashcan: ['/furniture/decor-trashcan.glb'],
  // TASK-064: máy tính (đi cùng bàn làm việc/laptop đã có TASK-037/059)/máy pha cà phê (phụ kiện bếp).
  computer: ['/furniture/decor-computer.glb'],
  coffeemachine: ['/furniture/decor-coffeemachine.glb'],
  // TASK-066: radio (đồ trang trí phòng khách)/máy nướng bánh mì (phụ kiện bếp, đi cùng lò vi sóng/máy
  // pha cà phê đã có TASK-062/064).
  radio: ['/furniture/decor-radio.glb'],
  toaster: ['/furniture/decor-toaster.glb'],
  // TASK-068: máy xay sinh tố (phụ kiện bếp nhỏ)/bồn rửa bát (khác bồn rửa mặt "sink" phòng tắm đã có
  // TASK-062 — hình dáng và ngữ cảnh sử dụng khác hẳn: bồn rửa bát có cánh tủ gỗ bên dưới).
  blender: ['/furniture/decor-blender.glb'],
  kitchensink: ['/furniture/decor-kitchensink.glb'],
  // TASK-072: bàn phím/chuột — phụ kiện hoàn thiện bộ máy tính bàn "computer" đã có (TASK-064).
  keyboard: ['/furniture/decor-keyboard.glb'],
  mouse: ['/furniture/decor-mouse.glb'],
  // TASK-074: thùng carton (2 biến thể đóng/mở) — phù hợp cảnh "mới chuyển nhà, chưa dọn hết đồ",
  // khác hẳn thẩm mỹ mọi loại đồ nội thất "hoàn thiện" đã có từ trước tới giờ.
  box: ['/furniture/decor-box.glb', '/furniture/decor-box-2.glb'],
}

// TASK-049: preset màu cho phép nhuộm lại 1 món nội thất ĐANG CHỌN (khác với bảng màu tường/sàn/trần
// bên dưới, áp dụng toàn phòng) — tint đồng loạt mọi vật liệu của model đó, không phân biệt gỗ/vải/kim
// loại (đơn giản, đủ dùng để "thử màu khác" mà không cần logic riêng cho từng loại vật liệu).
const ITEM_COLOR_PRESETS = ['#C4433D', '#4D52B4', '#70D6C5', '#E8B14D', '#5B6358', '#FFFFFF']

// Preset màu cho người dùng tự đổi thử tường/sàn/trần (chỉ trong phiên xem, không đụng màu AI thật
// trả về trong `colors` — override này độc lập, để trống (null) nghĩa là dùng lại màu AI/mặc định).
const COLOR_PICKER_GROUPS = [
  { key: 'wall', label: 'Tường', presets: ['#E7E8F7', '#F5EDE4', '#DCEAE3', '#EAD9D2', '#3A3F4B'] },
  { key: 'floor', label: 'Sàn', presets: ['#E5F2FC', '#D8C4A8', '#B08D63', '#EDEDED', '#6B4A32'] },
  { key: 'ceiling', label: 'Trần', presets: ['#F5F6F3', '#FFFFFF', '#EFEAE0', '#D9D9D9'] },
]

function colorForRole(colors, role, fallback) {
  return colors?.find((c) => c.role === role)?.colorHex || fallback
}

// Hash chuỗi đơn giản (không cần bảo mật) để chọn biến thể model ổn định theo từng phòng —
// cùng 1 phòng luôn ra cùng 1 biến thể (không đổi lung tung mỗi lần render), nhưng phòng khác
// nhau thì có xác suất khác nhau, tạo cảm giác đa dạng hơn giữa các thiết kế.
function hashSeed(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function pickStaticModel(category, roomId, index) {
  const variants = STATIC_FURNITURE_MODELS[(category || '').toLowerCase()]
  if (!variants || variants.length === 0) return null
  const seed = `${roomId || 'default'}-${category}-${index}`
  return variants[hashSeed(seed) % variants.length]
}

// Đồ trang trí phụ tự động (TASK-027, CC0 Kenney — xem CREDITS.txt) — không thuộc danh sách nội thất
// AI/không tính vào chi phí, chỉ thêm cho phòng đỡ trống. Không draggable, không ảnh hưởng logic
// kéo-thả/resize. Mỗi loại có vài biến thể (TASK-031) chọn theo `pickDecorModel` để đa dạng hơn.
const DECOR_MODELS = {
  rug: ['/furniture/decor-rug.glb', '/furniture/decor-rug-2.glb', '/furniture/decor-rug-3.glb'],
  plant: [
    '/furniture/decor-plant.glb',
    '/furniture/decor-plant-2.glb',
    '/furniture/decor-plant-3.glb',
    '/furniture/decor-plant-4.glb',
  ],
}

function pickDecorModel(kind, roomId, index) {
  const variants = DECOR_MODELS[kind]
  if (!variants || variants.length === 0) return null
  const seed = `${roomId || 'default'}-decor-${kind}-${index}`
  return variants[hashSeed(seed) % variants.length]
}

// Tên tiếng Việt cho category — 4 cái đầu do AI xác định cố định, 4 cái sau user có thể tự thêm
// (TASK-031) để đa dạng loại đồ trong phòng hơn.
const CATEGORY_LABELS_VI = {
  seating: 'Ghế/sofa',
  table: 'Bàn',
  lighting: 'Đèn',
  storage: 'Tủ/kệ',
  plant: 'Cây cảnh',
  rug: 'Thảm',
  tv: 'Tivi',
  coatrack: 'Móc treo đồ',
  mirror: 'Gương',
  speaker: 'Loa',
  bed: 'Giường',
  desk: 'Bàn làm việc',
  fridge: 'Tủ lạnh',
  stove: 'Bếp',
  toilet: 'Bồn cầu',
  bathtub: 'Bồn tắm',
  nightstand: 'Tủ đầu giường',
  washer: 'Máy giặt',
  shower: 'Vòi sen đứng',
  barcounter: 'Quầy bar',
  barstool: 'Ghế quầy bar',
  teddybear: 'Gấu bông',
  ceilingfan: 'Quạt trần',
  pillow: 'Gối tựa',
  books: 'Sách trang trí',
  hood: 'Máy hút mùi',
  laptop: 'Laptop',
  sink: 'Bồn rửa mặt',
  microwave: 'Lò vi sóng',
  trashcan: 'Thùng rác',
  computer: 'Máy tính bàn',
  coffeemachine: 'Máy pha cà phê',
  radio: 'Đài radio',
  toaster: 'Máy nướng bánh mì',
  blender: 'Máy xay sinh tố',
  kitchensink: 'Bồn rửa bát',
  keyboard: 'Bàn phím',
  mouse: 'Chuột máy tính',
  box: 'Thùng carton',
}

// TASK-065: chuẩn hoá chuỗi tìm kiếm (bỏ dấu tiếng Việt) — cùng cách làm với Projects.jsx#normalize,
// giúp tìm được "may" ra "Máy tính bàn"/"Máy pha cà phê" mà không cần gõ đúng dấu.
function normalizeSearch(str) {
  return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// TASK-055: sau nhiều round thêm loại đồ liên tiếp (037→054), danh sách nút "+ thêm" đã lên tới hơn 20
// mục, dàn thành khối nút rối mắt khó tìm. Gom theo nhóm phòng để dễ quét hơn — thuần hiển thị, không
// đổi hành vi `addFurniture`/dữ liệu. Category nào không có trong map này (hiếm khi xảy ra) rơi vào "Khác".
const FURNITURE_GROUPS = [
  { label: 'Cơ bản', categories: ['seating', 'table', 'lighting', 'storage'] },
  { label: 'Phòng khách/chung', categories: ['plant', 'rug', 'tv', 'coatrack', 'mirror', 'speaker', 'teddybear', 'ceilingfan', 'pillow', 'books', 'trashcan', 'radio', 'box'] },
  { label: 'Phòng ngủ', categories: ['bed', 'desk', 'nightstand', 'laptop', 'computer', 'keyboard', 'mouse'] },
  { label: 'Phòng bếp/ăn', categories: ['fridge', 'stove', 'barcounter', 'barstool', 'hood', 'microwave', 'coffeemachine', 'toaster', 'blender', 'kitchensink'] },
  { label: 'Phòng tắm/giặt', categories: ['toilet', 'bathtub', 'shower', 'washer', 'sink'] },
]
const GROUPED_CATEGORIES = new Set(FURNITURE_GROUPS.flatMap((g) => g.categories))
// Category nào lỡ quên thêm vào FURNITURE_GROUPS ở trên (vd task sau này thêm mới) vẫn hiện ra ở đây,
// không bị mất nút — an toàn hơn là phải nhớ cập nhật 2 chỗ mỗi khi thêm category mới.
const OTHER_CATEGORIES = Object.keys(CATEGORY_LABELS_VI).filter((c) => !GROUPED_CATEGORIES.has(c))

// Màu theo category cho sơ đồ mặt bằng 2D (TASK-031) — 4 màu đầu khớp bảng màu thương hiệu, 4 màu
// sau (loại đồ tự thêm) chọn thủ công để phân biệt rõ, không trùng bảng màu chính.
const PLAN_CATEGORY_COLORS = {
  seating: 'var(--color-primary)',
  table: 'var(--color-secondary)',
  lighting: 'var(--color-accent)',
  storage: 'var(--color-support)',
  plant: '#8BC79B',
  rug: '#D8B88A',
  tv: '#5B6358',
  coatrack: '#C4433D',
  mirror: '#9AB6D9',
  speaker: '#7A6A8A',
  bed: '#E0A899',
  desk: '#B7A46A',
  fridge: '#B9C4C9',
  stove: '#8A8F94',
  toilet: '#CFE0E8',
  bathtub: '#A8C6D6',
  nightstand: '#C9A87C',
  washer: '#94A0AC',
  shower: '#B7D6DE',
  barcounter: '#8A6E4E',
  barstool: '#D9A566',
  teddybear: '#C4915C',
  ceilingfan: '#9FA8AC',
  pillow: '#E8A0A8',
  books: '#7E6A9C',
  hood: '#A0ACB4',
  laptop: '#5C6470',
  sink: '#CBD9DD',
  microwave: '#5E6469',
  trashcan: '#8C9296',
  computer: '#3F4750',
  coffeemachine: '#6B5644',
  radio: '#9A7B4F',
  toaster: '#C0782D',
  blender: '#4F8FA6',
  kitchensink: '#A6B0B3',
  keyboard: '#6E7580',
  mouse: '#454B52',
  box: '#B08D63',
}

// Giá trị mặc định khi user tự thêm 1 món nội thất mới trong lúc xem — chi phí chỉ là ước tính tham
// khảo (không phải AI tính), luôn ghi rõ "(mới thêm)" trong tên để không nhầm với dữ liệu AI thật.
const CUSTOM_FURNITURE_PRESETS = {
  seating: { name: 'Ghế/sofa (mới thêm)', position: 'Góc phòng', estimatedCost: 8000000 },
  table: { name: 'Bàn (mới thêm)', position: 'Trung tâm phòng', estimatedCost: 4000000 },
  lighting: { name: 'Đèn (mới thêm)', position: 'Góc phòng, gần cửa sổ', estimatedCost: 2000000 },
  storage: { name: 'Tủ/kệ (mới thêm)', position: 'Sát tường', estimatedCost: 5000000 },
  plant: { name: 'Cây cảnh (mới thêm)', position: 'Góc phòng', estimatedCost: 500000 },
  rug: { name: 'Thảm (mới thêm)', position: 'Trung tâm phòng', estimatedCost: 1500000 },
  tv: { name: 'Tivi (mới thêm)', position: 'Sát tường', estimatedCost: 12000000 },
  coatrack: { name: 'Móc treo đồ (mới thêm)', position: 'Góc phòng', estimatedCost: 800000 },
  mirror: { name: 'Gương (mới thêm)', position: 'Sát tường', estimatedCost: 1200000 },
  speaker: { name: 'Loa (mới thêm)', position: 'Góc phòng', estimatedCost: 3000000 },
  bed: { name: 'Giường (mới thêm)', position: 'Sát tường', estimatedCost: 9000000 },
  desk: { name: 'Bàn làm việc (mới thêm)', position: 'Góc phòng, gần cửa sổ', estimatedCost: 3500000 },
  fridge: { name: 'Tủ lạnh (mới thêm)', position: 'Sát tường', estimatedCost: 7000000 },
  stove: { name: 'Bếp (mới thêm)', position: 'Sát tường', estimatedCost: 4500000 },
  toilet: { name: 'Bồn cầu (mới thêm)', position: 'Góc phòng', estimatedCost: 3500000 },
  bathtub: { name: 'Bồn tắm (mới thêm)', position: 'Sát tường', estimatedCost: 8500000 },
  nightstand: { name: 'Tủ đầu giường (mới thêm)', position: 'Sát tường', estimatedCost: 1500000 },
  washer: { name: 'Máy giặt (mới thêm)', position: 'Góc phòng', estimatedCost: 6500000 },
  shower: { name: 'Vòi sen đứng (mới thêm)', position: 'Góc phòng', estimatedCost: 7500000 },
  barcounter: { name: 'Quầy bar (mới thêm)', position: 'Sát tường', estimatedCost: 6000000 },
  barstool: { name: 'Ghế quầy bar (mới thêm)', position: 'Góc phòng', estimatedCost: 1200000 },
  teddybear: { name: 'Gấu bông (mới thêm)', position: 'Góc phòng', estimatedCost: 200000 },
  ceilingfan: { name: 'Quạt trần (mới thêm)', position: 'Trung tâm phòng', estimatedCost: 2500000 },
  pillow: { name: 'Gối tựa (mới thêm)', position: 'Góc phòng', estimatedCost: 150000 },
  books: { name: 'Sách trang trí (mới thêm)', position: 'Sát tường', estimatedCost: 300000 },
  hood: { name: 'Máy hút mùi (mới thêm)', position: 'Sát tường', estimatedCost: 3500000 },
  laptop: { name: 'Laptop (mới thêm)', position: 'Trung tâm phòng', estimatedCost: 15000000 },
  sink: { name: 'Bồn rửa mặt (mới thêm)', position: 'Sát tường', estimatedCost: 2800000 },
  microwave: { name: 'Lò vi sóng (mới thêm)', position: 'Sát tường', estimatedCost: 2200000 },
  trashcan: { name: 'Thùng rác (mới thêm)', position: 'Góc phòng', estimatedCost: 250000 },
  computer: { name: 'Máy tính bàn (mới thêm)', position: 'Góc phòng, gần cửa sổ', estimatedCost: 18000000 },
  coffeemachine: { name: 'Máy pha cà phê (mới thêm)', position: 'Sát tường', estimatedCost: 3500000 },
  radio: { name: 'Đài radio (mới thêm)', position: 'Sát tường', estimatedCost: 900000 },
  toaster: { name: 'Máy nướng bánh mì (mới thêm)', position: 'Sát tường', estimatedCost: 800000 },
  blender: { name: 'Máy xay sinh tố (mới thêm)', position: 'Sát tường', estimatedCost: 1200000 },
  kitchensink: { name: 'Bồn rửa bát (mới thêm)', position: 'Sát tường', estimatedCost: 4500000 },
  keyboard: { name: 'Bàn phím (mới thêm)', position: 'Trung tâm phòng', estimatedCost: 600000 },
  mouse: { name: 'Chuột máy tính (mới thêm)', position: 'Trung tâm phòng', estimatedCost: 350000 },
  box: { name: 'Thùng carton (mới thêm)', position: 'Góc phòng', estimatedCost: 50000 },
}

// TASK-125: nhãn hiển thị cho 1 category — tái dùng ĐÚNG dữ liệu đã có ở `CUSTOM_FURNITURE_PRESETS`
// (bỏ hậu tố " (mới thêm)") thay vì tạo 1 dictionary nhãn riêng trùng lặp. Fallback về chính category
// nếu không có preset khớp (không nên xảy ra, nhưng an toàn cho category lạ trong tương lai).
function categoryLabel(category) {
  return CUSTOM_FURNITURE_PRESETS[category]?.name.replace(' (mới thêm)', '') || category
}

// TASK-131: chuỗi giá ước tính dùng làm tooltip `title` cho nút "+ loại đồ" — cùng cách format VNĐ
// đã dùng ở dòng tóm tắt TASK-067/badge TASK-125 (`.toLocaleString('vi-VN')`).
function estimatedCostHint(category) {
  const cost = CUSTOM_FURNITURE_PRESETS[category]?.estimatedCost || 0
  return `Giá ước tính: ${cost.toLocaleString('vi-VN')} đ`
}

// TASK-135: chuẩn hoá radian → độ nguyên trong khoảng [0, 360) — `%` của JS giữ dấu âm nên tự cộng
// thêm 360 trước khi lấy dư, tránh hiện "-15°" sau khi xoay trái từ 0°.
function rotationRadToDeg(rad) {
  return ((Math.round(THREE.MathUtils.radToDeg(rad)) % 360) + 360) % 360
}

// Nhãn nổi trên mỗi món nội thất — tên + chi phí ước tính (nếu có, TASK-025) để xem nhanh trong scene
// mà không cần cuộn xuống bảng "Danh sách nội thất" bên dưới.
function makeLabelSprite(text, cost) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = cost > 0 ? 88 : 64
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(43,43,43,0.85)'
  ctx.roundRect(0, 8, 256, canvas.height - 16, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text.length > 18 ? `${text.slice(0, 17)}…` : text, 128, cost > 0 ? 30 : 32)

  if (cost > 0) {
    ctx.fillStyle = '#9EEBD3'
    ctx.font = '22px sans-serif'
    ctx.fillText(`${cost.toLocaleString('vi-VN')} đ`, 128, 62)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.2, cost > 0 ? 0.42 : 0.3, 1)
  return sprite
}

// Nền dạng gradient dọc (thay vì màu phẳng) để scene đỡ "phẳng như ảnh dán" — vẫn giữ đúng tông màu
// thương hiệu (SCENE_BACKGROUND), chỉ sáng dần lên phía trên để gợi cảm giác chiều sâu/ánh sáng.
function makeBackgroundTexture(hexColor) {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const base = new THREE.Color(hexColor)
  const top = base.clone().lerp(new THREE.Color('#ffffff'), 0.45)
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, `#${top.getHexString()}`)
  gradient.addColorStop(1, `#${base.getHexString()}`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Texture sàn dạng ván/gạch tạo bằng canvas (không cần tải ảnh ngoài, không rủi ro bản quyền) — nhuộm
// theo đúng màu sàn (AI thật hoặc override của user), chỉ thêm các dải sáng/tối xen kẽ + đường viền mờ
// để trông giống bề mặt lát thật thay vì 1 màu phẳng như nhựa.
function makeFloorTexture(hexColor) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const base = new THREE.Color(hexColor)

  ctx.fillStyle = `#${base.getHexString()}`
  ctx.fillRect(0, 0, size, size)

  const plankRows = 8
  const rowHeight = size / plankRows
  for (let row = 0; row < plankRows; row++) {
    const shade = row % 2 === 0 ? 1.06 : 0.94
    const plankColor = base.clone().multiplyScalar(shade)
    ctx.fillStyle = `#${plankColor.getHexString()}`
    ctx.fillRect(0, row * rowHeight, size, rowHeight)

    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, row * rowHeight)
    ctx.lineTo(size, row * rowHeight)
    ctx.stroke()

    // Đường nối ván so le theo hàng, tạo cảm giác lát thật thay vì 1 tấm liền.
    const seamCount = 3
    const offset = (row % 2) * (size / (seamCount * 2))
    for (let s = 0; s <= seamCount; s++) {
      const x = (s * size) / seamCount + offset
      ctx.beginPath()
      ctx.moveTo(x, row * rowHeight)
      ctx.lineTo(x, (row + 1) * rowHeight)
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Vân gỗ vẽ bằng canvas, nhuộm theo đúng màu gốc của material (TASK-027) — cùng kỹ thuật với
// `makeFloorTexture`, áp cho phần khung gỗ của nội thất (Kenney glTF chỉ có baseColorFactor phẳng,
// không có texture nào cả — xem attachLoadedModel#enhanceMaterial).
function makeWoodGrainTexture(baseColor) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = `#${baseColor.getHexString()}`
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 26; i++) {
    const y = (i / 26) * size + (Math.random() - 0.5) * 6
    ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.1})`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(size * 0.3, y + (Math.random() - 0.5) * 8, size * 0.7, y + (Math.random() - 0.5) * 8, size, y)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Vân vải/nệm nhẹ (chấm nhiễu mờ) cho phần bọc vải (sofa, ghế...) — cùng lý do với vân gỗ ở trên.
function makeFabricTexture(baseColor) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = `#${baseColor.getHexString()}`
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  for (let y = 0; y < size; y += 3) {
    for (let x = 0; x < size; x += 3) {
      if ((x + y) % 6 === 0) ctx.fillRect(x, y, 1, 1)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Nâng vật liệu nội thất theo tên material trong glTF (Kenney kit đặt tên nhất quán "wood"/"carpet"
// (vải bọc)/"metal"/"glass"/"lamp" trên toàn bộ 12 model — đã xác nhận qua đọc trực tiếp JSON chunk
// của từng file .glb). Không đổi hình dạng model, chỉ đổi material để đỡ "màu nhựa phẳng" như gốc.
function enhanceMaterial(material) {
  if (!material || material.userData.enhanced) return
  material.userData.enhanced = true
  const name = (material.name || '').toLowerCase()
  if (name.includes('wood')) {
    material.map = makeWoodGrainTexture(material.color)
    material.color.set(0xffffff)
    material.roughness = 0.55
  } else if (name.includes('carpet') || name.includes('fabric')) {
    material.map = makeFabricTexture(material.color)
    material.color.set(0xffffff)
    material.roughness = 0.9
  } else if (name.includes('metal')) {
    material.roughness = 0.35
    material.metalness = 0.6
  } else if (name.includes('glass')) {
    material.roughness = 0.05
    material.metalness = 0.1
    material.transparent = true
    material.opacity = 0.55
  } else if (name.includes('lamp')) {
    material.roughness = 0.55
  }
  material.needsUpdate = true
}

// Tranh treo tường trừu tượng vẽ bằng canvas, nhuộm theo màu accent của thiết kế (TASK-027) — không
// cần tải ảnh ngoài, không rủi ro bản quyền. 3 kiểu bố cục khác nhau (TASK-033) chọn theo `pattern`
// (0/1/2) để các phòng khác nhau không luôn thấy đúng 1 kiểu tranh.
function makeWallArtTexture(accentHex, pattern) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#F5F1E8'
  ctx.fillRect(0, 0, size, size)
  const accent = new THREE.Color(accentHex)
  const soft = accent.clone().lerp(new THREE.Color('#ffffff'), 0.3)

  if (pattern === 1) {
    // Sọc ngang xen kẽ đậm/nhạt.
    const rows = 5
    for (let i = 0; i < rows; i++) {
      ctx.fillStyle = i % 2 === 0 ? `#${accent.getHexString()}` : `#${soft.getHexString()}`
      ctx.fillRect(0, (i * size) / rows, size, size / rows)
    }
  } else if (pattern === 2) {
    // Vòng tròn đồng tâm lệch góc.
    for (let r = 3; r >= 1; r--) {
      ctx.fillStyle = r % 2 === 0 ? `#${soft.getHexString()}` : `#${accent.getHexString()}`
      ctx.beginPath()
      ctx.arc(size * 0.35, size * 0.4, size * 0.14 * r, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    // Mặc định: 2 vòng tròn lồng nhau, căn giữa.
    ctx.fillStyle = `#${soft.getHexString()}`
    ctx.beginPath()
    ctx.arc(size * 0.5, size * 0.46, size * 0.32, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `#${accent.getHexString()}`
    ctx.beginPath()
    ctx.arc(size * 0.5, size * 0.46, size * 0.17, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// TASK-035: xuất sơ đồ 2D thành PNG tải về — vẽ SVG lên canvas ẩn (nhân đôi độ phân giải cho nét)
// rồi export, không cần thư viện ngoài (khớp nguyên tắc tối giản dependency của dự án).
function downloadSvgAsPng(svgElement) {
  if (!svgElement) return
  const svgString = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const viewBoxWidth = svgElement.viewBox.baseVal.width
  const viewBoxHeight = svgElement.viewBox.baseVal.height
  const img = new Image()
  img.onload = () => {
    const exportScale = 2
    const canvas = document.createElement('canvas')
    canvas.width = viewBoxWidth * exportScale
    canvas.height = viewBoxHeight * exportScale
    const ctx = canvas.getContext('2d')
    ctx.scale(exportScale, exportScale)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, viewBoxWidth, viewBoxHeight)
    // Vẽ đúng theo kích thước viewBox thật, không dùng kích thước tự nhiên của <img> — ảnh SVG không
    // có thuộc tính width/height tường minh thường mặc định natural size 300x150 (hoặc tương tự,
    // không khớp viewBox thật), khiến ảnh xuất ra bị cắt/co lại nếu không ép rõ kích thước đích.
    ctx.drawImage(img, 0, 0, viewBoxWidth, viewBoxHeight)
    URL.revokeObjectURL(url)
    const link = document.createElement('a')
    link.download = `homely-so-do-2d-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = url
}

/**
 * Sơ đồ mặt bằng 2D nhìn từ trên xuống (TASK-031) — SVG thuần, dùng lại đúng logic vị trí/kích thước
 * của scene 3D (`resolveFurniturePositions`/`furnitureSize`) nên luôn khớp với "Không gian 3D",
 * không phải 1 nguồn dữ liệu riêng biệt có thể lệch nhau.
 */
function Room2DPlan({ room, furniture, selectedIndex }) {
  const svgRef = useRef(null)
  const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
  const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
  const scale = 40 // px/mét
  const pad = 26
  const dimPad = 34 // TASK-034: khoảng để vẽ đường kích thước (dimension line) bên dưới/bên phải phòng
  const roomRight = pad + width * scale
  const roomBottom = pad + length * scale
  const svgW = roomRight + dimPad
  const svgH = roomBottom + dimPad
  const toSvgX = (x) => pad + (width * scale) / 2 + x * scale
  const toSvgY = (z) => pad + (length * scale) / 2 + z * scale
  const positions = resolveFurniturePositions(furniture, width, length)
  const dimY = roomBottom + 14
  const dimX = roomRight + 14

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button type="button" className="secondary" onClick={() => downloadSvgAsPng(svgRef.current)}>
          📷 Tải sơ đồ
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="room2d-plan"
        role="img"
        aria-label="Sơ đồ mặt bằng 2D nhìn từ trên xuống"
      >
        <rect x={pad} y={pad} width={width * scale} height={length * scale} fill="#fff" stroke="var(--color-border)" />
        {/* Chỉ 2 mặt có tường thật (khớp Room3DViewer: backWall + leftWall), 2 mặt còn lại để trống. */}
        <line x1={pad} y1={pad} x2={pad + width * scale} y2={pad} stroke="#333" strokeWidth={4} />
        <line x1={pad} y1={pad} x2={pad} y2={pad + length * scale} stroke="#333" strokeWidth={4} />

        {/* Đường kích thước chiều rộng (dưới) + chiều dài (phải) — TASK-034. */}
        <g stroke="var(--color-text-muted)" strokeWidth={1}>
          <line x1={pad} y1={dimY - 4} x2={pad} y2={dimY + 4} />
          <line x1={roomRight} y1={dimY - 4} x2={roomRight} y2={dimY + 4} />
          <line x1={pad} y1={dimY} x2={roomRight} y2={dimY} />
          <line x1={dimX - 4} y1={pad} x2={dimX + 4} y2={pad} />
          <line x1={dimX - 4} y1={roomBottom} x2={dimX + 4} y2={roomBottom} />
          <line x1={dimX} y1={pad} x2={dimX} y2={roomBottom} />
        </g>
        <text x={(pad + roomRight) / 2} y={dimY - 6} textAnchor="middle" fontSize={10} fill="var(--color-text-muted)">
          {width.toFixed(1)}m
        </text>
        <text
          x={dimX + 6}
          y={(pad + roomBottom) / 2}
          textAnchor="middle"
          fontSize={10}
          fill="var(--color-text-muted)"
          transform={`rotate(90, ${dimX + 6}, ${(pad + roomBottom) / 2})`}
        >
          {length.toFixed(1)}m
        </text>
        {furniture.map((item, idx) => {
          const pos = positions[idx]
          if (!pos) return null
          const size = furnitureSize(item.category)
          const rectW = Math.max(size.w * scale, 8)
          const rectD = Math.max(size.d * scale, 8)
          const color = PLAN_CATEGORY_COLORS[(item.category || '').toLowerCase()] || 'var(--color-neutral-text)'
          // Chỉ hiện tên khi hộp đủ rộng để chữ không tràn ra ngoài/đè lên món khác cạnh bên — món
          // nhỏ (đèn, cây cảnh...) chỉ cần màu + chú giải bên dưới là đủ phân biệt.
          const canFitLabel = rectW >= 34
          const maxChars = Math.max(Math.floor(rectW / 6.2), 3)
          const label = (item.name || '').length > maxChars ? `${(item.name || '').slice(0, maxChars - 1)}…` : item.name
          const isSelected = idx === selectedIndex
          return (
            <g key={idx}>
              <rect
                x={toSvgX(pos.x) - rectW / 2}
                y={toSvgY(pos.z) - rectD / 2}
                width={rectW}
                height={rectD}
                fill={color}
                fillOpacity={0.8}
                stroke={isSelected ? 'var(--color-primary)' : '#2b2b2b'}
                strokeWidth={isSelected ? 3 : 1}
                rx={3}
              />
              {canFitLabel && (
                <text
                  x={toSvgX(pos.x)}
                  y={toSvgY(pos.z)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill="#1F2430"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="room2d-plan-legend">
        {[...new Set(furniture.map((item) => (item.category || '').toLowerCase()))].map((category) => (
          <span className="room2d-plan-legend-item" key={category}>
            <span
              className="room2d-plan-legend-dot"
              style={{ background: PLAN_CATEGORY_COLORS[category] || 'var(--color-neutral-text)' }}
            />
            {CATEGORY_LABELS_VI[category] || category}
          </span>
        ))}
      </div>
      <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
        Nhìn từ trên xuống, {width.toFixed(1)}m × {length.toFixed(1)}m (diện tích {(width * length).toFixed(1)} m²) — 2
        cạnh đậm là tường thật, 2 cạnh còn lại để trống (khớp không gian 3D).
        {selectedIndex != null && furniture[selectedIndex] && (
          <> Món viền tím đậm là "{furniture[selectedIndex].name || 'món đang chọn'}" — đang chọn ở tab "Không gian 3D".</>
        )}
      </p>
    </div>
  )
}

/**
 * 3D viewer/editor thật cho kết quả thiết kế — xem rules/frontend/components.md
 * (tách biệt khỏi form nhập liệu, props rõ ràng, không phụ thuộc global state).
 * Tách riêng khỏi ảnh AI 2D (`resultAssetId`) bằng tab để không mất thông tin ảnh AI thật.
 */
export default function Room3DViewer({ room, furniture = [], colors = [], resultAssetId, onRoomResized, budget }) {
  const mountRef = useRef(null)
  // TASK-034: tham chiếu camera/controls hiện tại + vị trí mặc định lúc mới dựng scene — dùng cho nút
  // "Nhìn từ trên"/"Đặt lại góc nhìn" (đổi trực tiếp, không cần rebuild lại toàn bộ scene).
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  // TASK-121: cùng pattern cameraRef/controlsRef — cho `captureScreenshot` (nằm ngoài effect dựng scene)
  // truy cập trực tiếp renderer/scene thật để tạm phóng độ phân giải lúc chụp ảnh, và `handleResize` có
  // sẵn (TASK-030) để phục hồi đúng kích thước hiển thị thật sau khi chụp xong.
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const handleResizeRef = useRef(() => {})
  const defaultViewRef = useRef(null)
  // TASK-139: chụp lại vị trí camera + `room.id` NGAY TRƯỚC KHI cleanup của effect dựng scene null hoá
  // `cameraRef`/`controlsRef` (cleanup luôn chạy TRƯỚC lần effect kế tiếp, nên KHÔNG thể đọc thẳng
  // `cameraRef.current` trong lần dựng mới — lúc đó đã bị null) — dùng để phân biệt "vẫn đang xem cùng
  // 1 phòng, chỉ đổi 1 toggle cosmetic" (giữ nguyên camera) với "chuyển sang phòng/thiết kế khác hẳn"
  // (về lại khung hình mặc định phù hợp kích thước phòng mới).
  const prevCameraStateRef = useRef(null)
  // TASK-142: giữ vị trí/góc xoay từng món nội thất qua các lần dựng lại scene do toggle cosmetic —
  // ĐÚNG KỸ THUẬT `prevCameraStateRef` ở trên (chụp trong cleanup TRƯỚC khi mesh bị dispose). Map
  // `index → {x, z, rotationY}`. `prevLocalFurnitureRef` lưu THAM CHIẾU mảng `localFurniture` của lần
  // render trước — `setLocalFurniture` (thêm/xoá/"Đặt lại bố trí") LUÔN gán mảng MỚI, nên so sánh `===`
  // giữa 2 lần là cách rẻ, đáng tin cậy để biết chỉ số các món có bị xáo trộn hay không.
  const transformOverridesRef = useRef({})
  const prevLocalFurnitureRef = useRef(null)
  // TASK-142: effect cleanup LUÔN chụp lại transform từ mesh hiện tại (đang sống) — nếu 1 hành động
  // CỐ TÌNH muốn xoá sạch override (vd "Đặt lại bố trí"), chỉ gán `transformOverridesRef.current = {}`
  // ngay trong handler KHÔNG đủ, vì cleanup chạy NGAY SAU ĐÓ sẽ ghi đè lại bằng giá trị cũ của mesh
  // (mesh vẫn giữ vị trí đã kéo tới khi cleanup chạy, vì cleanup luôn xảy ra TRƯỚC render mới). Cờ này
  // báo cho cleanup "bỏ qua, đừng chụp lại — đã có ý định xoá sạch rồi".
  const skipTransformCaptureRef = useRef(false)
  // TASK-049: nhớ lại món đang chọn (index) xuyên suốt các lần scene rebuild (vd sau khi đổi màu món —
  // itemColorOverrides đổi khiến effect chạy lại từ đầu) để tự chọn lại đúng món đó, tránh mất lựa chọn
  // giữa chừng khi đang thử nhiều màu liên tiếp.
  const selectedIndexRef = useRef(null)
  // TASK-075: gán bên trong effect dựng scene — cho phép nút bấm React (thanh công cụ, ngoài canvas) xoay
  // món đang chọn mà không cần rebuild scene, cùng pattern với cameraRef/controlsRef (TASK-034/058).
  const rotateSelectedRef = useRef(() => {})
  // TASK-109: chọn 1 món bằng index TỪ NGOÀI closure three.js (gọi từ danh sách React) — cùng pattern
  // `rotateSelectedRef`. Khác `rotateSelectedRef`: phải xử lý được cả trường hợp món đang ẩn (không có
  // mesh thật để raycast/vẽ viền), xem thân hàm gán trong effect dựng scene.
  const selectMeshRef = useRef(() => {})
  // TASK-116: đưa món đang chọn về đúng vị trí/góc xoay ban đầu (tính lại từ `resolveFurniturePositions`,
  // cùng nguồn sự thật duy nhất đã dùng ở `focusOnSelected` TASK-058) mà KHÔNG đụng tới món khác/màu sắc —
  // khác hẳn "Đặt lại bố trí" (TASK-028, xoá sạch mọi thay đổi tạm thời).
  const resetTransformRef = useRef(() => {})
  // TASK-135: đưa món đang chọn về tâm phòng (x=0,z=0), giữ nguyên góc xoay — cùng pattern
  // ref-delegation của `resetTransformRef` ở trên (thân thật gán trong effect dựng scene).
  const centerSelectedRef = useRef(() => {})
  // TASK-137: gán thẳng góc xoay (độ) cho món đang chọn — cùng pattern ref-delegation.
  const setRotationRef = useRef(() => {})
  // TASK-143: bật/tắt "Xuyên nhẹ" (opacity thấp) CHỈ cho món đang chọn — cùng pattern ref-delegation.
  const toggleXrayRef = useRef(() => {})
  const [xrayEnabled, setXrayEnabled] = useState(false)
  // TASK-069: focus nhanh ô tìm kiếm loại đồ (TASK-065) bằng phím "/" — quy ước phổ biến (GitHub, Slack).
  const furnitureSearchInputRef = useRef(null)
  const [tab, setTab] = useState('3d')
  const [resetSignal, setResetSignal] = useState(0)
  const [colorOverrides, setColorOverrides] = useState({ wall: null, floor: null, ceiling: null })
  // TASK-043: chế độ ánh sáng ban ngày/buổi tối — chỉ đổi nền + đèn, không đụng màu tường/sàn/trần thật.
  const [lightingMode, setLightingMode] = useState('day')
  // TASK-076: chỉ để đổi nhãn nút — nguồn sự thật là `controlsRef.current.autoRotate` (thuộc tính OrbitControls).
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  // TASK-076: bản sao trong ref (không trigger effect rebuild) — dùng để khôi phục lại đúng trạng thái
  // xoay tự động sau khi scene bị dựng lại vì lý do KHÁC (đổi màu, đổi tab...), cùng cách selectedIndexRef
  // (TASK-049) khôi phục lại món đang chọn.
  const isAutoRotatingRef = useRef(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false)
  const [previewDims, setPreviewDims] = useState(null)
  const [resizeError, setResizeError] = useState(null)
  // TASK-040: nhấp chọn 1 món trong scene 3D để tinh chỉnh bằng phím mũi tên/Delete (bổ sung cho kéo-thả
  // chuột — khó chính xác tuyệt đối) — chỉ dùng để hiển thị badge + highlight dòng tương ứng trong danh
  // sách bên dưới, nguồn sự thật vẫn là biến cục bộ `selectedMesh` trong effect dựng scene ở dưới.
  const [selectedFurnitureIndex, setSelectedFurnitureIndex] = useState(null)
  // TASK-124: menu chuột phải trên 1 món nội thất trong scene — `{index, x, y}` (toạ độ trang để định vị
  // menu) hoặc `null` khi đóng. Set từ closure three.js (`onContextMenu`), đọc ở JSX ngoài effect —
  // cùng cách bridge `selectedFurnitureIndex` đã dùng.
  const [contextMenu, setContextMenu] = useState(null)
  // TASK-133: khoảng cách (m) từ món đang kéo tới 2 mặt tường THẬT (`backWall`/`leftWall`) — bridge
  // state đọc trong JSX ngoài effect, đúng pattern `contextMenu`/`selectedFurnitureIndex`. `null` khi
  // không đang kéo.
  const [dragWallDistance, setDragWallDistance] = useState(null)
  // TASK-135: góc xoay (độ, 0-359) của món đang chọn — bridge state cập nhật ở mọi nơi mutate
  // `rotation.y` (nút xoay, phím Q/E, nhấp đúp, Đặt lại vị trí/góc xoay) + lúc chọn/bỏ chọn.
  const [selectedRotationDeg, setSelectedRotationDeg] = useState(0)
  // TASK-138: vị trí (x,z mét, làm tròn 1 chữ số) của món đang chọn — chỉ đọc, cập nhật ở mọi nơi mutate
  // `position` (kéo-thả, phím mũi tên, Về tâm phòng, Đặt lại vị trí/góc xoay) + lúc chọn/bỏ chọn.
  const [selectedPosition, setSelectedPosition] = useState(null)
  // TASK-138: hiện/ẩn danh sách vài thao tác gần nhất (mở rộng từ dòng "Thao tác gần nhất" chỉ 1 mục).
  const [showRecentActions, setShowRecentActions] = useState(false)
  const contextMenuRef = useRef(null)
  // TASK-049: màu nhuộm riêng cho từng món (key = index trong `localFurniture`), độc lập với màu
  // tường/sàn/trần (`colorOverrides`) — chỉ áp dụng khi user chọn 1 món rồi bấm 1 màu trong bảng.
  const [itemColorOverrides, setItemColorOverrides] = useState({})
  // TASK-102: ngăn xếp Hoàn tác/Làm lại ĐA CẤP cho mọi thao tác đổi `localFurniture`/`itemColorOverrides`/
  // `colorOverrides` (thêm/xoá/nhân đôi/sửa giá/đổi màu tường-sàn-trần/đổi màu món/đặt lại bố trí) — thay
  // thế cơ chế 1 cấp "Hoàn tác xoá" cũ (TASK-053). KHÔNG bao gồm kéo-thả/xoay bằng chuột hay phím mũi tên/
  // Q-E (vị trí/góc xoay chỉ tồn tại trong mesh three.js, chưa từng đồng bộ vào state React — quyết định
  // giữ nguyên từ TASK-028, nằm ngoài phạm vi task này để tránh viết lại kiến trúc đồng bộ vị trí).
  const MAX_HISTORY = 20
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])

  function pushHistory(label) {
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { furniture: localFurniture, itemColorOverrides, colorOverrides, label }])
    setRedoStack([])
  }

  function applyHistorySnapshot(snap) {
    setLocalFurniture(snap.furniture)
    setItemColorOverrides(snap.itemColorOverrides)
    setColorOverrides(snap.colorOverrides)
    selectedIndexRef.current = null
  }

  function undo() {
    if (history.length === 0) return
    const entry = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, { furniture: localFurniture, itemColorOverrides, colorOverrides, label: entry.label }])
    applyHistorySnapshot(entry)
  }

  function redo() {
    if (redoStack.length === 0) return
    const entry = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setHistory((prev) => [...prev, { furniture: localFurniture, itemColorOverrides, colorOverrides, label: entry.label }])
    applyHistorySnapshot(entry)
  }
  // TASK-061: bảng tra cứu phím tắt/thao tác chuột — số lượng thao tác đã tích luỹ qua nhiều task
  // (TASK-004, 034, 035, 040, 042, 052) nên gộp lại 1 chỗ để tra cứu, không phụ thuộc trạng thái đang chọn.
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  // TASK-063: sau nhiều round thêm loại đồ (nay đã 30 category), phòng có thể chứa hàng chục món cùng lúc
  // — nhãn tên+giá nổi trên mỗi món (TASK-025) dễ chồng chéo nhau gây rối mắt. Cho phép ẩn/hiện toàn bộ.
  // TASK-140: nhớ lựa chọn "Ẩn/hiện nhãn" qua `localStorage` — đúng pattern lazy-init `furniturePanelOpen`
  // (TASK-126): áp dụng đồng bộ ngay lúc khởi tạo state, try/catch an toàn (private mode/storage đầy).
  const [showLabels, setShowLabels] = useState(() => {
    try {
      const stored = localStorage.getItem('homely_show_labels')
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })
  function toggleLabels() {
    setShowLabels((prev) => {
      const next = !prev
      try {
        localStorage.setItem('homely_show_labels', String(next))
      } catch {
        // Bỏ qua lỗi ghi localStorage — chỉ mất tính năng nhớ trạng thái, không chặn thao tác hiện tại.
      }
      return next
    })
  }
  // TASK-131: tạm ẩn sàn + tường để nhìn nội thất rõ hơn lúc chỉnh bố cục — thuần phiên xem hiện tại,
  // KHÔNG persist (giống `showLabels`), reset về true khi đổi job/tải lại trang.
  const [showRoomSurfaces, setShowRoomSurfaces] = useState(true)
  // TASK-136: chế độ khung dây (chỉ áp cho nội thất, không áp tường/sàn/trần) — giúp nhìn xuyên khối
  // khi phòng đông món. Không persist, giống `showRoomSurfaces`.
  const [wireframeMode, setWireframeMode] = useState(false)
  // TASK-136: tốc độ xoay/pan/zoom camera — 3 mức, không persist.
  const [cameraSpeed, setCameraSpeed] = useState('normal')
  // TASK-136: phản hồi ngắn sau khi bấm "Sao chép ảnh" — 'success' | 'error' | null (ẩn).
  const [copyImageStatus, setCopyImageStatus] = useState(null)
  // TASK-137: bật/tắt bóng đổ toàn scene — không persist, giống các toggle render khác.
  const [shadowsEnabled, setShadowsEnabled] = useState(true)
  // TASK-139: ẩn đồ trang trí phụ (thảm/chậu cây/tranh tường), giữ nguyên nội thất chính — không persist.
  const [decorOnlyMode, setDecorOnlyMode] = useState(false)
  // TASK-139: tên món đang hover (không cần chọn) + toạ độ trang để đặt tooltip gần con trỏ.
  const [hoveredItemName, setHoveredItemName] = useState(null)
  const [hoverScreenPos, setHoverScreenPos] = useState({ x: 0, y: 0 })
  // TASK-137: 5 mức độ sáng (độ phơi sáng), ĐỘC LẬP với `lightingMode` (Ngày/Đêm TASK-043) — mặc định
  // mức 2 = "Bình thường" (hệ số 1.0, không đổi công thức exposure gốc).
  const [brightnessLevel, setBrightnessLevel] = useState(2)
  // TASK-126: thu gọn/mở panel "Nội thất trong phòng" (danh sách + catalog thêm loại đồ) để tăng diện
  // tích xem 3D khi cần — mặc định mở (giữ nguyên hành vi cũ). Lazy init đọc `localStorage` cùng pattern
  // `viewMode` (TASK-119) — try/catch an toàn nếu private mode/storage bị chặn.
  const [furniturePanelOpen, setFurniturePanelOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('homely_furniture_panel_open')
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })
  // TASK-130: 6 loại đồ vừa thêm gần đây nhất (mới nhất đứng đầu) — lazy init từ `localStorage`
  // (key `homely_recent_furniture`), cùng pattern try/catch an toàn của `furniturePanelOpen` trên.
  const [recentCategories, setRecentCategories] = useState(() => {
    try {
      const stored = localStorage.getItem('homely_recent_furniture')
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  function toggleFurniturePanel() {
    setFurniturePanelOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem('homely_furniture_panel_open', String(next))
      } catch {
        // Bỏ qua lỗi ghi localStorage (private mode/storage đầy) — chỉ mất tính năng nhớ trạng thái,
        // không chặn thao tác thu gọn/mở trong phiên hiện tại.
      }
      return next
    })
  }
  // TASK-117: làm tròn vị trí x/z về lưới khi kéo-thả nội thất bằng chuột — `0` = tắt (mặc định, giữ
  // nguyên hành vi tự do như trước), `0.1`/`0.25` = bước lưới theo mét. Chỉ áp dụng lúc kéo tay, không
  // đụng layout tự sinh (`resolveFurniturePositions`) hay góc xoay.
  const [snapStep, setSnapStep] = useState(0)
  // TASK-118 (phản hồi user "quá nhiều nút" sau 18 round tích luỹ trên thanh công cụ 3D): gộp 5 nút
  // góc nhìn camera vào 1 dropdown "📷 Góc nhìn ▾" và 2 nút ít dùng (Tải ảnh/Phím tắt) vào "⋯ Thêm ▾" —
  // cùng pattern dropdown đã có ở `NavBar.jsx` (AccountMenu/NotificationBell, TASK-082/083, click-outside
  // + Esc qua `useEscapeKey`).
  const [showCameraMenu, setShowCameraMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const cameraMenuRef = useRef(null)
  const moreMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(event.target)) setShowCameraMenu(false)
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) setShowMoreMenu(false)
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) setContextMenu(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  useEscapeKey(showCameraMenu, () => setShowCameraMenu(false))
  useEscapeKey(showMoreMenu, () => setShowMoreMenu(false))
  useEscapeKey(!!contextMenu, () => setContextMenu(null))
  // TASK-137: Esc bỏ chọn nội thất đang chọn — hành vi RIÊNG trong viewport, độc lập với 3 lời gọi
  // `useEscapeKey` ở trên (đóng dropdown/context menu). Nhiều `useEscapeKey` cùng tồn tại được, mỗi cái
  // tự kiểm tra điều kiện riêng (điều kiện `false` thì không đăng ký listener, không xung đột).
  useEscapeKey(selectedFurnitureIndex != null, () => selectMeshRef.current(null))
  // TASK-105: khoá toàn bộ control chỉnh sửa (thêm/xoá/kéo-thả/đổi màu/...) để xem lại an toàn, không sợ
  // bấm nhầm — mặc định `false` (giữ đúng hành vi chỉnh sửa mở sẵn như mọi task trước, không đổi trải
  // nghiệm mặc định). Đưa vào deps của effect dựng scene bên dưới (giống `showLabels`) để mọi handler
  // trong closure three.js đọc đúng giá trị mới nhất — cùng cách tiếp cận đã dùng cho các toggle khác.
  const [previewMode, setPreviewMode] = useState(false)
  // TASK-109: chỉ số món ĐANG ẨN TẠM khỏi scene 3D trong phiên xem (session-only, không phải xoá — khác
  // hẳn `removeFurniture`) — không tính vào Undo/Redo (TASK-102, giống vị trí/góc xoay không đồng bộ vào
  // state), không bị khoá bởi Preview Mode (TASK-105, đây là tiện ích XEM chứ không phải chỉnh sửa).
  const [hiddenIndices, setHiddenIndices] = useState(() => new Set())

  function toggleVisibility(index) {
    setHiddenIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }
  // TASK-141: món đã "khoá" không kéo/xoay được (nhầm lẫn) nhưng vẫn chọn/xem/đổi màu/xoá được bình
  // thường — cùng pattern `hiddenIndices`, không persist (phiên xem hiện tại).
  const [lockedIndices, setLockedIndices] = useState(() => new Set())
  function toggleLock(index) {
    setLockedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }
  // TASK-141: "Cô lập món đang chọn" — tạm ẩn mọi món khác, khác "Chỉ nội thất" (TASK-139, ẩn đồ trang
  // trí, giữ TẤT CẢ nội thất). Không persist.
  const [isIsolating, setIsIsolating] = useState(false)
  // TASK-141: lưới 3D trên mặt sàn — ĐỘC LẬP với Snap-to-Grid (TASK-117), thuần trực quan. Không persist.
  const [showGrid, setShowGrid] = useState(false)
  // TASK-142: chỉ số món vừa thêm qua `addFurniture` — hiện viền nổi bật vài giây rồi tự tắt, giúp nhận
  // ra ngay món mới trong scene nhiều đồ. Bridge state đọc trong effect dựng scene, giống các bridge khác.
  const [justAddedIndex, setJustAddedIndex] = useState(null)
  // TASK-143: khoá camera (OrbitControls) — tránh vô tình xoay/pan/zoom lúc đang tập trung chỉnh nội
  // thất. Đưa vào dependency array effect dựng scene (đúng pattern mọi toggle cosmetic khác) — rebuild
  // không mất vị trí camera nhờ `prevCameraStateRef` (TASK-139) đã áp dụng cho MỌI lần rebuild, không
  // riêng gì lý do này. Không persist.
  const [cameraLocked, setCameraLocked] = useState(false)
  // TASK-065: danh sách nút "+ thêm" đã lên tới hơn 30 loại (5 nhóm) — thêm ô tìm kiếm lọc theo tên để
  // đỡ phải cuộn/quét mắt tìm đúng loại đồ cần thêm.
  const [furnitureSearch, setFurnitureSearch] = useState('')
  // TASK-075: xuất/nhập bố trí bằng file JSON (session-only, không đụng backend).
  const [importError, setImportError] = useState(null)
  const importInputRef = useRef(null)
  // Bản sao cục bộ của danh sách nội thất — cho phép thêm/xoá món trong lúc xem (TASK-027) mà không
  // đụng dữ liệu AI thật gốc (`furniture` prop). Đồng bộ lại khi prop đổi (job khác) hoặc khi bấm
  // "Đặt lại bố trí" (huỷ mọi thêm/xoá tạm thời, giống cách reset đã huỷ mọi kéo-thả vị trí).
  const [localFurniture, setLocalFurniture] = useState(furniture)

  useEffect(() => {
    setLocalFurniture(furniture)
    // TASK-102: job/phòng khác — lịch sử cũ không còn nghĩa, tránh Hoàn tác nhảy sang dữ liệu job khác.
    setHistory([])
    setRedoStack([])
    setHiddenIndices(new Set()) // TASK-109: chỉ số món đã đổi ý nghĩa khi đổi job/phòng.
  }, [furniture])

  function addFurniture(category) {
    const preset = CUSTOM_FURNITURE_PRESETS[category]
    if (!preset) return
    pushHistory(`Thêm "${CATEGORY_LABELS_VI[category] || category}"`)
    // TASK-142: chỉ số món mới = độ dài mảng TRƯỚC khi thêm (đúng vị trí món sẽ nằm ở cuối mảng mới).
    setJustAddedIndex(localFurniture.length)
    setTimeout(() => setJustAddedIndex(null), 2000)
    setLocalFurniture((prev) => [...prev, { ...preset, category, isCustom: true }])
    // TASK-130: ghi nhớ loại đồ vừa dùng, mới nhất lên đầu, tối đa 6, bỏ trùng.
    setRecentCategories((prev) => {
      const next = [category, ...prev.filter((c) => c !== category)].slice(0, 6)
      try {
        localStorage.setItem('homely_recent_furniture', JSON.stringify(next))
      } catch {
        // Bỏ qua lỗi ghi localStorage (private mode/storage đầy) — chỉ mất tính năng nhớ, không chặn thêm đồ.
      }
      return next
    })
  }

  function removeFurniture(index) {
    pushHistory(`Xoá "${localFurniture[index]?.name || 'món nội thất'}"`)
    setLocalFurniture((prev) => prev.filter((_, i) => i !== index))
    // TASK-049: dồn lại key màu riêng theo index mới sau khi xoá (mọi món sau món bị xoá lùi 1 chỉ số),
    // tránh nhuộm nhầm màu sang món khác — bỏ luôn màu của chính món vừa xoá.
    setItemColorOverrides((prev) => {
      const next = {}
      Object.entries(prev).forEach(([key, hex]) => {
        const i = Number(key)
        if (i < index) next[i] = hex
        else if (i > index) next[i - 1] = hex
      })
      return next
    })
    // Đồng bộ luôn "món đang chọn" (TASK-049) theo cùng quy tắc dồn chỉ số, tránh tự chọn nhầm món
    // khác sau khi rebuild nếu vừa xoá đúng món đang chọn hoặc 1 món đứng trước nó.
    if (selectedIndexRef.current === index) selectedIndexRef.current = null
    else if (selectedIndexRef.current != null && selectedIndexRef.current > index) selectedIndexRef.current -= 1
  }

  // TASK-041: nhân đôi 1 món có sẵn (kể cả món AI gốc) — dùng lại đúng `category`/`position` text nên
  // được `resolveFurniturePositions` tự tách khỏi bản gốc qua cơ chế chống chồng lấn có sẵn (TASK-037),
  // không cần tính toạ độ riêng. Luôn đánh dấu "(bản sao)" (thay thế nếu đã có, tránh lặp khi nhân đôi
  // nhiều lần) để không nhầm với dữ liệu AI thật, giống nguyên tắc "(mới thêm)" của `addFurniture`.
  function duplicateFurniture(index) {
    pushHistory(`Nhân đôi "${localFurniture[index]?.name || 'món nội thất'}"`)
    setLocalFurniture((prev) => {
      const item = prev[index]
      if (!item) return prev
      const baseName = (item.name || 'Nội thất').replace(/ \(bản sao\)$/, '')
      return [...prev, { ...item, name: `${baseName} (bản sao)`, isCustom: true }]
    })
  }

  // TASK-071: xoá nhanh MỌI món tự thêm/nhân đôi (isCustom) cùng lúc, giữ nguyên vị trí kéo-thả/màu đã
  // chỉnh của món AI gốc — khác "Đặt lại bố trí" (huỷ luôn cả màu tường/sàn/trần và vị trí AI gốc).
  function removeAllCustom() {
    pushHistory('Xoá món tự thêm')
    setLocalFurniture((prev) => {
      const indexMap = new Map()
      let newIndex = 0
      prev.forEach((item, oldIndex) => {
        if (!item.isCustom) {
          indexMap.set(oldIndex, newIndex)
          newIndex += 1
        }
      })
      setItemColorOverrides((prevColors) => {
        const next = {}
        Object.entries(prevColors).forEach(([key, hex]) => {
          const mapped = indexMap.get(Number(key))
          if (mapped != null) next[mapped] = hex
        })
        return next
      })
      if (selectedIndexRef.current != null) {
        const mapped = indexMap.get(selectedIndexRef.current)
        selectedIndexRef.current = mapped != null ? mapped : null
      }
      return prev.filter((item) => !item.isCustom)
    })
  }

  // TASK-075: mọi thay đổi (thêm/xoá/kéo-thả/màu) chỉ tồn tại trong phiên xem (session-only, quyết định
  // từ TASK-028) — tải trang lại là MẤT SẠCH, không có cách nào lưu lại bố trí đã dày công chỉnh. Cho
  // phép xuất/nhập file JSON để user tự lưu/khôi phục bằng tay, KHÔNG đụng backend (giữ đúng nguyên tắc
  // "không đồng bộ 2 chiều" — file JSON là bản sao ở máy user, không phải nguồn sự thật mới).
  function exportLayout() {
    const payload = {
      version: 1,
      roomId: room?.id,
      exportedAt: new Date().toISOString(),
      furniture: localFurniture,
      colorOverrides,
      itemColorOverrides,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `homely-bo-tri-${Date.now()}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  function importLayout(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.furniture)) throw new Error('missing furniture array')
        pushHistory('Tải bố trí đã lưu')
        setLocalFurniture(data.furniture)
        setColorOverrides(data.colorOverrides || { wall: null, floor: null, ceiling: null })
        setItemColorOverrides(data.itemColorOverrides || {})
        selectedIndexRef.current = null
        setImportError(null)
      } catch {
        setImportError('File không đúng định dạng bố trí Homely đã xuất trước đó.')
      }
    }
    reader.readAsText(file)
  }

  // TASK-046: chi phí món tự thêm chỉ là ước tính tham khảo cố định trong preset (không phải AI tính) —
  // cho phép chỉnh sửa trực tiếp thay vì luôn cố định. Chỉ áp dụng cho `isCustom` (giữ nguyên tắc "không
  // bịa dữ liệu": không cho sửa chi phí món AI thật, vốn là số liệu thật từ kết quả thiết kế).
  function updateFurnitureCost(index, cost) {
    pushHistory(`Sửa giá "${localFurniture[index]?.name || 'món nội thất'}"`)
    setLocalFurniture((prev) => prev.map((item, i) => (i === index ? { ...item, estimatedCost: cost } : item)))
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      // Có thể bị trình duyệt từ chối (vd trang bị nhúng trong iframe không cho phép fullscreen) —
      // im lặng bỏ qua, không có fallback UI vì đây chỉ là tiện ích thêm, không phải chức năng chính.
      mountRef.current?.requestFullscreen().catch(() => {})
    }
  }

  // TASK-076: đối chiếu lại mockup `index.html` (thanh công cụ nổi có nút "Xoay 360°" tự động + nút
  // "Góc nhìn walkthrough") — Homely đã có xoay thủ công (kéo chuột) nhưng chưa có xoay TỰ ĐỘNG liên tục,
  // và các góc nhìn nhanh sẵn có (TASK-034/058) đều là góc nhìn "từ ngoài nhìn vào", chưa có góc nhìn
  // ngang tầm mắt người đứng trong phòng. Bật/tắt trực tiếp thuộc tính có sẵn của OrbitControls — animate
  // loop đã gọi `controls.update()` mỗi khung hình (dòng ~1622) nên không cần thêm code render riêng.
  function toggleAutoRotate() {
    const controls = controlsRef.current
    if (!controls) return
    controls.autoRotate = !controls.autoRotate
    isAutoRotatingRef.current = controls.autoRotate
    setIsAutoRotating(controls.autoRotate)
  }

  // TASK-076: góc nhìn ngang tầm mắt (1.6m, chiều cao mắt người trưởng thành trung bình) đứng gần 1 góc
  // phòng nhìn vào — khác hẳn "Nhìn từ trên" (từ trên xuống) và góc mặc định (từ ngoài, chếch cao) đã có.
  function setWalkthroughView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
    const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
    const eyeHeight = 1.6
    camera.position.set(-width * 0.35, eyeHeight, length * 0.35)
    controls.target.set(width * 0.1, eyeHeight, -length * 0.1)
    controls.update()
  }

  // TASK-034: 2 góc nhìn nhanh — đổi trực tiếp camera/controls đang chạy (không rebuild scene).
  function setTopView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
    const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
    // x/z lệch 1 chút (không đúng 0) để tránh mất phương hướng xoay khi camera thẳng đứng hoàn toàn.
    camera.position.set(0.01, Math.max(width, length) * 1.4, 0.01)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  function resetView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    const defaultView = defaultViewRef.current
    if (!camera || !controls || !defaultView) return
    camera.position.copy(defaultView.position)
    controls.target.copy(defaultView.target)
    controls.update()
  }

  // TASK-138: "Về giữa phòng" cho CAMERA — khác hẳn "🎯 Về tâm phòng" (TASK-135, di chuyển NỘI THẤT
  // đang chọn). Khôi phục điểm nhìn (`controls.target`) về giữa phòng theo trục ngang (x=0,z=0) sau khi
  // user đã pan (kéo chuột phải, OrbitControls mặc định bật `enablePan`) đi xa — GIỮ NGUYÊN khoảng
  // cách/góc nhìn hiện tại (tịnh tiến cả camera lẫn target theo cùng độ lệch), khác `resetView` (nhảy hẳn
  // về góc nhìn mặc định cố định, mất luôn góc/khoảng cách user đang xem).
  function centerView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const offset = camera.position.clone().sub(controls.target)
    controls.target.set(0, controls.target.y, 0)
    camera.position.copy(controls.target).add(offset)
    controls.update()
  }

  // TASK-127: "Xem toàn bộ" — KHÁC "Đặt lại góc nhìn" (TASK-034/resetView, luôn canh theo kích thước
  // PHÒNG cố định): tính bounding box THẬT theo vị trí món nội thất hiện có (`resolveFurniturePositions`,
  // cùng nguồn sự thật TASK-058) — khi nội thất tụ lại 1 góc phòng lớn, "Xem toàn bộ" zoom sát đúng khu
  // vực có món thay vì hiện cả khoảng trống của phòng như resetView. Phòng chưa có món nào → về hẳn
  // resetView (không có gì để tính bounding box).
  function focusAll() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    if (localFurniture.length === 0) {
      resetView()
      return
    }
    const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
    const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
    const positions = resolveFurniturePositions(localFurniture, width, length)
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxH = 0
    localFurniture.forEach((item, i) => {
      const pos = positions[i]
      const size = furnitureSize(item.category)
      minX = Math.min(minX, pos.x - size.w / 2)
      maxX = Math.max(maxX, pos.x + size.w / 2)
      minZ = Math.min(minZ, pos.z - size.d / 2)
      maxZ = Math.max(maxZ, pos.z + size.d / 2)
      maxH = Math.max(maxH, size.h)
    })
    const centerX = (minX + maxX) / 2
    const centerZ = (minZ + maxZ) / 2
    const distance = Math.max(maxX - minX, maxZ - minZ, 1.5) * 1.3 + 1.5
    camera.position.set(centerX + distance, maxH + distance * 0.7, centerZ + distance)
    controls.target.set(centerX, maxH / 2, centerZ)
    controls.update()
  }

  // TASK-112: 2 góc nhìn nhanh thêm — nhìn thẳng vào 1 mặt tường (trục Z) và vuông góc với mặt đó
  // (trục X), hữu ích để kiểm tra bố trí tường/tranh treo hoặc chiều sâu nội thất mà "Nhìn từ trên"
  // (từ trên xuống) và góc mặc định (chếch cao từ ngoài) không thấy rõ. Cùng pattern `setTopView`.
  function setFrontView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
    const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
    camera.position.set(0, 1.6, Math.max(width, length) * 1.3)
    controls.target.set(0, 1.2, 0)
    controls.update()
  }

  function setSideView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
    const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
    camera.position.set(Math.max(width, length) * 1.3, 1.6, 0)
    controls.target.set(0, 1.2, 0)
    controls.update()
  }

  // TASK-058: phóng camera lại gần món đang chọn (TASK-040) — tính lại vị trí bằng đúng hàm thuần
  // `resolveFurniturePositions` (không cần đọc trực tiếp mesh Three.js, vốn chỉ tồn tại bên trong effect
  // dựng scene) nên dùng được ngay cả khi effect chưa kịp rebuild sau khi chọn món.
  function focusOnSelected() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls || selectedFurnitureIndex == null) return
    const item = localFurniture[selectedFurnitureIndex]
    if (!item) return
    const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
    const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
    const positions = resolveFurniturePositions(localFurniture, width, length)
    const pos = positions[selectedFurnitureIndex]
    const size = furnitureSize(item.category)
    const targetY = size.h / 2
    const distance = Math.max(size.w, size.d) * 1.6 + 0.8
    camera.position.set(pos.x + distance, targetY + size.h * 0.9 + 0.5, pos.z + distance)
    controls.target.set(pos.x, targetY, pos.z)
    controls.update()
  }

  // TASK-075: nút bấm trên thanh công cụ để xoay món đang chọn — cùng bước 15°/lần như phím Q/E (TASK-042),
  // chỉ khác cách kích hoạt (nút hiện rõ trên UI thay vì phải biết trước phím tắt).
  function rotateSelected(direction) {
    rotateSelectedRef.current(direction)
  }

  // TASK-116: nút "Đặt lại vị trí/góc xoay" cho món đang chọn — thân hàm thật gán trong effect dựng scene
  // (cần truy cập trực tiếp mesh three.js), theo cùng pattern uỷ quyền qua ref của `rotateSelected`.
  function resetSelectedTransform() {
    resetTransformRef.current()
  }

  // TASK-135: đưa món đang chọn về tâm mặt bằng phòng — khác `resetSelectedTransform` (đưa về vị trí
  // TÍNH TOÁN BAN ĐẦU từ `resolveFurniturePositions` + góc xoay 0°), giữ nguyên góc xoay hiện tại.
  function centerSelected() {
    centerSelectedRef.current()
  }

  // TASK-137: gõ trực tiếp góc xoay (độ) cho món đang chọn thay vì bấm nhiều lần nút xoay 15°. Bỏ qua
  // giá trị không hợp lệ (vd đang gõ dở/xoá trắng ô nhập) — tránh gán `NaN` làm vỡ mesh.
  function setSelectedRotationInput(deg) {
    if (!Number.isFinite(deg)) return
    setRotationRef.current(deg)
  }

  // TASK-141: "Cô lập món đang chọn" — không cần ref-delegation (không đụng trực tiếp mesh three.js từ
  // đây, chỉ đổi state React `isIsolating` — effect dựng scene tự đọc lại state này lúc rebuild).
  function toggleIsolate() {
    setIsIsolating((prev) => !prev)
  }

  // TASK-033: tải ảnh chụp scene 3D hiện tại (đúng góc nhìn/màu/nội thất đang xem) — cần
  // `preserveDrawingBuffer: true` trên renderer (đã bật ở effect dựng scene) để toDataURL() luôn có
  // dữ liệu, không phụ thuộc thời điểm gọi có ngay sau 1 khung hình render hay không.
  // TASK-121: `multiplier` > 1 tạm phóng độ phân giải renderer lên đúng bấy nhiêu lần (giữ nguyên tỉ lệ
  // khung nên không méo), render 1 khung hình ở kích thước mới rồi chụp, sau đó phục hồi ngay kích thước
  // hiển thị thật qua `handleResizeRef` (tái dùng `handleResize` có sẵn, không tính lại thủ công).
  function captureScreenshot(multiplier = 1) {
    const canvas = mountRef.current?.querySelector('canvas')
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    if (!canvas || !renderer || !scene || !camera) return
    if (multiplier > 1) {
      // `updateStyle: false` — chỉ phóng độ phân giải BUFFER vẽ (ảnh xuất ra to hơn), giữ nguyên kích
      // thước CSS hiển thị trên trang (không giật/phình khung nhìn trong lúc chụp).
      renderer.setSize(canvas.clientWidth * multiplier, canvas.clientHeight * multiplier, false)
      renderer.render(scene, camera)
    }
    // TASK-125: tên file có ý nghĩa (loại phòng + ngày) thay vì `homely-3d-{timestamp}.png` cố định —
    // tái dùng `slugify` đã có (TASK-023) thay vì viết lại cách bỏ dấu tiếng Việt.
    const roomSlug = slugify(room?.roomType) || 'phong'
    const dateStr = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.download = `homely-${roomSlug}-${dateStr}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    if (multiplier > 1) handleResizeRef.current()
  }

  // TASK-136: sao chép khung hình 3D hiện tại thẳng vào clipboard (dán ngay vào Messenger/Word/
  // PowerPoint), không cần tải file rồi tìm lại. Dùng chung canvas với `captureScreenshot` (multiplier=1,
  // không phóng độ phân giải — Clipboard API không cần thiết phải ảnh siêu nét). Bọc try/catch vì
  // Clipboard API có thể bị chặn quyền/không hỗ trợ tuỳ trình duyệt — báo lỗi nhẹ, không vỡ app.
  async function copyScreenshotToClipboard() {
    const canvas = mountRef.current?.querySelector('canvas')
    if (!canvas) return
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Không tạo được ảnh từ canvas')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopyImageStatus('success')
    } catch {
      setCopyImageStatus('error')
    }
    setTimeout(() => setCopyImageStatus(null), 2500)
  }

  useEffect(() => {
    if (!resultAssetId) return undefined
    let objectUrl
    assetApi.fetchObjectUrl(resultAssetId).then((url) => {
      objectUrl = url
      setImageUrl(url)
    }).catch(() => setImageUrl(null))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [resultAssetId])

  useEffect(() => {
    if (tab !== '3d' || !mountRef.current) return undefined

    const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
    const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
    const height = ROOM_HEIGHT_METERS

    const mount = mountRef.current
    const containerWidth = mount.clientWidth || 600

    // TASK-142: xem giải thích đầy đủ ở khai báo `transformOverridesRef`/`prevLocalFurnitureRef`.
    const sameFurniture = prevLocalFurnitureRef.current === localFurniture

    const isEvening = lightingMode === 'evening'

    const scene = new THREE.Scene()
    scene.background = makeBackgroundTexture(isEvening ? EVENING_BACKGROUND : SCENE_BACKGROUND)

    // TASK-139: công thức khung hình mặc định — tách riêng khỏi việc GÁN cho camera, để `defaultViewRef`
    // luôn lưu đúng giá trị mặc định thật (dùng cho `resetView()`) bất kể camera thật đang ở đâu.
    const defaultCameraPosition = new THREE.Vector3(width * 0.9, height * 1.6, length * 1.3)
    const defaultTarget = new THREE.Vector3(0, height / 3, 0)
    // Vẫn đang xem CÙNG 1 phòng (chỉ đổi 1 toggle cosmetic, vd Ẩn nhãn/Buổi tối/Khung dây...) → giữ
    // nguyên camera cũ, tránh "nhảy" khung hình mất hết pan/zoom/xoay user vừa làm. Đổi sang phòng/thiết
    // kế khác hẳn (hoặc lần dựng đầu tiên) → dùng khung hình mặc định phù hợp kích thước phòng mới.
    const prevCameraState = prevCameraStateRef.current
    const sameRoom = prevCameraState && prevCameraState.roomId === room?.id

    const camera = new THREE.PerspectiveCamera(50, containerWidth / VIEWPORT_HEIGHT, 0.1, 100)
    camera.position.copy(sameRoom ? prevCameraState.position : defaultCameraPosition)

    // preserveDrawingBuffer: true — cần để "Tải ảnh 3D" (TASK-033) chụp canvas bằng toDataURL() hoạt
    // động ổn định, không phụ thuộc thời điểm gọi có đúng ngay sau 1 lần render hay không.
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(containerWidth, VIEWPORT_HEIGHT)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // Đổ bóng + tone mapping ACES: giúp scene có chiều sâu (nội thất "chạm sàn" thật thay vì lơ lửng)
    // và màu sắc dịu/tự nhiên hơn thay vì phẳng như tô màu phẳng mặc định của three.js.
    renderer.shadowMap.enabled = shadowsEnabled // TASK-137: toggle bóng đổ toàn scene
    renderer.shadowMap.type = THREE.PCFShadowMap // PCFSoftShadowMap deprecated từ three r186, tự fallback về giá trị này
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    // TASK-137: hệ số độ sáng (mức 0-4, mặc định mức 2 = 1.0) nhân thêm vào công thức exposure gốc
    // theo `lightingMode` — độc lập với việc đổi preset Ngày/Đêm.
    const brightnessFactor = [0.6, 0.8, 1, 1.2, 1.5][brightnessLevel] ?? 1
    renderer.toneMappingExposure = (isEvening ? 0.85 : 1.05) * brightnessFactor
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(sameRoom ? prevCameraState.target : defaultTarget) // TASK-139
    controls.maxPolarAngle = Math.PI / 2.05
    controls.minDistance = 1.5
    controls.maxDistance = Math.max(width, length) * 3
    // TASK-076: khôi phục lại trạng thái xoay tự động nếu scene bị dựng lại (đổi màu/tab...) trong lúc
    // đang bật, giống cách selectedIndexRef (TASK-049) khôi phục lại món đang chọn.
    controls.autoRotate = isAutoRotatingRef.current
    controls.autoRotateSpeed = 2.5
    // TASK-136: hệ số tốc độ theo `cameraSpeed` — nhân với giá trị mặc định của OrbitControls (1.0).
    const cameraSpeedFactor = cameraSpeed === 'slow' ? 0.5 : cameraSpeed === 'fast' ? 1.8 : 1
    controls.rotateSpeed = cameraSpeedFactor
    controls.panSpeed = cameraSpeedFactor
    controls.zoomSpeed = cameraSpeedFactor
    controls.enabled = !cameraLocked // TASK-143
    controls.update()

    cameraRef.current = camera
    controlsRef.current = controls
    rendererRef.current = renderer
    sceneRef.current = scene
    // TASK-139: LUÔN lưu đúng khung hình mặc định thật (không phải vị trí camera hiện tại, có thể đã
    // được giữ nguyên từ lần dựng trước) — giữ đúng ý nghĩa "về hẳn mặc định" của `resetView()`.
    defaultViewRef.current = { position: defaultCameraPosition.clone(), target: defaultTarget.clone() }

    scene.add(new THREE.HemisphereLight(isEvening ? 0x6b6ea8 : 0xffffff, AMBIENT_GROUND_COLOR, isEvening ? 0.35 : 0.7))

    // Đèn chính (đổ bóng thật) — vị trí lệch góc trên giống ánh sáng cửa sổ/trần tự nhiên. Buổi tối
    // đổi màu ấm (cam vàng) + giảm cường độ, mô phỏng đèn trong nhà thay vì ánh sáng ban ngày.
    const dirLight = new THREE.DirectionalLight(isEvening ? 0xffb37a : 0xffffff, isEvening ? 0.55 : 1.4)
    dirLight.position.set(width * 0.8, height * 2.2, length * 0.6)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    const shadowSpan = Math.max(width, length) * 0.75
    dirLight.shadow.camera.left = -shadowSpan
    dirLight.shadow.camera.right = shadowSpan
    dirLight.shadow.camera.top = shadowSpan
    dirLight.shadow.camera.bottom = -shadowSpan
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = height * 6 + Math.max(width, length) * 2
    dirLight.shadow.bias = -0.0015
    dirLight.target.position.set(0, 0, 0)
    scene.add(dirLight)
    scene.add(dirLight.target)

    // Đèn phụ nhẹ phía đối diện — làm dịu bóng đổ quá gắt, không đổ bóng (tránh double-shadow rối mắt).
    const fillLight = new THREE.DirectionalLight(isEvening ? 0x8892d6 : 0xffffff, isEvening ? 0.2 : 0.35)
    fillLight.position.set(-width * 0.6, height * 1.2, -length * 0.6)
    scene.add(fillLight)

    const wallColor = colorOverrides.wall || colorForRole(colors, 'PRIMARY', WALL_FALLBACK_COLOR)
    const floorColor = colorOverrides.floor || colorForRole(colors, 'SECONDARY', FLOOR_FALLBACK_COLOR)
    const accentColor = colorForRole(colors, 'ACCENT', FURNITURE_FALLBACK_COLOR)

    const floorTexture = makeFloorTexture(floorColor)
    floorTexture.repeat.set(Math.max(width / 2, 1), Math.max(length / 2, 1))
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width, length),
      new THREE.MeshStandardMaterial({ map: floorTexture, side: THREE.DoubleSide, roughness: 0.75, metalness: 0.04 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    floor.visible = showRoomSurfaces
    scene.add(floor)

    // TASK-141: lưới 3D trên mặt sàn — ĐỘC LẬP với Snap-to-Grid (TASK-117, thuần logic làm tròn vị trí,
    // không liên quan hiển thị) và với `showRoomSurfaces` (tắt lưới không tắt sàn, ngược lại cũng vậy).
    const gridHelper = new THREE.GridHelper(Math.max(width, length), Math.round(Math.max(width, length)), 0x888888, 0xaaaaaa)
    gridHelper.position.y = 0.01 // nhích nhẹ trên mặt sàn, tránh z-fighting
    gridHelper.visible = showGrid
    scene.add(gridHelper)

    const wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor, side: THREE.DoubleSide, roughness: 0.95, metalness: 0 })
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMaterial)
    backWall.position.set(0, height / 2, -length / 2)
    backWall.receiveShadow = true
    backWall.visible = showRoomSurfaces
    scene.add(backWall)

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(length, height), wallMaterial)
    leftWall.rotation.y = Math.PI / 2
    leftWall.position.set(-width / 2, height / 2, 0)
    leftWall.receiveShadow = true
    leftWall.visible = showRoomSurfaces
    scene.add(leftWall)

    // Trần nhà: bán trong suốt vì camera bị khoá không xoay lên nhìn từ dưới lên
    // (controls.maxPolarAngle ở trên) nên trần đặc sẽ luôn che khuất góc nhìn từ trên xuống.
    const ceilingColor = colorOverrides.ceiling || colorForRole(colors, 'CEILING', CEILING_FALLBACK_COLOR)
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(width, length),
      new THREE.MeshStandardMaterial({
        color: ceilingColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        roughness: 0.9,
      })
    )
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = height
    scene.add(ceiling)

    // Viền phòng mờ (không phải khối wireframe rõ nét) — chỉ để gợi ý ranh giới 2 mặt tường còn thiếu,
    // tránh trông như hộp khung dây "debug".
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, length)),
      new THREE.LineBasicMaterial({ color: ROOM_OUTLINE_COLOR, transparent: true, opacity: 0.45 })
    )
    outline.position.y = height / 2
    scene.add(outline)

    // Handle kéo-resize (TASK-007) — chỉ thêm khi có room.id thật để persist được kích thước mới.
    const resizeHandles = []
    let resizePreview = null
    let currentWidth = width
    let currentLength = length
    if (room?.id) {
      const widthHandle = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshStandardMaterial({ color: HANDLE_COLOR, roughness: 0.4, metalness: 0.1 })
      )
      widthHandle.position.set(width / 2, height / 2, 0)
      widthHandle.userData.axis = 'width'
      scene.add(widthHandle)
      resizeHandles.push(widthHandle)

      const lengthHandle = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshStandardMaterial({ color: HANDLE_COLOR, roughness: 0.4, metalness: 0.1 })
      )
      lengthHandle.position.set(0, height / 2, length / 2)
      lengthHandle.userData.axis = 'length'
      scene.add(lengthHandle)
      resizeHandles.push(lengthHandle)
    }

    function updateResizePreview(w, l) {
      if (resizePreview) {
        scene.remove(resizePreview)
        resizePreview.geometry.dispose()
      }
      resizePreview = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, height, l)),
        new THREE.LineBasicMaterial({ color: HANDLE_COLOR })
      )
      resizePreview.position.y = height / 2
      scene.add(resizePreview)
    }

    const gltfLoader = new GLTFLoader()
    let modelLoadsCancelled = false

    const draggables = []
    // TASK-139: các mesh trang trí phụ (thảm, chậu cây, tranh treo tường — KHÔNG phải nội thất chính
    // trong danh sách) — toggle "Chỉ nội thất" ẩn/hiện đồng loạt qua mảng này.
    const decorMeshes = []
    // TASK-142: MỌI mesh nội thất (kể cả đang ẩn/isolate) — dùng để chụp lại transform lúc cleanup.
    const meshesForTransformCapture = []

    // TASK-035: viền sáng khi rê chuột qua 1 món nội thất — gợi ý "có thể kéo/nhấp đúp để xoay" trước
    // khi thao tác. Dùng 1 mesh viền dùng chung, scale/dịch theo món đang hover thay vì đổi material
    // của model thật (model có thể ẩn/là con lồng nhau nhiều lớp, đổi material phức tạp và rủi ro hơn).
    const hoverOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false })
    )
    hoverOutline.visible = false
    hoverOutline.renderOrder = 999
    scene.add(hoverOutline)

    // TASK-141: highlight vùng sàn ngay dưới món đang kéo — thuần trực quan, KHÔNG đổi cơ chế clamp/snap
    // hiện có. Mesh phẳng dùng chung, dịch chuyển + đổi kích thước theo món đang kéo thay vì tạo/xoá liên
    // tục — cùng pattern `hoverOutline`/`alignGuideX` (TASK-035/128).
    const dragFloorHighlight = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x70d6c5, transparent: true, opacity: 0.35, depthTest: false })
    )
    dragFloorHighlight.rotation.x = -Math.PI / 2
    dragFloorHighlight.position.y = 0.015 // trên sàn, dưới lưới 3D (0.01) một chút để không chồng lẫn
    dragFloorHighlight.renderOrder = 997
    dragFloorHighlight.visible = false
    scene.add(dragFloorHighlight)

    // TASK-040: viền chọn (khác màu, không tự ẩn khi rê chuột ra chỗ khác như viền hover) — nhấp 1 món
    // để "chọn" rồi dùng phím mũi tên/Delete tinh chỉnh, bổ sung cho kéo-thả chuột (khó chính xác tuyệt đối).
    const selectionOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0x4d52b4, transparent: true, opacity: 0.95, depthTest: false })
    )
    selectionOutline.visible = false
    selectionOutline.renderOrder = 999
    scene.add(selectionOutline)

    // TASK-142: viền nổi bật tạm thời cho món VỪA THÊM (`justAddedIndex`) — màu riêng khác viền chọn/hover
    // để không nhầm 3 trạng thái, tự tắt sau ~2s (đồng hồ chạy ở component body, effect chỉ đọc state).
    const newItemOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.95, depthTest: false })
    )
    newItemOutline.visible = false
    newItemOutline.renderOrder = 999
    scene.add(newItemOutline)

    // TASK-128: đường dẫn hướng căn chỉnh — hiện KHI kéo 1 món tới gần thẳng hàng (cùng x hoặc cùng z)
    // với 1 món KHÁC, thuần gợi ý trực quan (không tự snap, khác Snap-to-Grid TASK-117 hoạt động độc
    // lập song song). Cùng pattern mesh dùng chung dịch chuyển thay vì tạo/xoá liên tục như hoverOutline.
    const ALIGN_GUIDE_TOLERANCE = 0.08
    const alignGuideMaterial = new THREE.LineBasicMaterial({ color: 0x70d6c5, transparent: true, opacity: 0.85, depthTest: false })
    const alignGuideX = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.02, -length), new THREE.Vector3(0, 0.02, length)]),
      alignGuideMaterial
    )
    const alignGuideZ = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-width, 0.02, 0), new THREE.Vector3(width, 0.02, 0)]),
      alignGuideMaterial
    )
    alignGuideX.visible = false
    alignGuideZ.visible = false
    alignGuideX.renderOrder = 998
    alignGuideZ.renderOrder = 998
    scene.add(alignGuideX)
    scene.add(alignGuideZ)

    function updateAlignGuides(movingMesh, x, z) {
      let matchedX = null
      let matchedZ = null
      draggables.forEach((mesh) => {
        if (mesh === movingMesh) return
        if (matchedX === null && Math.abs(mesh.position.x - x) < ALIGN_GUIDE_TOLERANCE) matchedX = mesh.position.x
        if (matchedZ === null && Math.abs(mesh.position.z - z) < ALIGN_GUIDE_TOLERANCE) matchedZ = mesh.position.z
      })
      alignGuideX.visible = matchedX !== null
      if (matchedX !== null) alignGuideX.position.x = matchedX
      alignGuideZ.visible = matchedZ !== null
      if (matchedZ !== null) alignGuideZ.position.z = matchedZ
    }

    function hideAlignGuides() {
      alignGuideX.visible = false
      alignGuideZ.visible = false
    }

    let selectedMesh = null
    let pointerDownAt = null
    let pointerOverCanvas = false
    // TASK-143: món đang bật "Xuyên nhẹ" (nếu có) — biến cục bộ trong closure effect, KHÔNG persist qua
    // rebuild (mesh cũ bị dispose hoàn toàn nên tự về mặc định opacity=1 ở lần dựng mới). Nếu state React
    // `xrayEnabled` vẫn còn `true` từ lần trước lúc effect NÀY chạy lại (do 1 toggle KHÁC kích hoạt rebuild),
    // chủ động tắt để nhãn nút không nói sai "đang bật" trong khi mesh mới đã opacity=1 rồi.
    let xrayedMesh = null
    if (xrayEnabled) setXrayEnabled(false)

    function setMeshXray(mesh, on) {
      if (!mesh) return
      mesh.traverse((node) => {
        if (node.isMesh && node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          materials.forEach((m) => {
            m.transparent = on
            m.opacity = on ? 0.35 : 1
            m.needsUpdate = true // three.js cần cờ này để đổi lại đúng pipeline trong suốt/đặc lúc runtime
          })
        }
      })
    }

    function syncSelectionOutline() {
      if (!selectedMesh) {
        selectionOutline.visible = false
        return
      }
      const p = selectedMesh.geometry.parameters
      selectionOutline.scale.set(p.width * 1.15, p.height * 1.15, p.depth * 1.15)
      selectionOutline.position.copy(selectedMesh.position)
      selectionOutline.rotation.copy(selectedMesh.rotation)
      selectionOutline.visible = true
    }

    function selectMesh(mesh) {
      // TASK-143: đổi sang món khác (hoặc bỏ chọn) trong lúc đang "Xuyên nhẹ" — khôi phục đúng độ mờ
      // cho món CŨ, không mang chế độ xuyên nhẹ sang món mới (tránh "kẹt" trong suốt trên món đã rời đi).
      if (xrayedMesh && xrayedMesh !== mesh) {
        setMeshXray(xrayedMesh, false)
        xrayedMesh = null
        setXrayEnabled(false)
      }
      selectedMesh = mesh
      syncSelectionOutline()
      selectedIndexRef.current = mesh ? mesh.userData.index : null
      setSelectedFurnitureIndex(mesh ? mesh.userData.index : null)
      // TASK-135: đồng bộ góc xoay hiển thị ngay lúc chọn/bỏ chọn.
      setSelectedRotationDeg(mesh ? rotationRadToDeg(mesh.rotation.y) : 0)
      // TASK-138: đồng bộ vị trí hiển thị ngay lúc chọn/bỏ chọn.
      setSelectedPosition(mesh ? { x: Math.round(mesh.position.x * 10) / 10, z: Math.round(mesh.position.z * 10) / 10 } : null)
    }

    // TASK-052: cảnh báo mềm khi kéo 1 món đè lên món khác — chỉ đổi màu viền hover sang đỏ để gợi ý,
    // KHÔNG chặn thao tác (user vẫn có thể cố ý đặt sát/chồng nhẹ nếu muốn, giống triết lý kéo-thả tự do
    // đã có từ TASK-004). Bỏ qua góc xoay (coi mọi món là hộp thẳng trục) — đủ dùng cho cảnh báo trực quan,
    // nhất quán với mức độ chính xác của thuật toán chống chồng lấn tự động (`resolveFurniturePositions`).
    function overlapsAnother(mesh) {
      const p = mesh.geometry.parameters
      return draggables.some((other) => {
        if (other === mesh) return false
        const op = other.geometry.parameters
        return (
          Math.abs(mesh.position.x - other.position.x) < (p.width + op.width) / 2 &&
          Math.abs(mesh.position.z - other.position.z) < (p.depth + op.depth) / 2
        )
      })
    }

    const furniturePositions = resolveFurniturePositions(localFurniture, width, length)
    localFurniture.forEach((item, idx) => {
      const computedPos = furniturePositions[idx]
      // TASK-142: dùng lại vị trí/góc xoay đã lưu từ lần dựng TRƯỚC (nếu chỉ số các món không đổi —
      // `sameFurniture`) thay vì luôn tính lại từ `resolveFurniturePositions` — tránh "nhảy" vị trí mỗi
      // khi bấm 1 toggle cosmetic khác.
      const savedTransform = sameFurniture ? transformOverridesRef.current[idx] : undefined
      const x = savedTransform ? savedTransform.x : computedPos.x
      const z = savedTransform ? savedTransform.z : computedPos.z
      const size = furnitureSize(item.category)
      const isHiddenItem = hiddenIndices.has(idx) // TASK-109: ẩn tạm — vẫn tồn tại trong dữ liệu/chi phí.
      // TASK-141: đang "Cô lập món đang chọn" — mọi món KHÁC món đang chọn tạm ẩn (không đổi `hiddenIndices`
      // React, chỉ ghi đè hiển thị cho lần dựng scene này — thoát isolate sẽ tự áp dụng lại đúng state cũ).
      const isVisibleNow = !isHiddenItem && !(isIsolating && selectedIndexRef.current !== idx)
      // Khối hộp luôn được tạo — vừa là placeholder mặc định, vừa là proxy raycasting/kéo-thả cho
      // model GLB thật (nếu có), vì raycast trên nhiều sub-mesh của 1 scene GLTF phức tạp hơn nhiều.
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size.w, size.h, size.d),
        new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6, metalness: 0.05, wireframe: wireframeMode })
      )
      mesh.position.set(x, size.h / 2, z)
      if (savedTransform) mesh.rotation.y = savedTransform.rotationY // TASK-142
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData.index = idx // TASK-040: dùng để chọn/xoá/di chuyển bằng bàn phím khớp đúng món trong localFurniture.
      mesh.visible = isVisibleNow
      scene.add(mesh)
      // TASK-142: MỌI mesh (kể cả đang ẩn/isolate) — dùng để chụp lại transform lúc cleanup, khác
      // `draggables` (chỉ mesh đang hiển thị, dùng cho raycast).
      meshesForTransformCapture.push(mesh)
      // TASK-109: món ẩn KHÔNG vào `draggables` — không raycast/click-select/kéo-thả được trong scene
      // khi đang ẩn (chỉ chọn lại được qua danh sách, bằng `selectMeshRef`). TASK-141: món tạm ẩn do
      // isolate cũng loại khỏi `draggables` cùng lý do — tránh raycast trúng vật thể vô hình.
      if (mesh.visible) draggables.push(mesh)

      // TASK-142: món vừa thêm qua `addFurniture` — đặt viền nổi bật (đúng pattern `selectionOutline`,
      // dùng size vừa tính thay vì `geometry.parameters` vì mesh này chính là mesh vừa tạo cho món đó).
      if (idx === justAddedIndex && isVisibleNow) {
        newItemOutline.scale.set(size.w * 1.15, size.h * 1.15, size.d * 1.15)
        newItemOutline.position.copy(mesh.position)
        newItemOutline.rotation.copy(mesh.rotation)
        newItemOutline.visible = true
      }

      // TASK-063: chỉ tạo sprite khi đang bật hiển thị nhãn — tránh tốn canvas/texture vô ích lúc đã ẩn.
      // TASK-109: món đang ẩn cũng không cần nhãn nổi (mesh đã `visible=false`, nhãn vẫn là object riêng
      // không tự ẩn theo mesh cha — phải loại trừ tường minh). TASK-141: món tạm ẩn do isolate CÙNG LÝ DO
      // (đây chính là bug ban đầu phát hiện lúc verify — nhãn nổi vẫn hiện dù mesh đã ẩn nếu chỉ check
      // `isHiddenItem` mà quên `isVisibleNow`).
      if (showLabels && isVisibleNow) {
        const label = makeLabelSprite(item.name || 'Nội thất', item.estimatedCost)
        label.position.set(x, size.h + 0.3, z)
        scene.add(label)
        mesh.userData.label = label
      }

      if (item.modelAssetId) {
        // Mesh AI thật (ADR-0005/TASK-006, chỉ item "hero") — ưu tiên cao nhất khi có.
        loadAiFurnitureModel(item.modelAssetId, mesh, size)
      } else {
        // TASK-018: chưa có mesh AI thật — dùng model tĩnh CC0 theo category thay vì để khối hộp trơn.
        const staticUrl = pickStaticModel(item.category, room?.id, idx)
        if (staticUrl) {
          loadStaticFurnitureModel(staticUrl, mesh, size)
        }
      }

      // TASK-044: buổi tối — món "lighting" (đèn sàn/đèn bàn) phát thêm ánh sáng vàng ấm tại đúng vị
      // trí của nó, như đang được bật lên, thay vì chỉ đổi ánh sáng toàn cục chung chung (TASK-043).
      if (isEvening && (item.category || '').toLowerCase() === 'lighting') {
        const lampLight = new THREE.PointLight(0xffcf8a, 1.1, 3.2, 2)
        lampLight.position.set(x, size.h * 0.85, z)
        scene.add(lampLight)
      }
    })

    // TASK-049: tự chọn lại đúng món đã chọn trước khi scene rebuild (vd sau khi đổi màu) — giữ liên
    // tục trải nghiệm "chọn rồi thử nhiều màu" thay vì bị bỏ chọn sau mỗi lần bấm 1 màu.
    if (selectedIndexRef.current != null) {
      const restored = draggables.find((m) => m.userData.index === selectedIndexRef.current)
      if (restored) selectMesh(restored)
      else selectedIndexRef.current = null
    }

    // Đồ trang trí phụ (TASK-027) — thảm giữa phòng (dưới bàn trung tâm) + 2 chậu cây ở góc mở phía
    // trước (không có tường, ít khi trùng vị trí nội thất chính vì heuristic layout thường đẩy đồ về
    // phía sau/góc). Không draggable, không tính vào chi phí, chỉ để phòng đỡ trống.
    loadDecorModel(pickDecorModel('rug', room?.id, 0), { x: 0, z: 0 }, Math.min(width, length) * 0.35)
    loadDecorModel(pickDecorModel('plant', room?.id, 1), { x: (width / 2) * 0.75, z: (length / 2) * 0.7 }, 0.6)
    loadDecorModel(pickDecorModel('plant', room?.id, 2), { x: -(width / 2) * 0.75, z: (length / 2) * 0.7 }, 0.5)
    addWallArt(accentColor, width, height, length)

    // Gắn 1 gltf đã load xong vào box proxy: scale-to-fit theo kích thước box, căn đúng gốc sàn,
    // rồi ẩn box đi (box vẫn giữ nguyên để raycast kéo-thả/kéo-resize hoạt động như cũ).
    function attachLoadedModel(gltf, proxyMesh, size) {
      const model = gltf.scene
      // TASK-049: nhuộm lại toàn bộ vật liệu của model theo màu user chọn riêng cho món này (nếu có) —
      // áp dụng SAU `enhanceMaterial` (giữ nguyên texture vân gỗ/vải đã tạo, chỉ đổi tông màu phủ lên).
      const tintHex = itemColorOverrides[proxyMesh.userData.index]
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true
          node.receiveShadow = true
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          materials.forEach((m) => {
            enhanceMaterial(m)
            if (tintHex) m.color.set(tintHex)
            m.wireframe = wireframeMode // TASK-136
          })
        }
      })
      const box = new THREE.Box3().setFromObject(model)
      const modelSize = new THREE.Vector3()
      box.getSize(modelSize)
      const scale = Math.min(
        modelSize.x > 0 ? size.w / modelSize.x : 1,
        modelSize.y > 0 ? size.h / modelSize.y : 1,
        modelSize.z > 0 ? size.d / modelSize.z : 1
      )
      const center = new THREE.Vector3()
      box.getCenter(center)
      model.scale.setScalar(scale)
      model.position.set(-center.x * scale, -box.min.y * scale - size.h / 2, -center.z * scale)
      proxyMesh.add(model)
      proxyMesh.material.visible = false
    }

    // Mesh 3D thật (ADR-0005/TASK-006) — chỉ item "hero" có modelAssetId. Asset có auth nên phải fetch
    // qua assetApi trước rồi mới load; lỗi/chưa verify schema thật thì im lặng giữ nguyên box.
    function loadAiFurnitureModel(modelAssetId, proxyMesh, size) {
      assetApi.fetchObjectUrl(modelAssetId).then((blobUrl) => {
        if (modelLoadsCancelled) return
        gltfLoader.load(
          blobUrl,
          (gltf) => {
            if (!modelLoadsCancelled) attachLoadedModel(gltf, proxyMesh, size)
          },
          undefined,
          () => {
            // Load lỗi (network/schema/model hỏng) — giữ nguyên khối hộp, đúng thiết kế fallback.
          }
        )
      }).catch(() => {
        // Không tải được blob (401/404/...) — giữ nguyên khối hộp.
      })
    }

    // TASK-018: model tĩnh CC0 (Kenney) theo category — file public, không cần auth nên load thẳng URL.
    function loadStaticFurnitureModel(url, proxyMesh, size) {
      gltfLoader.load(
        url,
        (gltf) => {
          if (!modelLoadsCancelled) attachLoadedModel(gltf, proxyMesh, size)
        },
        undefined,
        () => {
          // Load lỗi (404/mạng) — giữ nguyên khối hộp.
        }
      )
    }

    // TASK-027: đồ trang trí phụ — không có box proxy (không cần raycast/kéo-thả), tự scale theo
    // `targetSize` (kích thước lớn nhất của model sau scale, mét) rồi đặt tại `position` trên sàn.
    function loadDecorModel(url, position, targetSize) {
      gltfLoader.load(
        url,
        (gltf) => {
          if (modelLoadsCancelled) return
          const model = gltf.scene
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true
              node.receiveShadow = true
              if (Array.isArray(node.material)) node.material.forEach(enhanceMaterial)
              else enhanceMaterial(node.material)
            }
          })
          const box = new THREE.Box3().setFromObject(model)
          const modelSize = new THREE.Vector3()
          box.getSize(modelSize)
          const scale = targetSize / Math.max(modelSize.x, modelSize.y, modelSize.z, 0.0001)
          const center = new THREE.Vector3()
          box.getCenter(center)
          model.scale.setScalar(scale)
          model.position.set(position.x - center.x * scale, -box.min.y * scale, position.z - center.z * scale)
          model.visible = !decorOnlyMode // TASK-139
          decorMeshes.push(model)
          scene.add(model)
        },
        undefined,
        () => {
          // Load lỗi — bỏ qua, đồ trang trí không bắt buộc (không có fallback hình khối).
        }
      )
    }

    // TASK-027: tranh treo tường — đặt lệch về phía dương x trên tường sau, tránh trùng vị trí đồ
    // nội thất thường được đặt ở phía âm x theo heuristic layout ("góc"/"tường" thường lệch trái).
    function addWallArt(accentHex, w, h, l) {
      const pattern = hashSeed(`${room?.id || 'default'}-wallart`) % 3
      const texture = makeWallArtTexture(accentHex, pattern)
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(0.68, 0.88),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 })
      )
      frame.position.set(w * 0.28, h * 0.58, -l / 2 + 0.015)
      frame.visible = !decorOnlyMode // TASK-139
      decorMeshes.push(frame)
      scene.add(frame)

      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.8),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 })
      )
      art.position.set(w * 0.28, h * 0.58, -l / 2 + 0.02)
      art.visible = !decorOnlyMode // TASK-139
      decorMeshes.push(art)
      scene.add(art)
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const resizePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -height / 2)
    let dragging = null
    let resizingAxis = null
    let resizeGrabPoint = null
    let resizeGrabWidth = width
    let resizeGrabLength = length

    function toPointer(evt) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1
    }

    function onPointerDown(evt) {
      pointerDownAt = { x: evt.clientX, y: evt.clientY }
      toPointer(evt)
      raycaster.setFromCamera(pointer, camera)

      // TASK-105: chế độ xem trước khoá đổi kích thước phòng qua chấm đỏ — bỏ qua hẳn hit-test resize.
      if (!previewMode) {
        const resizeHits = raycaster.intersectObjects(resizeHandles)
        if (resizeHits.length > 0) {
          const handle = resizeHits[0].object
          resizingAxis = handle.userData.axis
          controls.enabled = false
          // Lấy đúng vị trí hiện tại của handle (đã nằm sẵn trên resizePlane) làm mốc — tính kích thước
          // mới theo ĐỘ LỆCH (delta) so với mốc này, thay vì gán thẳng toạ độ ray-plane tuyệt đối. Gán
          // thẳng khiến kích thước nhảy vọt bất thường khi điểm bấm chuột không trúng tuyệt đối tâm handle
          // hoặc khi phòng đã lớn (giao điểm ray-plane rất nhạy theo phối cảnh ở khoảng cách xa camera).
          resizeGrabPoint = handle.position.clone()
          resizeGrabWidth = currentWidth
          resizeGrabLength = currentLength
          return
        }
      }

      const hits = raycaster.intersectObjects(draggables)
      if (hits.length > 0) {
        dragging = hits[0].object
        // TASK-105: chế độ xem trước vẫn cho NHẤP CHỌN (đọc bởi onPointerUp qua biến `dragging` này) để
        // xem thông tin món, nhưng KHÔNG khoá `controls`/đặt `dragPlane` — xem đúng nghĩa "chỉ đọc", camera
        // vẫn xoay/pan/zoom bình thường ngay cả khi con trỏ đang ở trên 1 món nội thất.
        // TASK-141: món đã khoá — CÙNG CÁCH xử lý như previewMode (vẫn nhấp-chọn được, không kéo được).
        if (!previewMode && !lockedIndices.has(dragging.userData.index)) {
          controls.enabled = false
          dragPlane.constant = -dragging.position.y
        }
      }
    }

    // TASK-124: chuột phải lên 1 món nội thất mở menu ngữ cảnh (Nhân bản/Xoá/Ẩn-Hiện/Đặt lại vị trí/
    // Phóng to) — tái dùng đúng raycast của `onPointerDown`. Chuột phải vào chỗ trống giữ nguyên hành vi
    // mặc định của trình duyệt (không preventDefault), đúng scope đã ghi trong task.
    function onContextMenu(evt) {
      toPointer(evt)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(draggables)
      if (hits.length === 0) return
      evt.preventDefault()
      selectMesh(hits[0].object)
      setContextMenu({ index: hits[0].object.userData.index, x: evt.clientX, y: evt.clientY })
    }

    function onPointerMove(evt) {
      if (resizingAxis) {
        toPointer(evt)
        raycaster.setFromCamera(pointer, camera)
        const point = new THREE.Vector3()
        if (raycaster.ray.intersectPlane(resizePlane, point) && resizeGrabPoint) {
          if (resizingAxis === 'width') {
            const delta = (point.x - resizeGrabPoint.x) * 2
            currentWidth = THREE.MathUtils.clamp(resizeGrabWidth + delta, MIN_ROOM_METERS, MAX_ROOM_METERS)
            resizeHandles.find((h) => h.userData.axis === 'width').position.x = currentWidth / 2
          } else {
            const delta = (point.z - resizeGrabPoint.z) * 2
            currentLength = THREE.MathUtils.clamp(resizeGrabLength + delta, MIN_ROOM_METERS, MAX_ROOM_METERS)
            resizeHandles.find((h) => h.userData.axis === 'length').position.z = currentLength / 2
          }
          updateResizePreview(currentWidth, currentLength)
          setPreviewDims({ width: currentWidth, length: currentLength })
        }
        return
      }

      if (!dragging || previewMode || lockedIndices.has(dragging.userData.index)) {
        // TASK-035: không kéo/resize gì — chỉ cập nhật viền hover theo món nội thất dưới con trỏ.
        // TASK-105: `dragging` có thể khác null ngay cả ở chế độ xem trước (đặt ở onPointerDown để giữ
        // nhấp-chọn hoạt động) — rơi vào đúng nhánh hover-only này, không bao giờ chạm nhánh đổi vị trí
        // TASK-141: món đã khoá cũng rơi vào đúng nhánh này — không bao giờ đổi vị trí thật.
        // thật bên dưới.
        // TASK-128: không đang kéo thật — đảm bảo đường dẫn hướng không sót lại từ lần kéo trước.
        hideAlignGuides()
        setDragWallDistance(null) // TASK-133: không đang kéo thật — ẩn dòng khoảng cách tới tường.
        dragFloorHighlight.visible = false // TASK-141: không đang kéo thật — ẩn highlight sàn.
        toPointer(evt)
        raycaster.setFromCamera(pointer, camera)
        const hoverHits = raycaster.intersectObjects(draggables)
        if (hoverHits.length > 0) {
          const hovered = hoverHits[0].object
          const p = hovered.geometry.parameters
          hoverOutline.scale.set(p.width * 1.08, p.height * 1.08, p.depth * 1.08)
          hoverOutline.position.copy(hovered.position)
          hoverOutline.rotation.copy(hovered.rotation)
          hoverOutline.material.color.set(0xffffff)
          hoverOutline.visible = true
          renderer.domElement.style.cursor = 'grab'
          // TASK-139: tên món hiện gần con trỏ khi hover — khác nhãn nổi luôn-hiện (TASK-025/063, tắt
          // được qua "Ẩn nhãn") và khác context menu, chỉ xuất hiện đúng lúc rê chuột qua.
          setHoveredItemName(localFurniture[hovered.userData.index]?.name || 'Nội thất')
          setHoverScreenPos({ x: evt.clientX, y: evt.clientY })
        } else {
          hoverOutline.visible = false
          renderer.domElement.style.cursor = 'default'
          setHoveredItemName(null)
        }
        return
      }
      toPointer(evt)
      raycaster.setFromCamera(pointer, camera)
      const point = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(dragPlane, point)) {
        const halfW = width / 2 - 0.3
        const halfL = length / 2 - 0.3
        let nextX = THREE.MathUtils.clamp(point.x, -halfW, halfW)
        let nextZ = THREE.MathUtils.clamp(point.z, -halfL, halfL)
        // TASK-117: làm tròn về lưới SAU khi đã kẹp biên phòng, để giá trị snap cuối cùng không bao giờ
        // vượt ra ngoài phòng dù điểm gần nhất trên lưới nằm sát biên.
        if (snapStep > 0) {
          nextX = Math.round(nextX / snapStep) * snapStep
          nextZ = Math.round(nextZ / snapStep) * snapStep
        }
        dragging.position.x = nextX
        dragging.position.z = nextZ
        dragging.userData.label?.position.set(dragging.position.x, dragging.position.y + 0.6, dragging.position.z)
        hoverOutline.position.copy(dragging.position)
        hoverOutline.material.color.set(overlapsAnother(dragging) ? 0xc4433d : 0xffffff)
        if (selectedMesh === dragging) syncSelectionOutline()
        // TASK-128: cập nhật đường dẫn hướng SAU khi đã áp dụng snap — phản ánh đúng vị trí cuối cùng.
        updateAlignGuides(dragging, nextX, nextZ)
        // TASK-133: khoảng cách tới 2 mặt tường thật, đặt tại x=-width/2 (leftWall) và z=-length/2
        // (backWall) — cùng công thức nextX/nextZ đã kẹp biên + áp snap ở trên.
        setDragWallDistance({ toLeft: nextX + width / 2, toBack: nextZ + length / 2 })
        // TASK-138: đồng bộ vị trí hiển thị theo thời gian thực lúc kéo.
        if (selectedMesh === dragging) setSelectedPosition({ x: Math.round(nextX * 10) / 10, z: Math.round(nextZ * 10) / 10 })
        // TASK-141: highlight vùng sàn ngay dưới món đang kéo — kích thước khớp đúng footprint món (width×depth).
        const draggedSize = dragging.geometry.parameters
        dragFloorHighlight.scale.set(draggedSize.width, draggedSize.depth, 1)
        dragFloorHighlight.position.set(nextX, 0.015, nextZ)
        dragFloorHighlight.visible = true
      }
    }

    function onPointerLeave() {
      hoverOutline.visible = false
      renderer.domElement.style.cursor = 'default'
      pointerOverCanvas = false
      setHoveredItemName(null) // TASK-139: chuột rời khỏi canvas — ẩn tên đang hiện (nếu có).
    }

    function onPointerEnter() {
      pointerOverCanvas = true
    }

    // TASK-114: xoay/zoom camera bằng phím mũi tên + +/- + R — CHỈ khi KHÔNG có món nào đang chọn (nếu
    // có món đang chọn, phím mũi tên giữ nguyên hành vi cũ TASK-040 là di chuyển món đó, không đổi).
    const CAMERA_KEY_ORBIT_STEP = Math.PI / 18 // 10°/lần bấm
    function orbitCameraHorizontal(angleRad) {
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target)
      const cos = Math.cos(angleRad)
      const sin = Math.sin(angleRad)
      const x = offset.x * cos - offset.z * sin
      const z = offset.x * sin + offset.z * cos
      offset.x = x
      offset.z = z
      camera.position.copy(controls.target).add(offset)
      controls.update()
    }
    function dollyCamera(factor) {
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target).multiplyScalar(factor)
      camera.position.copy(controls.target).add(offset)
      controls.update()
    }

    // TASK-040: phím tắt chỉ hoạt động khi chuột đang ở trên canvas 3D (tránh chặn nhầm Backspace/phím
    // mũi tên khi user đang thao tác ở nơi khác của trang, vd gõ trong 1 ô input).
    function onKeyDown(evt) {
      if (!pointerOverCanvas || previewMode) return
      if (!selectedMesh) {
        // TASK-114: chưa chọn món nào — phím mũi tên/+-/R điều khiển camera thay vì di chuyển món.
        if (evt.key === 'ArrowLeft') {
          evt.preventDefault()
          orbitCameraHorizontal(-CAMERA_KEY_ORBIT_STEP)
        } else if (evt.key === 'ArrowRight') {
          evt.preventDefault()
          orbitCameraHorizontal(CAMERA_KEY_ORBIT_STEP)
        } else if (evt.key === 'ArrowUp') {
          evt.preventDefault()
          dollyCamera(0.9)
        } else if (evt.key === 'ArrowDown') {
          evt.preventDefault()
          dollyCamera(1.1)
        } else if (evt.key === 'a' || evt.key === 'A') {
          // TASK-139: WASD làm THÊM cho phím mũi tên (không thay), thân thiện hơn với người quen điều
          // khiển kiểu game — ánh xạ đúng y hệt: a≈Trái, d≈Phải, w≈Lên(zoom vào), s≈Xuống(zoom ra).
          evt.preventDefault()
          orbitCameraHorizontal(-CAMERA_KEY_ORBIT_STEP)
        } else if (evt.key === 'd' || evt.key === 'D') {
          evt.preventDefault()
          orbitCameraHorizontal(CAMERA_KEY_ORBIT_STEP)
        } else if (evt.key === 'w' || evt.key === 'W') {
          evt.preventDefault()
          dollyCamera(0.9)
        } else if (evt.key === 's' || evt.key === 'S') {
          evt.preventDefault()
          dollyCamera(1.1)
        } else if (evt.key === '+' || evt.key === '=') {
          evt.preventDefault()
          dollyCamera(0.9)
        } else if (evt.key === '-' || evt.key === '_') {
          evt.preventDefault()
          dollyCamera(1.1)
        } else if (evt.key === 'r' || evt.key === 'R') {
          evt.preventDefault()
          resetView()
        }
        return
      }
      const step = 0.1
      const halfW = width / 2 - 0.3
      const halfL = length / 2 - 0.3
      // TASK-141: món đã khoá — chặn ĐÚNG các phím đổi vị trí/góc xoay (không chặn Delete/Backspace,
      // giữ đúng phạm vi hẹp "chỉ chặn kéo/xoay nhầm" của ý tưởng gốc).
      const isTransformKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'q', 'Q', 'e', 'E'].includes(evt.key)
      if (isTransformKey && lockedIndices.has(selectedMesh.userData.index)) return
      if (evt.key === 'Delete' || evt.key === 'Backspace') {
        evt.preventDefault()
        const idx = selectedMesh.userData.index
        selectMesh(null)
        removeFurniture(idx)
      } else if (evt.key === 'ArrowLeft') {
        evt.preventDefault()
        selectedMesh.position.x = THREE.MathUtils.clamp(selectedMesh.position.x - step, -halfW, halfW)
      } else if (evt.key === 'ArrowRight') {
        evt.preventDefault()
        selectedMesh.position.x = THREE.MathUtils.clamp(selectedMesh.position.x + step, -halfW, halfW)
      } else if (evt.key === 'ArrowUp') {
        evt.preventDefault()
        selectedMesh.position.z = THREE.MathUtils.clamp(selectedMesh.position.z - step, -halfL, halfL)
      } else if (evt.key === 'ArrowDown') {
        evt.preventDefault()
        selectedMesh.position.z = THREE.MathUtils.clamp(selectedMesh.position.z + step, -halfL, halfL)
      } else if (evt.key === 'q' || evt.key === 'Q') {
        // TASK-042: xoay tinh 15°/lần — bổ sung cho nhấp đúp xoay 90° (TASK-034) khi cần góc lệch nhỏ hơn.
        evt.preventDefault()
        selectedMesh.rotation.y -= Math.PI / 12
      } else if (evt.key === 'e' || evt.key === 'E') {
        evt.preventDefault()
        selectedMesh.rotation.y += Math.PI / 12
      } else {
        return
      }
      if (selectedMesh) {
        selectedMesh.userData.label?.position.set(selectedMesh.position.x, selectedMesh.position.y + 0.6, selectedMesh.position.z)
        syncSelectionOutline()
        setSelectedRotationDeg(rotationRadToDeg(selectedMesh.rotation.y)) // TASK-135
        setSelectedPosition({ x: Math.round(selectedMesh.position.x * 10) / 10, z: Math.round(selectedMesh.position.z * 10) / 10 }) // TASK-138
      }
    }

    // TASK-075: cùng logic xoay 15°/lần của phím Q/E ở trên, gọi được từ nút React bên ngoài canvas.
    rotateSelectedRef.current = (direction) => {
      if (!selectedMesh || lockedIndices.has(selectedMesh.userData.index)) return // TASK-141
      selectedMesh.rotation.y += direction === 'left' ? -Math.PI / 12 : Math.PI / 12
      selectedMesh.userData.label?.position.set(selectedMesh.position.x, selectedMesh.position.y + 0.6, selectedMesh.position.z)
      syncSelectionOutline()
      setSelectedRotationDeg(rotationRadToDeg(selectedMesh.rotation.y)) // TASK-135
    }

    // TASK-116: đặt lại đúng vị trí (tính từ `resolveFurniturePositions`, cùng nguồn sự thật với vị trí
    // ban đầu lúc dựng scene) + góc xoay mặc định 0° cho món đang chọn — không đụng món khác.
    // TASK-143: bật/tắt xuyên nhẹ CHỈ cho món đang chọn — KHÔNG gate bởi `lockedIndices` (khoá vị trí/góc
    // xoay không liên quan gì tới xem xuyên, khác các ref-delegation khác ở dưới đều đổi transform thật).
    toggleXrayRef.current = () => {
      if (!selectedMesh) return
      if (xrayedMesh) {
        setMeshXray(xrayedMesh, false)
        xrayedMesh = null
        setXrayEnabled(false)
      } else {
        setMeshXray(selectedMesh, true)
        xrayedMesh = selectedMesh
        setXrayEnabled(true)
      }
    }

    resetTransformRef.current = () => {
      if (!selectedMesh || lockedIndices.has(selectedMesh.userData.index)) return // TASK-141
      const index = selectedMesh.userData.index
      const pos = furniturePositions[index]
      if (!pos) return
      const size = furnitureSize(localFurniture[index]?.category)
      selectedMesh.position.set(pos.x, size.h / 2, pos.z)
      selectedMesh.rotation.y = 0
      selectedMesh.userData.label?.position.set(pos.x, size.h / 2 + 0.6, pos.z)
      syncSelectionOutline()
      setSelectedRotationDeg(0) // TASK-135
      setSelectedPosition({ x: Math.round(pos.x * 10) / 10, z: Math.round(pos.z * 10) / 10 }) // TASK-138
    }

    // TASK-135: đưa món đang chọn về tâm mặt bằng phòng (x=0,z=0), GIỮ NGUYÊN góc xoay — khác
    // `resetTransformRef` ở trên (đưa về vị trí tính toán ban đầu + góc xoay 0°). KHÔNG gọi
    // `pushHistory` — đúng quyết định kiến trúc từ TASK-028/102/116: vị trí/góc xoay kéo-thả không
    // theo dõi trong state React nên không có gì để Undo/Redo khôi phục lại cho đúng.
    centerSelectedRef.current = () => {
      if (!selectedMesh || lockedIndices.has(selectedMesh.userData.index)) return // TASK-141
      selectedMesh.position.x = 0
      selectedMesh.position.z = 0
      selectedMesh.userData.label?.position.set(0, selectedMesh.position.y + 0.6, 0)
      syncSelectionOutline()
      setSelectedPosition({ x: 0, z: 0 }) // TASK-138
    }

    // TASK-137: gán thẳng góc xoay (độ, kẹp 0-359) cho món đang chọn từ ô nhập số ngoài canvas.
    setRotationRef.current = (deg) => {
      if (!selectedMesh || lockedIndices.has(selectedMesh.userData.index)) return // TASK-141
      const clamped = ((Math.round(deg) % 360) + 360) % 360
      selectedMesh.rotation.y = THREE.MathUtils.degToRad(clamped)
      syncSelectionOutline()
      setSelectedRotationDeg(clamped)
    }

    // TASK-109: chọn 1 món từ danh sách React bằng index — món ĐANG HIỆN có mesh thật trong `draggables`
    // nên dùng lại đúng `selectMesh` (vẽ viền chọn như chọn bằng click 3D). Món ĐANG ẨN không có mesh để
    // raycast/vẽ viền — vẫn cho chọn được (để xem thông tin/đổi màu trước khi hiện lại) bằng cách cập
    // nhật thẳng state, bỏ qua viền 3D.
    selectMeshRef.current = (index) => {
      const mesh = draggables.find((m) => m.userData.index === index)
      if (mesh) {
        selectMesh(mesh)
        return
      }
      selectedMesh = null
      if (selectionOutline) selectionOutline.visible = false
      selectedIndexRef.current = index
      setSelectedFurnitureIndex(index)
    }

    function onPointerUp(evt) {
      // TASK-040: coi là "nhấp chọn" khi chuột gần như không di chuyển giữa lúc nhấn và thả (phân biệt
      // với kéo-thả đổi vị trí) — nhấp vào món nào thì chọn món đó, nhấp ra chỗ trống thì bỏ chọn.
      const moved = pointerDownAt ? Math.hypot(evt.clientX - pointerDownAt.x, evt.clientY - pointerDownAt.y) : Infinity
      if (!resizingAxis && moved < 5) selectMesh(dragging || null)
      pointerDownAt = null
      hideAlignGuides() // TASK-128: kết thúc kéo — không để đường dẫn hướng sót lại trên màn hình.
      setDragWallDistance(null) // TASK-133: kết thúc kéo — không để dòng khoảng cách tới tường sót lại.
      dragFloorHighlight.visible = false // TASK-141: kết thúc kéo — không để highlight sàn sót lại.

      if (resizingAxis) {
        resizingAxis = null
        resizeGrabPoint = null
        controls.enabled = !cameraLocked // TASK-143: không tự mở khoá nhầm nếu camera đang bị khoá thủ công
        if (resizePreview) {
          scene.remove(resizePreview)
          resizePreview.geometry.dispose()
          resizePreview = null
        }
        setPreviewDims(null)
        if (room?.id && (currentWidth !== width || currentLength !== length)) {
          roomApi.update(room.id, { widthMeters: currentWidth, lengthMeters: currentLength })
            .then((updatedRoom) => {
              setResizeError(null)
              onRoomResized?.(updatedRoom)
            })
            .catch(() => {
              setResizeError('Không lưu được kích thước mới, thử lại.')
              setResetSignal((n) => n + 1) // rebuild lại theo kích thước đã lưu trước đó (rollback)
            })
        }
        return
      }

      dragging = null
      controls.enabled = !cameraLocked // TASK-143: không tự mở khoá nhầm nếu camera đang bị khoá thủ công
    }

    // TASK-034: nhấp đúp 1 món nội thất để xoay 90° — cùng mức "chỉ trong phiên xem" như kéo-thả đổi
    // vị trí (không lưu lại, mất khi rebuild scene vì lý do khác như đổi màu/tab).
    function onDoubleClick(evt) {
      if (previewMode) return
      toPointer(evt)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(draggables)
      // TASK-141: món đã khoá — chặn xoay nhấp đúp, kể cả khi chưa được chọn (nhấp đúp xoay bất kỳ món
      // nào bị raycast trúng, không riêng `selectedMesh`).
      if (hits.length > 0 && !lockedIndices.has(hits[0].object.userData.index)) {
        hits[0].object.rotation.y += Math.PI / 2
        if (selectedMesh === hits[0].object) {
          syncSelectionOutline()
          setSelectedRotationDeg(rotationRadToDeg(hits[0].object.rotation.y)) // TASK-135
        }
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)
    renderer.domElement.addEventListener('pointerenter', onPointerEnter)
    renderer.domElement.addEventListener('contextmenu', onContextMenu)
    renderer.domElement.addEventListener('dblclick', onDoubleClick)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKeyDown)

    let frameId
    function animate() {
      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    // Đọc clientWidth/clientHeight thật của mount thay vì hằng số cố định, vì kích thước đổi khi vào/ra
    // chế độ toàn màn hình (TASK-025, `.room3d-mount:fullscreen` trong styles.css đổi height qua CSS).
    function handleResize() {
      const w = mount.clientWidth || containerWidth
      const h = mount.clientHeight || VIEWPORT_HEIGHT
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    handleResizeRef.current = handleResize
    window.addEventListener('resize', handleResize)
    document.addEventListener('fullscreenchange', handleResize)
    // Gọi lại ngay sau khi dựng scene: camera/renderer ở trên được tạo với `VIEWPORT_HEIGHT` cố định
    // (kích thước mặc định lúc chưa fullscreen). Nếu đang ở chế độ toàn màn hình khi effect này chạy
    // lại (vd sau khi lưu kích thước phòng thành công → `room` prop đổi → toàn bộ effect rebuild từ
    // đầu), scene mới dựng sẽ bị sai kích thước (nhỏ/méo) cho đến khi có sự kiện resize khác — gọi
    // ngay 1 lần ở đây để khớp đúng kích thước mount hiện tại (fullscreen hay không) ngay lập tức.
    handleResize()

    return () => {
      modelLoadsCancelled = true
      if (resizePreview) {
        scene.remove(resizePreview)
        resizePreview.geometry.dispose()
      }
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('fullscreenchange', handleResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      renderer.domElement.removeEventListener('pointerenter', onPointerEnter)
      renderer.domElement.removeEventListener('contextmenu', onContextMenu)
      renderer.domElement.removeEventListener('dblclick', onDoubleClick)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      rotateSelectedRef.current = () => {}
      resetTransformRef.current = () => {}
      centerSelectedRef.current = () => {}
      setRotationRef.current = () => {}
      toggleXrayRef.current = () => {}
      // TASK-139: chụp lại camera trước khi dispose — đọc trong lần effect KẾ TIẾP để quyết định giữ
      // nguyên hay dùng khung hình mặc định (xem giải thích đầy đủ ở khai báo `prevCameraStateRef`).
      prevCameraStateRef.current = { position: camera.position.clone(), target: controls.target.clone(), roomId: room?.id }
      // TASK-142: chụp lại vị trí/góc xoay TỪNG món nội thất trước khi mesh bị dispose — đọc trong lần
      // effect KẾ TIẾP (nếu `localFurniture` không đổi tham chiếu) để không mất chỉnh sửa chưa lưu.
      // BỎ QUA nếu `skipTransformCaptureRef` đã được đặt (vd "Đặt lại bố trí" — xem giải thích đầy đủ ở
      // khai báo cờ này) — xoá sạch thay vì chụp lại giá trị cũ.
      if (skipTransformCaptureRef.current) {
        transformOverridesRef.current = {}
        skipTransformCaptureRef.current = false
      } else {
        const capturedTransforms = {}
        meshesForTransformCapture.forEach((m) => {
          capturedTransforms[m.userData.index] = { x: m.position.x, z: m.position.z, rotationY: m.rotation.y }
        })
        transformOverridesRef.current = capturedTransforms
      }
      prevLocalFurnitureRef.current = localFurniture
      controls.dispose()
      renderer.dispose()
      mount.innerHTML = ''
      cameraRef.current = null
      controlsRef.current = null
      rendererRef.current = null
      sceneRef.current = null
      handleResizeRef.current = () => {}
      setSelectedFurnitureIndex(null)
      setContextMenu(null)
    }
  }, [tab, room, localFurniture, colors, resetSignal, colorOverrides, lightingMode, itemColorOverrides, showLabels, previewMode, hiddenIndices, snapStep, showRoomSurfaces, wireframeMode, cameraSpeed, shadowsEnabled, brightnessLevel, decorOnlyMode, lockedIndices, isIsolating, showGrid, justAddedIndex, cameraLocked])

  // TASK-069: phím "/" focus nhanh ô tìm kiếm loại đồ (TASK-065) — chỉ hoạt động khi đang ở tab 3D và
  // KHÔNG đang gõ trong 1 ô input/textarea khác (tránh chặn nhầm dấu "/" hợp lệ khi đang nhập liệu, cùng
  // tinh thần thận trọng với phím tắt như TASK-040 gate theo pointerOverCanvas).
  // TASK-102: Ctrl/Cmd+Z (Hoàn tác) và Ctrl/Cmd+Shift+Z hoặc Ctrl/Cmd+Y (Làm lại) — cùng effect vì cùng
  // kiểu gate (tab 3D + không đang gõ trong input khác, tránh chặn nhầm Ctrl+Z của trình duyệt/ô nhập text).
  useEffect(() => {
    function onGlobalKeyDown(evt) {
      if (tab !== '3d') return
      const target = evt.target
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (evt.key === '/' && !isTyping) {
        evt.preventDefault()
        furnitureSearchInputRef.current?.focus()
        return
      }
      const ctrlOrCmd = evt.ctrlKey || evt.metaKey
      // TASK-105: chế độ xem trước khoá luôn cả Hoàn tác/Làm lại qua phím tắt (đồng nhất với 2 nút đã bị
      // `disabled` trong fieldset — tránh đường vòng qua phím Ctrl+Z/Y né được khoá ở UI).
      if (!ctrlOrCmd || isTyping || previewMode) return
      if (evt.key === 'z' || evt.key === 'Z') {
        evt.preventDefault()
        if (evt.shiftKey) redo()
        else undo()
      } else if (evt.key === 'y' || evt.key === 'Y') {
        evt.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onGlobalKeyDown)
    return () => window.removeEventListener('keydown', onGlobalKeyDown)
  }, [tab, history, redoStack, localFurniture, itemColorOverrides, colorOverrides, previewMode])

  return (
    <div>
      {/* TASK-036: khối tương tác (tab + nội dung đang chọn) chỉ ẩn khi in — khác với trước đây (ẩn
          nguyên component ở DesignResult.jsx), vì bên dưới có thêm 1 bản sơ đồ mặt bằng LUÔN render
          (ẩn trên màn hình, chỉ hiện khi in) để trang in luôn có sơ đồ 2D bất kể tab nào đang mở. */}
      <div className="no-print">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" className={tab === '3d' ? undefined : 'secondary'} onClick={() => setTab('3d')}>
            Không gian 3D
          </button>
          <button type="button" className={tab === '2d' ? undefined : 'secondary'} onClick={() => setTab('2d')}>
            Ảnh AI (2D)
          </button>
          <button type="button" className={tab === 'plan' ? undefined : 'secondary'} onClick={() => setTab('plan')}>
            Sơ đồ mặt bằng
          </button>
        </div>

      {tab === 'plan' ? (
        // TASK-060: dùng `selectedIndexRef.current` (không phải state `selectedFurnitureIndex`) — state
        // bị reset về null mỗi khi effect dựng scene 3D cleanup (kể cả khi chỉ đổi tab, không đổi món
        // nào), trong khi ref vẫn giữ đúng giá trị đã chọn xuyên suốt, kể cả lúc tab '3d' không mount.
        <Room2DPlan room={room} furniture={localFurniture} selectedIndex={selectedIndexRef.current} />
      ) : tab === '3d' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
            {/* TASK-118: 5 nút góc nhìn camera gộp vào 1 dropdown — trước đó luôn hiện cả 5, chiếm nhiều
                chỗ nhất trong 17 nút cũ dù không phải thao tác dùng liên tục. */}
            <span className="room3d-dropdown" ref={cameraMenuRef}>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowCameraMenu((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={showCameraMenu}
              >
                📷 Góc nhìn ▾
              </button>
              {showCameraMenu && (
                <span className="room3d-dropdown__menu">
                  <button type="button" onClick={() => { setTopView(); setShowCameraMenu(false) }} title="Nhìn thẳng từ trên xuống, tiện kiểm tra bố cục tổng thể">
                    ⬆ Nhìn từ trên
                  </button>
                  <button type="button" onClick={() => { setFrontView(); setShowCameraMenu(false) }} title="Nhìn thẳng vào 1 mặt tường, tiện kiểm tra bố trí tường/tranh treo">
                    ↑ Nhìn từ trước
                  </button>
                  <button type="button" onClick={() => { setSideView(); setShowCameraMenu(false) }} title="Nhìn vuông góc với mặt trước, tiện kiểm tra chiều sâu bố trí nội thất">
                    → Nhìn từ bên
                  </button>
                  <button type="button" onClick={() => { setWalkthroughView(); setShowCameraMenu(false) }} title="Góc nhìn ngang tầm mắt, như đang đứng trong phòng">
                    🚶 Góc nhìn đi bộ
                  </button>
                  <button type="button" onClick={() => { resetView(); setShowCameraMenu(false) }} title="Về hẳn góc nhìn mặc định ban đầu (khoảng cách/góc cố định)">
                    ↺ Đặt lại góc nhìn
                  </button>
                  <button type="button" onClick={() => { focusAll(); setShowCameraMenu(false) }} title="Canh khung hình sát đúng khu vực có nội thất hiện có">
                    🔭 Xem toàn bộ
                  </button>
                  {/* TASK-138: khác "🎯 Về tâm phòng" (TASK-135, di chuyển NỘI THẤT) — đây di chuyển CAMERA. */}
                  <button type="button" onClick={() => { centerView(); setShowCameraMenu(false) }} title="Đưa điểm nhìn về giữa phòng, GIỮ NGUYÊN khoảng cách/góc nhìn hiện tại (khác Đặt lại góc nhìn)">
                    🧭 Về giữa phòng
                  </button>
                </span>
              )}
            </span>
            <button
              type="button"
              className="secondary"
              onClick={toggleAutoRotate}
              aria-pressed={isAutoRotating}
              title="Tự động xoay quanh phòng liên tục, không cần giữ chuột kéo"
            >
              {isAutoRotating ? '⏸ Dừng tự xoay' : '🔄 Tự động xoay 360°'}
            </button>
            {/* TASK-118: 4 nút thao tác món đang chọn CHỈ hiện khi ĐÃ chọn 1 món — trước đó luôn hiện cả 4
                nhưng bị disabled + báo "Nhấp chọn 1 món trong scene trước" khi chưa chọn, nên ẩn hẳn khi
                không dùng được không mất chức năng gì, chỉ đỡ chiếm chỗ lúc mặc định chưa chọn món nào. */}
            {selectedFurnitureIndex != null && (
              <>
                <button type="button" className="secondary" onClick={focusOnSelected} title="Camera phóng to, canh giữa đúng vào món đang chọn">
                  🔍 Phóng to món đã chọn
                </button>
                {/* TASK-141: khoá món đang chọn — không kéo/xoay được (nhầm lẫn), vẫn chọn/xem/đổi màu/xoá
                    được bình thường. Không disabled bởi previewMode (Preview đã khoá TOÀN BỘ chỉnh sửa
                    rồi, khoá riêng từng món không cần thiết khi đang ở Preview). */}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => toggleLock(selectedFurnitureIndex)}
                  title="Khoá vị trí/góc xoay món này — vẫn chọn/xem/đổi màu/xoá được bình thường"
                >
                  {lockedIndices.has(selectedFurnitureIndex) ? '🔓 Mở khoá' : '🔒 Khoá món này'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={toggleIsolate}
                  title={isIsolating ? 'Hiện lại tất cả nội thất' : 'Tạm ẩn mọi món khác, chỉ giữ món đang chọn'}
                >
                  {isIsolating ? '↩️ Hiện lại tất cả' : '🔎 Cô lập món này'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => toggleXrayRef.current()}
                  title="Xem xuyên nhẹ CHỈ món đang chọn (không ẩn/khoá), giúp kiểm tra vị trí bên trong scene"
                >
                  {xrayEnabled ? '👻 Tắt xuyên nhẹ' : '👻 Xuyên nhẹ'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => rotateSelected('left')}
                  disabled={previewMode || lockedIndices.has(selectedFurnitureIndex)}
                  title="Xoay trái 15° (giống phím Q)"
                >
                  ↺ Xoay trái 15°
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => rotateSelected('right')}
                  disabled={previewMode || lockedIndices.has(selectedFurnitureIndex)}
                  title="Xoay phải 15° (giống phím E)"
                >
                  ↻ Xoay phải 15°
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={resetSelectedTransform}
                  disabled={previewMode || lockedIndices.has(selectedFurnitureIndex)}
                  title="Đưa món đang chọn về đúng vị trí/góc xoay ban đầu, không ảnh hưởng món khác"
                >
                  ↺ Đặt lại vị trí/góc xoay
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={centerSelected}
                  disabled={previewMode || lockedIndices.has(selectedFurnitureIndex)}
                  title="Đưa món đang chọn về đúng tâm mặt bằng phòng, giữ nguyên góc xoay"
                >
                  🎯 Về tâm phòng
                </button>
                <span className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  📐 Góc xoay:
                  <input
                    type="number"
                    min="0"
                    max="359"
                    value={selectedRotationDeg}
                    disabled={previewMode || lockedIndices.has(selectedFurnitureIndex)}
                    onChange={(e) => setSelectedRotationInput(Number(e.target.value))}
                    style={{ width: 56 }}
                    aria-label="Nhập góc xoay (độ) cho món đang chọn"
                  />
                  °
                </span>
                {/* TASK-138: chỉ đọc — bổ sung cho Góc xoay, giúp biết chính xác vị trí thay vì áng chừng. */}
                {selectedPosition && (
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    📍 Vị trí: ({selectedPosition.x}, {selectedPosition.z})m
                  </span>
                )}
                {/* TASK-143: chỉ đọc — kích thước xấp xỉ theo nhóm nội thất, đúng bảng `furnitureSize()` đã dùng để dựng mesh. */}
                {selectedFurnitureIndex != null && localFurniture[selectedFurnitureIndex] && (() => {
                  const size = furnitureSize(localFurniture[selectedFurnitureIndex].category)
                  return (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      📏 Kích thước: {size.w}×{size.d}×{size.h}m
                    </span>
                  )
                })()}
              </>
            )}
            <button type="button" className="secondary" onClick={toggleFullscreen}>
              ⛶ Toàn màn hình
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setLightingMode((prev) => (prev === 'day' ? 'evening' : 'day'))}
            >
              {lightingMode === 'evening' ? '☀️ Ban ngày' : '🌙 Buổi tối'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setPreviewMode((prev) => !prev)}
              aria-pressed={previewMode}
              title={previewMode ? 'Đang xem trước — mọi chỉnh sửa bị khoá, bấm để mở khoá' : 'Khoá mọi chỉnh sửa để xem lại an toàn, không sợ bấm nhầm'}
            >
              {previewMode ? '🔓 Chế độ chỉnh sửa' : '🔒 Chế độ xem trước'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={toggleLabels}
              title="Ẩn/hiện nhãn tên + giá nổi trên mỗi món nội thất"
            >
              {showLabels ? '🏷️ Ẩn nhãn' : '🏷️ Hiện nhãn'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setSnapStep((prev) => (prev === 0 ? 0.1 : prev === 0.1 ? 0.25 : 0))}
              title="Làm tròn vị trí về lưới khi kéo-thả nội thất bằng chuột, giúp căn hàng thẳng dễ hơn"
            >
              {snapStep === 0 ? '🧲 Snap: Tắt' : `🧲 Snap: ${snapStep}m`}
            </button>
            {/* TASK-118: 2 tiện ích dùng không thường xuyên (Tải ảnh, Phím tắt) gộp vào dropdown "⋯ Thêm". */}
            <span className="room3d-dropdown" ref={moreMenuRef}>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={showMoreMenu}
              >
                ⋯ Thêm ▾
              </button>
              {showMoreMenu && (
                <span className="room3d-dropdown__menu">
                  {/* TASK-121: 3 mức độ phân giải thay 1 nút "Tải ảnh" cũ — mỗi mức gọi thẳng
                      `captureScreenshot(multiplier)`, không cần bước chọn trung gian. */}
                  <button type="button" onClick={() => { captureScreenshot(1); setShowMoreMenu(false) }}>
                    📷 Tải ảnh (Chuẩn)
                  </button>
                  <button type="button" onClick={() => { captureScreenshot(2); setShowMoreMenu(false) }}>
                    📷 Tải ảnh (Cao — 2x)
                  </button>
                  <button type="button" onClick={() => { captureScreenshot(3); setShowMoreMenu(false) }}>
                    📷 Tải ảnh (Ultra — 3x)
                  </button>
                  {/* TASK-136: "Sao chép ảnh" — KHÔNG đóng dropdown ngay để user thấy phản hồi thành
                      công/lỗi ngay cạnh nút, tự đóng lại sau khi bấm lần tiếp theo/click ra ngoài. */}
                  <button type="button" onClick={copyScreenshotToClipboard}>
                    📋 Sao chép ảnh{copyImageStatus === 'success' ? ' ✓' : copyImageStatus === 'error' ? ' (lỗi)' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowShortcutsHelp((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    ❓ Phím tắt
                  </button>
                  {/* TASK-131: tạm ẩn tường/sàn để nhìn nội thất rõ hơn — không đặt top-level, tránh
                      tái diễn "quá nhiều nút" đã sửa ở TASK-118. */}
                  <button
                    type="button"
                    onClick={() => { setShowRoomSurfaces((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {showRoomSurfaces ? '🧱 Ẩn tường/sàn' : '🧱 Hiện tường/sàn'}
                  </button>
                  {/* TASK-136: chế độ khung dây — chỉ áp cho nội thất, không áp tường/sàn/trần. */}
                  <button
                    type="button"
                    onClick={() => { setWireframeMode((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {wireframeMode ? '🧊 Chế độ đặc' : '🔲 Chế độ khung dây'}
                  </button>
                  {/* TASK-136: tuần hoàn 3 mức tốc độ camera, giống cách `snapStep` tuần hoàn ở toolbar chính. */}
                  <button
                    type="button"
                    onClick={() => {
                      setCameraSpeed((prev) => (prev === 'slow' ? 'normal' : prev === 'normal' ? 'fast' : 'slow'))
                      setShowMoreMenu(false)
                    }}
                  >
                    {cameraSpeed === 'slow' ? '🐢 Tốc độ camera: Chậm' : cameraSpeed === 'fast' ? '🐇 Tốc độ camera: Nhanh' : '🚶 Tốc độ camera: Bình thường'}
                  </button>
                  {/* TASK-137: tắt bóng đổ toàn scene — giúp nhìn hình khối rõ hơn khi phòng đông món. */}
                  <button
                    type="button"
                    onClick={() => { setShadowsEnabled((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {shadowsEnabled ? '🌑 Tắt bóng đổ' : '☀️ Bật bóng đổ'}
                  </button>
                  {/* TASK-137: 5 mức độ sáng, tuần hoàn — độc lập với toggle Ngày/Đêm (lightingMode). */}
                  <button
                    type="button"
                    onClick={() => { setBrightnessLevel((prev) => (prev + 1) % 5); setShowMoreMenu(false) }}
                  >
                    {['🔅 Độ sáng: Rất tối', '🔅 Độ sáng: Tối', '💡 Độ sáng: Bình thường', '🔆 Độ sáng: Sáng', '🔆 Độ sáng: Rất sáng'][brightnessLevel]}
                  </button>
                  {/* TASK-139: ẩn đồ trang trí phụ (thảm/chậu cây/tranh tường), giữ nội thất chính. */}
                  <button
                    type="button"
                    onClick={() => { setDecorOnlyMode((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {decorOnlyMode ? '🖼️ Hiện đồ trang trí' : '🪴 Chỉ nội thất'}
                  </button>
                  {/* TASK-141: lưới 3D trên mặt sàn — độc lập với Snap-to-Grid (TASK-117). */}
                  <button
                    type="button"
                    onClick={() => { setShowGrid((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {showGrid ? '▦ Ẩn lưới sàn' : '▦ Hiện lưới sàn'}
                  </button>
                  {/* TASK-143: khoá OrbitControls — tránh vô tình xoay/pan/zoom lúc đang tập trung chỉnh nội thất. */}
                  <button
                    type="button"
                    onClick={() => { setCameraLocked((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {cameraLocked ? '🔓 Mở khoá góc nhìn' : '🔒 Khoá góc nhìn'}
                  </button>
                </span>
              )}
            </span>
          </div>
          {showShortcutsHelp && (
            <ul className="room3d-shortcuts-help">
              <li>Kéo chuột (nền phòng): xoay góc nhìn — cuộn: zoom</li>
              <li>Kéo 1 món nội thất: đổi vị trí (chỉ trong phiên xem này)</li>
              <li>Nhấp 1 lần vào món nội thất: chọn/bỏ chọn</li>
              <li>Nhấp đúp vào món nội thất: xoay 90°</li>
              <li>Phím mũi tên (khi đã chọn 1 món): di chuyển tinh 0.1m</li>
              <li>Phím mũi tên (khi CHƯA chọn món nào): xoay/zoom camera — Trái/Phải xoay quanh phòng, Lên/Xuống tiến/lùi</li>
              <li>+ / - (khi chưa chọn món nào): zoom camera vào/ra — R: đặt lại góc nhìn (giống nút "Đặt lại góc nhìn")</li>
              <li>Q / E (khi đã chọn): xoay 15° — hoặc dùng nút "↺/↻ Xoay 15°" trên thanh công cụ</li>
              <li>Delete / Backspace (khi đã chọn): xoá món</li>
              <li>Kéo chấm đỏ ở góc tường: đổi kích thước phòng</li>
              <li>Nút "↑ Nhìn từ trước"/"→ Nhìn từ bên": 2 góc nhìn nhanh thêm, tiện kiểm tra bố trí tường/chiều sâu nội thất</li>
              <li>Nút "🔄 Tự động xoay 360°": xoay camera liên tục quanh phòng, không cần giữ chuột</li>
              <li>Nút "🚶 Góc nhìn đi bộ": chuyển sang góc nhìn ngang tầm mắt, như đang đứng trong phòng</li>
              <li>Ctrl/Cmd+Z: Hoàn tác thêm/xoá/nhân đôi/sửa giá/đổi màu — hoặc nút "↶ Hoàn tác"</li>
              <li>Ctrl/Cmd+Shift+Z hoặc Ctrl/Cmd+Y: Làm lại — hoặc nút "↷ Làm lại"</li>
              <li>Nút "🔒 Chế độ xem trước": khoá mọi chỉnh sửa (thêm/xoá/kéo-thả/đổi màu/xoay), vẫn xoay góc nhìn/đổi tab/chọn món để xem được</li>
              <li>Nút 👁️/🙈 trong danh sách nội thất: ẩn/hiện tạm 1 món khỏi scene (không xoá) — bấm vào tên món để chọn nhanh, kể cả khi đang ẩn</li>
              <li>Nút "🧱 Ẩn/Hiện tường-sàn" (trong "⋯ Thêm"): tạm ẩn sàn + 2 mặt tường để nhìn nội thất rõ hơn khi chỉnh bố cục</li>
              <li>Đang kéo 1 món: dòng "📏 Cách tường trái/sau" phía trên khung 3D hiện khoảng cách thật tới 2 mặt tường</li>
              <li>Nút "🎯 Về tâm phòng": đưa món đang chọn về đúng giữa phòng, giữ nguyên góc xoay — khác "↺ Đặt lại vị trí/góc xoay" (về vị trí ban đầu + góc xoay 0°)</li>
              <li>Dòng "📐 Góc xoay": hiện góc xoay hiện tại (độ) của món đang chọn, cập nhật ngay khi xoay</li>
              <li>Nút "🔲 Chế độ khung dây" (trong "⋯ Thêm"): nhìn xuyên nội thất dạng khung dây, dễ phát hiện món bị che khuất</li>
              <li>Nút tốc độ camera (trong "⋯ Thêm"): 3 mức Chậm/Bình thường/Nhanh cho xoay/pan/zoom bằng chuột</li>
              <li>Nút "📋 Sao chép ảnh" (trong "⋯ Thêm"): sao chép khung hình 3D hiện tại thẳng vào clipboard, dán được ngay vào ứng dụng khác</li>
              <li>Ô nhập cạnh "Góc xoay": gõ trực tiếp số độ (0-359) thay vì bấm nhiều lần nút xoay</li>
              <li>Esc (khi đang chọn 1 món, không có dropdown/menu nào mở): bỏ chọn món ngay</li>
              <li>Nút "🌑/☀️ bóng đổ" và "🔅/🔆 Độ sáng" (trong "⋯ Thêm"): tắt bóng đổ hoặc chỉnh độ sáng scene, độc lập với chế độ Ngày/Đêm</li>
              <li>Nút "🧭 Về giữa phòng" (trong "Góc nhìn ▾"): đưa điểm nhìn CAMERA về giữa phòng, giữ nguyên khoảng cách/góc nhìn — khác "🎯 Về tâm phòng" (di chuyển nội thất đang chọn)</li>
              <li>Nút "🕘 Hoạt động gần đây": xem thêm vài thao tác gần nhất (không chỉ 1 mục như dòng "Thao tác gần nhất")</li>
              <li>Nút "🪴 Chỉ nội thất" (trong "⋯ Thêm"): tạm ẩn thảm/chậu cây/tranh tường, giữ nguyên nội thất chính</li>
              <li>W/A/S/D (khi CHƯA chọn món nào): điều khiển camera — giống hệt phím mũi tên tương ứng</li>
              <li>Rê chuột lên 1 món (không cần click): tên món hiện ngay gần con trỏ</li>
              <li>Camera giữ nguyên vị trí/góc nhìn qua mọi thao tác bật/tắt khác (Ẩn nhãn, Buổi tối, Khung dây...) — chỉ đổi khi bấm "Đặt lại góc nhìn" hoặc chuyển sang thiết kế khác</li>
              <li>Nút "🔒/🔓 Khoá món này": khoá vị trí/góc xoay món đang chọn (tránh kéo/xoay nhầm), vẫn chọn/xem/đổi màu/xoá được</li>
              <li>Nút "🔎 Cô lập món này"/"↩️ Hiện lại tất cả": tạm ẩn mọi món khác để tập trung chỉnh 1 món cụ thể</li>
              <li>Nút "▦ Hiện/Ẩn lưới sàn" (trong "⋯ Thêm"): lưới tham chiếu trên mặt sàn, độc lập với Snap-to-Grid</li>
              <li>Đang kéo 1 món: vùng sàn ngay dưới món được tô sáng nhẹ theo thời gian thực</li>
            </ul>
          )}
          {/* TASK-133: khoảng cách tới 2 mặt tường thật khi đang kéo-thả — thuần thông tin, không tự
              căn chỉnh (khác Alignment Guides TASK-128, hoạt động độc lập song song). */}
          {dragWallDistance && (
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 6px' }}>
              📏 Cách tường trái: {dragWallDistance.toLeft.toFixed(1)}m · Cách tường sau: {dragWallDistance.toBack.toFixed(1)}m
            </p>
          )}
          <div ref={mountRef} className="room3d-mount" />
          {/* TASK-139: tên món khi hover — không chặn thao tác chuột bên dưới (`pointerEvents: 'none'`). */}
          {hoveredItemName && (
            <span
              style={{
                position: 'fixed',
                left: hoverScreenPos.x + 14,
                top: hoverScreenPos.y + 14,
                pointerEvents: 'none',
                background: 'rgba(20,20,20,0.85)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.8rem',
                zIndex: 30,
              }}
            >
              {hoveredItemName}
            </span>
          )}
          {/* TASK-124: menu chuột phải trên 1 món nội thất — lối tắt cho các hành động đã có (không thêm
              hành vi mới). `position: fixed` + toạ độ trang từ sự kiện `contextmenu` gốc. */}
          {contextMenu && (
            <span
              ref={contextMenuRef}
              className="room3d-dropdown__menu"
              style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 20 }}
            >
              <button
                type="button"
                disabled={previewMode}
                onClick={() => { duplicateFurniture(contextMenu.index); setContextMenu(null) }}
              >
                ⧉ Nhân bản
              </button>
              <button
                type="button"
                disabled={previewMode}
                onClick={() => { removeFurniture(contextMenu.index); setContextMenu(null) }}
              >
                ✕ Xoá
              </button>
              <button
                type="button"
                onClick={() => { toggleVisibility(contextMenu.index); setContextMenu(null) }}
              >
                {hiddenIndices.has(contextMenu.index) ? '👁️ Hiện lại' : '🙈 Ẩn tạm'}
              </button>
              <button
                type="button"
                disabled={previewMode}
                onClick={() => { resetSelectedTransform(); setContextMenu(null) }}
              >
                ↺ Đặt lại vị trí/góc xoay
              </button>
              <button type="button" onClick={() => { focusOnSelected(); setContextMenu(null) }}>
                🔍 Phóng to
              </button>
            </span>
          )}
          <fieldset disabled={previewMode} style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
            {COLOR_PICKER_GROUPS.map((group) => (
              <div key={group.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="room3d-color-picker-label">{group.label}</span>
                {group.presets.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={`room3d-color-swatch${colorOverrides[group.key] === hex ? ' is-active' : ''}`}
                    style={{ background: hex }}
                    title={hex}
                    aria-label={`Đổi màu ${group.label.toLowerCase()} thành ${hex}`}
                    onClick={() => {
                      pushHistory(`Đổi màu ${group.label.toLowerCase()}`)
                      setColorOverrides((prev) => ({ ...prev, [group.key]: hex }))
                    }}
                  />
                ))}
                {colorOverrides[group.key] && (
                  <button
                    type="button"
                    className="room3d-color-swatch-reset"
                    onClick={() => {
                      pushHistory(`Đặt lại màu ${group.label.toLowerCase()}`)
                      setColorOverrides((prev) => ({ ...prev, [group.key]: null }))
                    }}
                  >
                    Mặc định
                  </button>
                )}
              </div>
            ))}
          </fieldset>

          <div className="room3d-furniture-panel">
            <button
              type="button"
              onClick={toggleFurniturePanel}
              aria-expanded={furniturePanelOpen}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text)', padding: 0,
                margin: '4px 0 6px', font: 'inherit', fontWeight: 700, cursor: 'pointer', display: 'block',
              }}
            >
              {furniturePanelOpen ? '▾' : '▸'} Nội thất trong phòng
            </button>
            {/* TASK-126: bọc toàn bộ phần còn lại của panel (2 fieldset + danh sách + catalog) trong 1 div
                `display:none` khi thu gọn — KHÔNG unmount, giữ nguyên state bên trong (vd đang gõ ô tìm
                kiếm) khi mở lại. Vị trí đóng thẻ xác định bằng script đếm thẻ cân bằng, không đếm thủ công. */}
            <div style={{ display: furniturePanelOpen ? undefined : 'none' }}>
            {/* TASK-105: fieldset bọc phần thông tin ngân sách + nút gợi ý xoá (mutation thật) — KHÔNG
                bọc `<ul>` danh sách nội thất bên dưới (TASK-109 cần nút 👁️/🙈 + chọn món hoạt động được
                cả trong preview mode, chỉ 3 control mutation thật trong mỗi dòng — sửa giá/nhân đôi/xoá —
                mới bọc fieldset riêng ở CHÍNH dòng đó). Đóng lại trước `<ul>`, mở lại 1 fieldset khác sau
                `</ul>` cho phần còn lại (Hoàn tác/Làm lại, ô tìm kiếm, nút thêm loại đồ). */}
            <fieldset disabled={previewMode} style={{ border: 0, margin: 0, padding: 0 }}>
            {/* TASK-067: tổng số món + tổng chi phí ước tính của danh sách ĐANG XEM (kể cả món tự thêm/
                xoá tạm thời) — khác với biểu đồ ngân sách AI gốc ở trên (TASK-026), vốn không đổi theo
                thêm/xoá tạm thời (đã quyết định từ TASK-028: không đồng bộ 2 chiều). */}
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>
              {localFurniture.length} món · tổng ước tính{' '}
              {localFurniture.reduce((sum, item) => sum + (item.estimatedCost || 0), 0).toLocaleString('vi-VN')} đ
            </p>
            {/* TASK-125: huy hiệu số lượng theo loại — chỉ hiện loại nào có TỪ 2 MÓN TRỞ LÊN (giá trị cốt
                lõi là phát hiện nhanh "đang trùng bao nhiêu món cùng loại", loại chỉ có 1 món không cần
                báo vì không giúp ích gì thêm so với dòng tóm tắt phía trên). */}
            {(() => {
              const counts = {}
              localFurniture.forEach((item) => {
                counts[item.category] = (counts[item.category] || 0) + 1
              })
              const entries = Object.entries(counts).filter(([, count]) => count >= 2)
              if (entries.length === 0) return null
              return (
                <p style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0 0 8px' }}>
                  {entries.map(([category, count]) => (
                    <span key={category} className="chip">
                      {categoryLabel(category)} ×{count}
                    </span>
                  ))}
                </p>
              )
            })()}
            {/* TASK-079: "ngân sách sống" — thanh ngân sách gốc ở DesignResult.jsx (TASK-015) so với
                estimatedCost CỐ ĐỊNH lúc AI tạo, không phản ánh thêm/xoá/sửa giá tạm thời ở đây (TASK-
                027/028/046). Chỉ hiện khi có `budget` thật từ preference — không bịa "vượt 0 đ" khi
                user chưa từng nhập ngân sách. */}
            {budget > 0 && (() => {
              const total = localFurniture.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
              const over = total - budget
              if (over <= 0) {
                return (
                  <p style={{ fontSize: '0.85rem', margin: '0 0 8px', color: 'var(--color-accent-dark)' }}>
                    ✅ Trong ngân sách, còn dư {(-over).toLocaleString('vi-VN')} đ
                  </p>
                )
              }
              // Gợi ý xoá THẬT dựa trên dữ liệu đang có (không bịa "món thay thế rẻ hơn" — mỗi loại đồ tự
              // thêm chỉ có đúng 1 mức giá cố định trong CUSTOM_FURNITURE_PRESETS, không có gì để "thay").
              const sortedByCostDesc = localFurniture
                .map((item, index) => ({ item, index }))
                .sort((a, b) => (b.item.estimatedCost || 0) - (a.item.estimatedCost || 0))
              const priciest = sortedByCostDesc[0]
              const removingPriciestEnough = priciest && (priciest.item.estimatedCost || 0) >= over
              let itemsNeeded = 0
              if (!removingPriciestEnough) {
                let remaining = over
                for (const { item } of sortedByCostDesc) {
                  if (remaining <= 0) break
                  remaining -= item.estimatedCost || 0
                  itemsNeeded += 1
                }
              }
              return (
                <div style={{ margin: '0 0 8px' }}>
                  <p style={{ fontSize: '0.85rem', margin: '0 0 4px', color: 'var(--color-danger)' }}>
                    ⚠️ Vượt ngân sách {over.toLocaleString('vi-VN')} đ
                  </p>
                  {removingPriciestEnough ? (
                    <button type="button" className="secondary" onClick={() => removeFurniture(priciest.index)}>
                      💡 Xoá "{priciest.item.name || 'Nội thất'}" ({(priciest.item.estimatedCost || 0).toLocaleString('vi-VN')} đ) để về đúng ngân sách
                    </button>
                  ) : (
                    <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                      💡 Cần bớt khoảng {itemsNeeded} món giá trị cao nhất để về đúng ngân sách.
                    </p>
                  )}
                </div>
              )
            })()}
            </fieldset>
            <ul className="room3d-furniture-list">
              {localFurniture.map((item, idx) => (
                <li
                  key={idx}
                  className={[item.isCustom ? 'is-custom' : null, idx === selectedFurnitureIndex ? 'is-selected' : null]
                    .filter(Boolean)
                    .join(' ') || undefined}
                  style={hiddenIndices.has(idx) ? { opacity: 0.5 } : undefined}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: '2px 6px', fontSize: '0.85rem' }}
                      aria-label={hiddenIndices.has(idx) ? `Hiện lại ${item.name || 'món nội thất này'}` : `Ẩn tạm ${item.name || 'món nội thất này'}`}
                      title={hiddenIndices.has(idx) ? 'Hiện lại trong scene 3D' : 'Ẩn tạm khỏi scene 3D (không xoá)'}
                      onClick={() => toggleVisibility(idx)}
                    >
                      {hiddenIndices.has(idx) ? '🙈' : '👁️'}
                    </button>
                    <span
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      title="Bấm để chọn món này trong scene 3D"
                      onClick={() => selectMeshRef.current(idx)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectMeshRef.current(idx)}
                    >
                      {item.name || 'Nội thất'}
                    </span>
                    {lockedIndices.has(idx) && <span title="Đã khoá vị trí/góc xoay">🔒</span>}
                  </span>
                  <fieldset
                    disabled={previewMode}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, margin: 0, padding: 0 }}
                  >
                    {item.isCustom && (
                      <input
                        type="number"
                        className="room3d-furniture-cost-input"
                        defaultValue={item.estimatedCost || 0}
                        min={0}
                        step={100000}
                        title="Chi phí ước tính (tự nhập, không phải AI tính)"
                        aria-label={`Chi phí ước tính cho ${item.name || 'món nội thất này'}`}
                        onBlur={(e) => updateFurnitureCost(idx, Math.max(0, Number(e.target.value) || 0))}
                      />
                    )}
                    <button
                      type="button"
                      className="room3d-furniture-duplicate"
                      aria-label={`Nhân đôi ${item.name || 'món nội thất này'}`}
                      title="Nhân đôi"
                      onClick={() => duplicateFurniture(idx)}
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      className="room3d-furniture-remove"
                      aria-label={`Xoá ${item.name || 'món nội thất này'}`}
                      onClick={() => removeFurniture(idx)}
                    >
                      ✕
                    </button>
                  </fieldset>
                </li>
              ))}
            </ul>
            <fieldset disabled={previewMode} style={{ border: 0, margin: 0, padding: 0 }}>
            {(history.length > 0 || redoStack.length > 0) && (
              <>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={history.length === 0}
                  title={history.length > 0 ? `Hoàn tác: ${history[history.length - 1].label}` : undefined}
                  onClick={undo}
                >
                  ↶ Hoàn tác
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={redoStack.length === 0}
                  title={redoStack.length > 0 ? `Làm lại: ${redoStack[redoStack.length - 1].label}` : undefined}
                  onClick={redo}
                >
                  ↷ Làm lại
                </button>
                {history.length > 0 && (
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Thao tác gần nhất: {history[history.length - 1].label}
                  </span>
                )}
                {/* TASK-138: mở rộng từ dòng đơn ở trên (chỉ 1 mục) — xem thêm vài thao tác gần đây. */}
                {history.length > 1 && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShowRecentActions((prev) => !prev)}
                    aria-expanded={showRecentActions}
                  >
                    🕘 Hoạt động gần đây
                  </button>
                )}
              </div>
              {showRecentActions && history.length > 1 && (
                <ul className="text-muted" style={{ fontSize: '0.8rem', margin: '4px 0 0', paddingLeft: 18 }}>
                  {history.slice(-5).reverse().map((entry, i) => (
                    <li key={history.length - i}>{entry.label}</li>
                  ))}
                </ul>
              )}
              </>
            )}
            {recentCategories.length > 0 && (() => {
              const validRecent = recentCategories.filter((c) => CATEGORY_LABELS_VI[c])
              if (validRecent.length === 0) return null
              return (
                <div>
                  <span className="room3d-furniture-group-label">🕘 Vừa dùng gần đây</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {validRecent.map((category) => (
                      <button type="button" className="secondary" key={category} title={estimatedCostHint(category)} onClick={() => addFurniture(category)}>
                        + {CATEGORY_LABELS_VI[category]}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}
            <input
              ref={furnitureSearchInputRef}
              type="text"
              className="room3d-furniture-search"
              placeholder="🔍 Tìm loại đồ (vd: bàn, đèn, may)... (phím / để focus nhanh)"
              value={furnitureSearch}
              onChange={(e) => setFurnitureSearch(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(() => {
                const query = normalizeSearch(furnitureSearch)
                const matches = (category) => !query || normalizeSearch(CATEGORY_LABELS_VI[category]).includes(query)
                const visibleGroups = FURNITURE_GROUPS.map((group) => ({
                  ...group,
                  categories: group.categories.filter((c) => CATEGORY_LABELS_VI[c] && matches(c)),
                })).filter((group) => group.categories.length > 0)
                const visibleOther = OTHER_CATEGORIES.filter(matches)
                return (
                  <>
                    {visibleGroups.map((group) => (
                      <div key={group.label}>
                        <span className="room3d-furniture-group-label">{group.label}</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {group.categories.map((category) => (
                            <button type="button" className="secondary" key={category} title={estimatedCostHint(category)} onClick={() => addFurniture(category)}>
                              + {CATEGORY_LABELS_VI[category]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {visibleOther.length > 0 && (
                      <div>
                        <span className="room3d-furniture-group-label">Khác</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {visibleOther.map((category) => (
                            <button type="button" className="secondary" key={category} title={estimatedCostHint(category)} onClick={() => addFurniture(category)}>
                              + {CATEGORY_LABELS_VI[category]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {visibleGroups.length === 0 && visibleOther.length === 0 && (
                      <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                        Không tìm thấy loại đồ nào khớp "{furnitureSearch}".
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
            </fieldset>
          </div>

          {selectedFurnitureIndex != null && (
            <fieldset disabled={previewMode} style={{ border: 0, margin: 0, padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="room3d-color-picker-label">Màu món đang chọn</span>
              {ITEM_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`room3d-color-swatch${itemColorOverrides[selectedFurnitureIndex] === hex ? ' is-active' : ''}`}
                  style={{ background: hex }}
                  title={hex}
                  aria-label={`Nhuộm món đang chọn màu ${hex}`}
                  onClick={() => {
                    pushHistory(`Nhuộm màu "${localFurniture[selectedFurnitureIndex]?.name || 'món nội thất'}"`)
                    setItemColorOverrides((prev) => ({ ...prev, [selectedFurnitureIndex]: hex }))
                  }}
                />
              ))}
              {itemColorOverrides[selectedFurnitureIndex] && (
                <button
                  type="button"
                  className="room3d-color-swatch-reset"
                  onClick={() => {
                    pushHistory(`Đặt lại màu "${localFurniture[selectedFurnitureIndex]?.name || 'món nội thất'}"`)
                    setItemColorOverrides((prev) => {
                      const next = { ...prev }
                      delete next[selectedFurnitureIndex]
                      return next
                    })
                  }}
                >
                  Mặc định
                </button>
              )}
            </fieldset>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
              {previewDims
                ? `Đang chỉnh kích thước phòng: ${previewDims.width.toFixed(1)}m × ${previewDims.length.toFixed(1)}m`
                : selectedFurnitureIndex != null
                ? previewMode
                  ? `Đã chọn "${localFurniture[selectedFurnitureIndex]?.name || 'món nội thất'}" — đang ở chế độ xem trước, nhấp chỗ trống để bỏ chọn.`
                  : `Đã chọn "${localFurniture[selectedFurnitureIndex]?.name || 'món nội thất'}" — phím mũi tên để di chuyển tinh, Q/E để xoay 15°, Delete để xoá, nhấp chỗ trống để bỏ chọn.`
                : previewMode
                ? 'Đang ở chế độ xem trước — vẫn xoay/pan/zoom camera, đổi tab, chọn món để xem thông tin được, nhưng mọi chỉnh sửa đã bị khoá.'
                // TASK-140: hiện kích thước phòng thường trực ở nhánh mặc định (trước đó CHỈ hiện tạm
                // thời lúc đang kéo-resize qua `previewDims` ở nhánh đầu tiên) — giữ nguyên phần hướng
                // dẫn thao tác cũ, chỉ thêm thông tin kích thước lên trước. Tính lại `width`/`length` tại
                // chỗ (cùng công thức `room?.widthMeters > 0 ? ... : DEFAULT_SIZE_METERS` dùng xuyên suốt
                // file) vì 2 biến này chỉ tồn tại cục bộ trong effect dựng scene, không có sẵn ở JSX.
                : (() => {
                    const roomWidth = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
                    const roomLength = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
                    return `📐 Kích thước phòng: ${roomWidth.toFixed(1)}m × ${roomLength.toFixed(1)}m (diện tích ${(roomWidth * roomLength).toFixed(1)} m²) — Kéo chuột để xoay/pan, cuộn để zoom. Kéo chấm đỏ để đổi kích thước phòng, kéo một món nội thất để đổi vị trí, nhấp đúp để xoay 90°, nhấp 1 lần để chọn rồi dùng phím mũi tên/Delete (chỉ trong phiên xem này, chưa lưu lại).`
                  })()}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="secondary" onClick={exportLayout} title="Lưu bố trí hiện tại (nội thất + màu) thành file JSON trên máy">
                💾 Lưu bố trí
              </button>
              <button type="button" className="secondary" disabled={previewMode} onClick={() => importInputRef.current?.click()} title="Khôi phục bố trí đã lưu từ file JSON">
                📂 Tải bố trí đã lưu
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  importLayout(e.target.files?.[0])
                  e.target.value = '' // cho phép chọn lại đúng file cũ lần nữa nếu cần
                }}
              />
              {localFurniture.some((item) => item.isCustom) && (
                <button type="button" className="secondary" disabled={previewMode} onClick={removeAllCustom}>
                  🧹 Xoá món tự thêm
                </button>
              )}
              <button
                type="button"
                disabled={previewMode}
                onClick={() => {
                  pushHistory('Đặt lại bố trí')
                  setLocalFurniture(furniture)
                  setItemColorOverrides({})
                  setHiddenIndices(new Set()) // TASK-109
                  selectedIndexRef.current = null
                  // TASK-142: báo cho cleanup của effect dựng scene BỎ QUA việc chụp lại transform hiện
                  // tại — xem giải thích đầy đủ ở khai báo `skipTransformCaptureRef` (không thể chỉ gán
                  // thẳng `transformOverridesRef.current = {}` ở đây vì cleanup chạy SAU sẽ ghi đè lại).
                  skipTransformCaptureRef.current = true
                  setResetSignal((n) => n + 1)
                }}
              >
                Đặt lại bố trí
              </button>
            </div>
            </div>
          </div>
          {importError && <p className="error-text">{importError}</p>}
          {resizeError && <p className="error-text">{resizeError}</p>}
        </div>
      ) : (
        imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Ảnh AI sinh ra cho không gian phòng"
              className="room3d-2d-image"
              style={{ width: '100%', borderRadius: 12, border: '1px solid var(--color-border)', cursor: 'zoom-in' }}
              onClick={() => setImageLightboxOpen(true)}
            />
            {imageLightboxOpen && (
              <div
                className="room3d-lightbox no-print"
                role="button"
                tabIndex={0}
                aria-label="Đóng ảnh phóng to"
                onClick={() => setImageLightboxOpen(false)}
                onKeyDown={(e) => e.key === 'Escape' && setImageLightboxOpen(false)}
              >
                <img src={imageUrl} alt="Ảnh AI phóng to" />
              </div>
            )}
          </>
        ) : (
          <div className="viewer-3d-placeholder">Chưa có ảnh AI để hiển thị.</div>
        )
      )}
      </div>

      {/* Luôn render (ẩn qua CSS trên màn hình, chỉ hiện khi in — .room3d-print-plan trong styles.css)
          để bản in luôn có sơ đồ mặt bằng dù đang xem tab nào (canvas 3D không đáng tin cậy khi in,
          xem TASK-024; SVG sơ đồ 2D thì in tốt). */}
      <div className="room3d-print-plan">
        <h3>Sơ đồ mặt bằng</h3>
        <Room2DPlan room={room} furniture={localFurniture} />
      </div>
    </div>
  )
}
