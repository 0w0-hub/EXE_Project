import { useEffect, useRef, useState } from 'react'
import { Box, Image as ImageIcon, Map, X, RotateCw, Maximize2, Sun, Eye, EyeOff, MoreHorizontal, LockKeyhole, Copy, Trash2 } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { assetApi, roomApi } from '../services/api'
import { resolveFurniturePositions, furnitureSize } from '../lib/furnitureLayout'
import { slugify } from '../lib/slug'
import useEscapeKey from '../hooks/useEscapeKey'

const ROOM_HEIGHT_METERS = 2.8 
const DEFAULT_SIZE_METERS = 4
const VIEWPORT_HEIGHT = 420
const MIN_ROOM_METERS = 1.5
const MAX_ROOM_METERS = 15
const SCENE_BACKGROUND = '#E1EDD4'
const EVENING_BACKGROUND = '#2E2A4D'
const AMBIENT_GROUND_COLOR = 0x667085 
const WALL_FALLBACK_COLOR = '#E7E8F7' 
const FLOOR_FALLBACK_COLOR = '#E5F2FC' 
const CEILING_FALLBACK_COLOR = '#F5F6F3' 
const FURNITURE_FALLBACK_COLOR = '#70D6C5'
const ROOM_OUTLINE_COLOR = 0xb7c2ac
const HANDLE_COLOR = '#C4433D'
const STATIC_FURNITURE_MODELS = {
  seating: [
    '/furniture/seating.glb',
    '/furniture/seating-2.glb',
    '/furniture/seating-3.glb',
    '/furniture/seating-4.glb',
    '/furniture/seating-5.glb',
    '/furniture/seating-6.glb',
    '/furniture/seating-7.glb', 
    '/furniture/seating-8.glb',
  ],
  table: [
    '/furniture/table.glb',
    '/furniture/table-2.glb',
    '/furniture/table-3.glb',
    '/furniture/table-4.glb',
    '/furniture/table-5.glb',
    '/furniture/table-6.glb',
    '/furniture/table-7.glb', 
    '/furniture/table-8.glb',
  ],
  lighting: [
    '/furniture/lighting.glb',
    '/furniture/lighting-2.glb',
    '/furniture/lighting-3.glb',
    '/furniture/lighting-4.glb',
    '/furniture/lighting-5.glb', 
    '/furniture/lighting-6.glb', 
  ],
  storage: [
    '/furniture/storage.glb',
    '/furniture/storage-2.glb',
    '/furniture/storage-3.glb',
    '/furniture/storage-4.glb',
    '/furniture/storage-5.glb',
    '/furniture/storage-6.glb',
    '/furniture/storage-7.glb', 
    '/furniture/storage-8.glb', 
  ],
  plant: [
    '/furniture/decor-plant.glb',
    '/furniture/decor-plant-2.glb',
    '/furniture/decor-plant-3.glb',
    '/furniture/decor-plant-4.glb',
  ],
  rug: ['/furniture/decor-rug.glb', '/furniture/decor-rug-2.glb', '/furniture/decor-rug-3.glb', '/furniture/decor-rug-4.glb'],
  tv: ['/furniture/decor-tv.glb', '/furniture/decor-tv-2.glb'],
  coatrack: ['/furniture/decor-coatrack.glb'],
  mirror: ['/furniture/decor-mirror.glb'],
  speaker: ['/furniture/decor-speaker.glb', '/furniture/decor-speaker-2.glb'],
  bed: ['/furniture/decor-bed.glb', '/furniture/decor-bed-2.glb', '/furniture/decor-bed-3.glb'],
  desk: ['/furniture/decor-desk.glb', '/furniture/decor-desk-2.glb'],
  fridge: ['/furniture/decor-fridge.glb', '/furniture/decor-fridge-2.glb'],
  stove: ['/furniture/decor-stove.glb', '/furniture/decor-stove-2.glb'],
  toilet: ['/furniture/decor-toilet.glb', '/furniture/decor-toilet-2.glb'],
  bathtub: ['/furniture/decor-bathtub.glb'],
  nightstand: ['/furniture/decor-nightstand.glb', '/furniture/decor-nightstand-2.glb'],
  washer: ['/furniture/decor-washer.glb', '/furniture/decor-washer-2.glb'],
  shower: ['/furniture/decor-shower.glb', '/furniture/decor-shower-2.glb'],
  barcounter: ['/furniture/decor-barcounter.glb'],
  barstool: ['/furniture/decor-barstool.glb', '/furniture/decor-barstool-2.glb'],
  teddybear: ['/furniture/decor-teddybear.glb'],
  ceilingfan: ['/furniture/decor-ceilingfan.glb'],
  pillow: ['/furniture/decor-pillow.glb', '/furniture/decor-pillow-2.glb', '/furniture/decor-pillow-3.glb'],
  books: ['/furniture/decor-books.glb'],
  hood: ['/furniture/decor-hood.glb'],
  laptop: ['/furniture/decor-laptop.glb'],
  sink: ['/furniture/decor-sink.glb'],
  microwave: ['/furniture/decor-microwave.glb'],
  trashcan: ['/furniture/decor-trashcan.glb'],
  computer: ['/furniture/decor-computer.glb'],
  coffeemachine: ['/furniture/decor-coffeemachine.glb'],
  radio: ['/furniture/decor-radio.glb'],
  toaster: ['/furniture/decor-toaster.glb'],
  blender: ['/furniture/decor-blender.glb'],
  kitchensink: ['/furniture/decor-kitchensink.glb'],
  keyboard: ['/furniture/decor-keyboard.glb'],
  mouse: ['/furniture/decor-mouse.glb'],
  box: ['/furniture/decor-box.glb', '/furniture/decor-box-2.glb'],
}
const ITEM_COLOR_PRESETS = ['#C4433D', '#4D52B4', '#70D6C5', '#E8B14D', '#5B6358', '#FFFFFF']
const COLOR_PICKER_GROUPS = [
  { key: 'wall', label: 'Tường', presets: ['#E7E8F7', '#F5EDE4', '#DCEAE3', '#EAD9D2', '#3A3F4B'] },
  { key: 'floor', label: 'Sàn', presets: ['#E5F2FC', '#D8C4A8', '#B08D63', '#EDEDED', '#6B4A32'] },
  { key: 'ceiling', label: 'Trần', presets: ['#F5F6F3', '#FFFFFF', '#EFEAE0', '#D9D9D9'] },
]

function colorForRole(colors, role, fallback) {
  return colors?.find((c) => c.role === role)?.colorHex || fallback
}
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

function normalizeSearch(str) {
  return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
const FURNITURE_GROUPS = [
  { label: 'Cơ bản', categories: ['seating', 'table', 'lighting', 'storage'] },
  { label: 'Phòng khách/chung', categories: ['plant', 'rug', 'tv', 'coatrack', 'mirror', 'speaker', 'teddybear', 'ceilingfan', 'pillow', 'books', 'trashcan', 'radio', 'box'] },
  { label: 'Phòng ngủ', categories: ['bed', 'desk', 'nightstand', 'laptop', 'computer', 'keyboard', 'mouse'] },
  { label: 'Phòng bếp/ăn', categories: ['fridge', 'stove', 'barcounter', 'barstool', 'hood', 'microwave', 'coffeemachine', 'toaster', 'blender', 'kitchensink'] },
  { label: 'Phòng tắm/giặt', categories: ['toilet', 'bathtub', 'shower', 'washer', 'sink'] },
]
const GROUPED_CATEGORIES = new Set(FURNITURE_GROUPS.flatMap((g) => g.categories))
const OTHER_CATEGORIES = Object.keys(CATEGORY_LABELS_VI).filter((c) => !GROUPED_CATEGORIES.has(c))
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

function categoryLabel(category) {
  return CUSTOM_FURNITURE_PRESETS[category]?.name.replace(' (mới thêm)', '') || category
}

function estimatedCostHint(category) {
  const cost = CUSTOM_FURNITURE_PRESETS[category]?.estimatedCost || 0
  return `Giá ước tính: ${cost.toLocaleString('vi-VN')} đ`
}

function rotationRadToDeg(rad) {
  return ((Math.round(THREE.MathUtils.radToDeg(rad)) % 360) + 360) % 360
}

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
    const rows = 5
    for (let i = 0; i < rows; i++) {
      ctx.fillStyle = i % 2 === 0 ? `#${accent.getHexString()}` : `#${soft.getHexString()}`
      ctx.fillRect(0, (i * size) / rows, size, size / rows)
    }
  } else if (pattern === 2) {
    for (let r = 3; r >= 1; r--) {
      ctx.fillStyle = r % 2 === 0 ? `#${soft.getHexString()}` : `#${accent.getHexString()}`
      ctx.beginPath()
      ctx.arc(size * 0.35, size * 0.4, size * 0.14 * r, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
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
    ctx.drawImage(img, 0, 0, viewBoxWidth, viewBoxHeight)
    URL.revokeObjectURL(url)
    const link = document.createElement('a')
    link.download = `homely-so-do-2d-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = url
}

function Room2DPlan({ room, furniture, selectedIndex }) {
  const svgRef = useRef(null)
  const width = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
  const length = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
  const scale = 40 
  const pad = 26
  const dimPad = 34 
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
           Tải sơ đồ
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
        <line x1={pad} y1={pad} x2={pad + width * scale} y2={pad} stroke="#333" strokeWidth={4} />
        <line x1={pad} y1={pad} x2={pad} y2={pad + length * scale} stroke="#333" strokeWidth={4} />

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

export default function Room3DViewer({ room, furniture = [], colors = [], resultAssetId, onRoomResized, budget }) {
  const mountRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const handleResizeRef = useRef(() => {})
  const defaultViewRef = useRef(null)
  const prevCameraStateRef = useRef(null)
  const transformOverridesRef = useRef({})
  const prevLocalFurnitureRef = useRef(null)
  const skipTransformCaptureRef = useRef(false)
  const selectedIndexRef = useRef(null)
  const rotateSelectedRef = useRef(() => {})
  const selectMeshRef = useRef(() => {})
  const resetTransformRef = useRef(() => {})
  const centerSelectedRef = useRef(() => {})
  const setRotationRef = useRef(() => {})
  const toggleXrayRef = useRef(() => {})
  const [xrayEnabled, setXrayEnabled] = useState(false)
  const furnitureSearchInputRef = useRef(null)
  const [tab, setTab] = useState('3d')
  const [resetSignal, setResetSignal] = useState(0)
  const [colorOverrides, setColorOverrides] = useState({ wall: null, floor: null, ceiling: null })
  const [lightingMode, setLightingMode] = useState('day')
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const isAutoRotatingRef = useRef(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false)
  const [previewDims, setPreviewDims] = useState(null)
  const [resizeError, setResizeError] = useState(null)
  const [selectedFurnitureIndex, setSelectedFurnitureIndex] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [dragWallDistance, setDragWallDistance] = useState(null)
  const [selectedRotationDeg, setSelectedRotationDeg] = useState(0)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [showRecentActions, setShowRecentActions] = useState(false)
  const contextMenuRef = useRef(null)
  const [itemColorOverrides, setItemColorOverrides] = useState({})
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
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
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
      }
      return next
    })
  }
  const [showRoomSurfaces, setShowRoomSurfaces] = useState(true)
  const [wireframeMode, setWireframeMode] = useState(false)
  const [cameraSpeed, setCameraSpeed] = useState('normal')
  const [copyImageStatus, setCopyImageStatus] = useState(null)
  const [shadowsEnabled, setShadowsEnabled] = useState(true)
  const [decorOnlyMode, setDecorOnlyMode] = useState(false)
  const [hoveredItemName, setHoveredItemName] = useState(null)
  const [hoverScreenPos, setHoverScreenPos] = useState({ x: 0, y: 0 })
  const [brightnessLevel, setBrightnessLevel] = useState(2)
  const [furniturePanelOpen, setFurniturePanelOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('homely_furniture_panel_open')
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })
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
      }
      return next
    })
  }
  const [snapStep, setSnapStep] = useState(0)
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
  useEscapeKey(selectedFurnitureIndex != null, () => selectMeshRef.current(null))
  const [previewMode, setPreviewMode] = useState(false)
  const [hiddenIndices, setHiddenIndices] = useState(() => new Set())

  function toggleVisibility(index) {
    setHiddenIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }
  const [lockedIndices, setLockedIndices] = useState(() => new Set())
  function toggleLock(index) {
    setLockedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }
  const [isIsolating, setIsIsolating] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [justAddedIndex, setJustAddedIndex] = useState(null)
  const [cameraLocked, setCameraLocked] = useState(false)
  const [furnitureSearch, setFurnitureSearch] = useState('')
  const [importError, setImportError] = useState(null)
  const importInputRef = useRef(null)
  const [localFurniture, setLocalFurniture] = useState(furniture)

  useEffect(() => {
    setLocalFurniture(furniture)
    setHistory([])
    setRedoStack([])
    setHiddenIndices(new Set()) 
  }, [furniture])

  function addFurniture(category) {
    const preset = CUSTOM_FURNITURE_PRESETS[category]
    if (!preset) return
    pushHistory(`Thêm "${CATEGORY_LABELS_VI[category] || category}"`)
    setJustAddedIndex(localFurniture.length)
    setTimeout(() => setJustAddedIndex(null), 2000)
    setLocalFurniture((prev) => [...prev, { ...preset, category, isCustom: true }])
    setRecentCategories((prev) => {
      const next = [category, ...prev.filter((c) => c !== category)].slice(0, 6)
      try {
        localStorage.setItem('homely_recent_furniture', JSON.stringify(next))
      } catch {
      }
      return next
    })
  }

  function removeFurniture(index) {
    pushHistory(`Xoá "${localFurniture[index]?.name || 'món nội thất'}"`)
    setLocalFurniture((prev) => prev.filter((_, i) => i !== index))
    setItemColorOverrides((prev) => {
      const next = {}
      Object.entries(prev).forEach(([key, hex]) => {
        const i = Number(key)
        if (i < index) next[i] = hex
        else if (i > index) next[i - 1] = hex
      })
      return next
    })
    if (selectedIndexRef.current === index) selectedIndexRef.current = null
    else if (selectedIndexRef.current != null && selectedIndexRef.current > index) selectedIndexRef.current -= 1
  }

  function duplicateFurniture(index) {
    pushHistory(`Nhân đôi "${localFurniture[index]?.name || 'món nội thất'}"`)
    setLocalFurniture((prev) => {
      const item = prev[index]
      if (!item) return prev
      const baseName = (item.name || 'Nội thất').replace(/ \(bản sao\)$/, '')
      return [...prev, { ...item, name: `${baseName} (bản sao)`, isCustom: true }]
    })
  }

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

  function updateFurnitureCost(index, cost) {
    pushHistory(`Sửa giá "${localFurniture[index]?.name || 'món nội thất'}"`)
    setLocalFurniture((prev) => prev.map((item, i) => (i === index ? { ...item, estimatedCost: cost } : item)))
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      mountRef.current?.requestFullscreen().catch(() => {})
    }
  }

  function toggleAutoRotate() {
    const controls = controlsRef.current
    if (!controls) return
    controls.autoRotate = !controls.autoRotate
    isAutoRotatingRef.current = controls.autoRotate
    setIsAutoRotating(controls.autoRotate)
  }

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

  function centerView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const offset = camera.position.clone().sub(controls.target)
    controls.target.set(0, controls.target.y, 0)
    camera.position.copy(controls.target).add(offset)
    controls.update()
  }

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

  function rotateSelected(direction) {
    rotateSelectedRef.current(direction)
  }

  function resetSelectedTransform() {
    resetTransformRef.current()
  }

  function centerSelected() {
    centerSelectedRef.current()
  }

  function setSelectedRotationInput(deg) {
    if (!Number.isFinite(deg)) return
    setRotationRef.current(deg)
  }

  function toggleIsolate() {
    setIsIsolating((prev) => !prev)
  }

  function captureScreenshot(multiplier = 1) {
    const canvas = mountRef.current?.querySelector('canvas')
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    if (!canvas || !renderer || !scene || !camera) return
    if (multiplier > 1) {
      renderer.setSize(canvas.clientWidth * multiplier, canvas.clientHeight * multiplier, false)
      renderer.render(scene, camera)
    }
    const roomSlug = slugify(room?.roomType) || 'phong'
    const dateStr = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.download = `homely-${roomSlug}-${dateStr}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    if (multiplier > 1) handleResizeRef.current()
  }

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
    const sameFurniture = prevLocalFurnitureRef.current === localFurniture
    const isEvening = lightingMode === 'evening'
    const scene = new THREE.Scene()
    scene.background = makeBackgroundTexture(isEvening ? EVENING_BACKGROUND : SCENE_BACKGROUND)
    const defaultCameraPosition = new THREE.Vector3(width * 0.9, height * 1.6, length * 1.3)
    const defaultTarget = new THREE.Vector3(0, height / 3, 0)
    const prevCameraState = prevCameraStateRef.current
    const sameRoom = prevCameraState && prevCameraState.roomId === room?.id
    const camera = new THREE.PerspectiveCamera(50, containerWidth / VIEWPORT_HEIGHT, 0.1, 100)
    camera.position.copy(sameRoom ? prevCameraState.position : defaultCameraPosition)
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(containerWidth, VIEWPORT_HEIGHT)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = shadowsEnabled
    renderer.shadowMap.type = THREE.PCFShadowMap 
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    const brightnessFactor = [0.6, 0.8, 1, 1.2, 1.5][brightnessLevel] ?? 1
    renderer.toneMappingExposure = (isEvening ? 0.85 : 1.05) * brightnessFactor
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(sameRoom ? prevCameraState.target : defaultTarget) // TASK-139
    controls.maxPolarAngle = Math.PI / 2.05
    controls.minDistance = 1.5
    controls.maxDistance = Math.max(width, length) * 3
    controls.autoRotate = isAutoRotatingRef.current
    controls.autoRotateSpeed = 2.5
    const cameraSpeedFactor = cameraSpeed === 'slow' ? 0.5 : cameraSpeed === 'fast' ? 1.8 : 1
    controls.rotateSpeed = cameraSpeedFactor
    controls.panSpeed = cameraSpeedFactor
    controls.zoomSpeed = cameraSpeedFactor
    controls.enabled = !cameraLocked 
    controls.update()

    cameraRef.current = camera
    controlsRef.current = controls
    rendererRef.current = renderer
    sceneRef.current = scene
    defaultViewRef.current = { position: defaultCameraPosition.clone(), target: defaultTarget.clone() }

    scene.add(new THREE.HemisphereLight(isEvening ? 0x6b6ea8 : 0xffffff, AMBIENT_GROUND_COLOR, isEvening ? 0.35 : 0.7))

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

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, length)),
      new THREE.LineBasicMaterial({ color: ROOM_OUTLINE_COLOR, transparent: true, opacity: 0.45 })
    )
    outline.position.y = height / 2
    scene.add(outline)

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
    const decorMeshes = []
    const meshesForTransformCapture = []

    const hoverOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false })
    )
    hoverOutline.visible = false
    hoverOutline.renderOrder = 999
    scene.add(hoverOutline)

    const dragFloorHighlight = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x70d6c5, transparent: true, opacity: 0.35, depthTest: false })
    )
    dragFloorHighlight.rotation.x = -Math.PI / 2
    dragFloorHighlight.position.y = 0.015
    dragFloorHighlight.renderOrder = 997
    dragFloorHighlight.visible = false
    scene.add(dragFloorHighlight)

    const selectionOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0x4d52b4, transparent: true, opacity: 0.95, depthTest: false })
    )
    selectionOutline.visible = false
    selectionOutline.renderOrder = 999
    scene.add(selectionOutline)

    const newItemOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.95, depthTest: false })
    )
    newItemOutline.visible = false
    newItemOutline.renderOrder = 999
    scene.add(newItemOutline)

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
            m.needsUpdate = true 
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
      if (xrayedMesh && xrayedMesh !== mesh) {
        setMeshXray(xrayedMesh, false)
        xrayedMesh = null
        setXrayEnabled(false)
      }
      selectedMesh = mesh
      syncSelectionOutline()
      selectedIndexRef.current = mesh ? mesh.userData.index : null
      setSelectedFurnitureIndex(mesh ? mesh.userData.index : null)
      setSelectedRotationDeg(mesh ? rotationRadToDeg(mesh.rotation.y) : 0)
      setSelectedPosition(mesh ? { x: Math.round(mesh.position.x * 10) / 10, z: Math.round(mesh.position.z * 10) / 10 } : null)
    }

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
      const savedTransform = sameFurniture ? transformOverridesRef.current[idx] : undefined
      const x = savedTransform ? savedTransform.x : computedPos.x
      const z = savedTransform ? savedTransform.z : computedPos.z
      const size = furnitureSize(item.category)
      const isHiddenItem = hiddenIndices.has(idx)
      const isVisibleNow = !isHiddenItem && !(isIsolating && selectedIndexRef.current !== idx)
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size.w, size.h, size.d),
        new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6, metalness: 0.05, wireframe: wireframeMode })
      )
      mesh.position.set(x, size.h / 2, z)
      if (savedTransform) mesh.rotation.y = savedTransform.rotationY 
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData.index = idx
      mesh.visible = isVisibleNow
      scene.add(mesh)
      meshesForTransformCapture.push(mesh)
      if (mesh.visible) draggables.push(mesh)

      if (idx === justAddedIndex && isVisibleNow) {
        newItemOutline.scale.set(size.w * 1.15, size.h * 1.15, size.d * 1.15)
        newItemOutline.position.copy(mesh.position)
        newItemOutline.rotation.copy(mesh.rotation)
        newItemOutline.visible = true
      }

      if (showLabels && isVisibleNow) {
        const label = makeLabelSprite(item.name || 'Nội thất', item.estimatedCost)
        label.position.set(x, size.h + 0.3, z)
        scene.add(label)
        mesh.userData.label = label
      }

      if (item.modelAssetId) {
        loadAiFurnitureModel(item.modelAssetId, mesh, size)
      } else {
        const staticUrl = pickStaticModel(item.category, room?.id, idx)
        if (staticUrl) {
          loadStaticFurnitureModel(staticUrl, mesh, size)
        }
      }

      if (isEvening && (item.category || '').toLowerCase() === 'lighting') {
        const lampLight = new THREE.PointLight(0xffcf8a, 1.1, 3.2, 2)
        lampLight.position.set(x, size.h * 0.85, z)
        scene.add(lampLight)
      }
    })

    if (selectedIndexRef.current != null) {
      const restored = draggables.find((m) => m.userData.index === selectedIndexRef.current)
      if (restored) selectMesh(restored)
      else selectedIndexRef.current = null
    }

    loadDecorModel(pickDecorModel('rug', room?.id, 0), { x: 0, z: 0 }, Math.min(width, length) * 0.35)
    loadDecorModel(pickDecorModel('plant', room?.id, 1), { x: (width / 2) * 0.75, z: (length / 2) * 0.7 }, 0.6)
    loadDecorModel(pickDecorModel('plant', room?.id, 2), { x: -(width / 2) * 0.75, z: (length / 2) * 0.7 }, 0.5)
    addWallArt(accentColor, width, height, length)

    function attachLoadedModel(gltf, proxyMesh, size) {
      const model = gltf.scene
      const tintHex = itemColorOverrides[proxyMesh.userData.index]
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true
          node.receiveShadow = true
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          materials.forEach((m) => {
            enhanceMaterial(m)
            if (tintHex) m.color.set(tintHex)
            m.wireframe = wireframeMode 
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
          }
        )
      }).catch(() => {
      })
    }

    function loadStaticFurnitureModel(url, proxyMesh, size) {
      gltfLoader.load(
        url,
        (gltf) => {
          if (!modelLoadsCancelled) attachLoadedModel(gltf, proxyMesh, size)
        },
        undefined,
        () => {
        }
      )
    }

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
          model.visible = !decorOnlyMode 
          decorMeshes.push(model)
          scene.add(model)
        },
        undefined,
        () => {
        }
      )
    }

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

      if (!previewMode) {
        const resizeHits = raycaster.intersectObjects(resizeHandles)
        if (resizeHits.length > 0) {
          const handle = resizeHits[0].object
          resizingAxis = handle.userData.axis
          controls.enabled = false
          resizeGrabPoint = handle.position.clone()
          resizeGrabWidth = currentWidth
          resizeGrabLength = currentLength
          return
        }
      }

      const hits = raycaster.intersectObjects(draggables)
      if (hits.length > 0) {
        dragging = hits[0].object
        if (!previewMode && !lockedIndices.has(dragging.userData.index)) {
          controls.enabled = false
          dragPlane.constant = -dragging.position.y
        }
      }
    }

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
        hideAlignGuides()
        setDragWallDistance(null)
        dragFloorHighlight.visible = false 
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
        updateAlignGuides(dragging, nextX, nextZ)
        setDragWallDistance({ toLeft: nextX + width / 2, toBack: nextZ + length / 2 })
        if (selectedMesh === dragging) setSelectedPosition({ x: Math.round(nextX * 10) / 10, z: Math.round(nextZ * 10) / 10 })
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
      setHoveredItemName(null) 
    }

    function onPointerEnter() {
      pointerOverCanvas = true
    }

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

    function onKeyDown(evt) {
      if (!pointerOverCanvas || previewMode) return
      if (!selectedMesh) {
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

    rotateSelectedRef.current = (direction) => {
      if (!selectedMesh || lockedIndices.has(selectedMesh.userData.index)) return // TASK-141
      selectedMesh.rotation.y += direction === 'left' ? -Math.PI / 12 : Math.PI / 12
      selectedMesh.userData.label?.position.set(selectedMesh.position.x, selectedMesh.position.y + 0.6, selectedMesh.position.z)
      syncSelectionOutline()
      setSelectedRotationDeg(rotationRadToDeg(selectedMesh.rotation.y)) // TASK-135
    }

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

    centerSelectedRef.current = () => {
      if (!selectedMesh || lockedIndices.has(selectedMesh.userData.index)) return // TASK-141
      selectedMesh.position.x = 0
      selectedMesh.position.z = 0
      selectedMesh.userData.label?.position.set(0, selectedMesh.position.y + 0.6, 0)
      syncSelectionOutline()
      setSelectedPosition({ x: 0, z: 0 }) // TASK-138
    }

    setRotationRef.current = (deg) => {
      if (!selectedMesh || lockedIndices.has(selectedMesh.userData.index)) return // TASK-141
      const clamped = ((Math.round(deg) % 360) + 360) % 360
      selectedMesh.rotation.y = THREE.MathUtils.degToRad(clamped)
      syncSelectionOutline()
      setSelectedRotationDeg(clamped)
    }

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
      const moved = pointerDownAt ? Math.hypot(evt.clientX - pointerDownAt.x, evt.clientY - pointerDownAt.y) : Infinity
      if (!resizingAxis && moved < 5) selectMesh(dragging || null)
      pointerDownAt = null
      hideAlignGuides() 
      setDragWallDistance(null) 
      dragFloorHighlight.visible = false 

      if (resizingAxis) {
        resizingAxis = null
        resizeGrabPoint = null
        controls.enabled = !cameraLocked 
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
              setResetSignal((n) => n + 1) 
            })
        }
        return
      }

      dragging = null
      controls.enabled = !cameraLocked 
    }

    function onDoubleClick(evt) {
      if (previewMode) return
      toPointer(evt)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(draggables)
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
      prevCameraStateRef.current = { position: camera.position.clone(), target: controls.target.clone(), roomId: room?.id }
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
    <div className="room3d-viewer">
      <div className="no-print">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <button type="button" className={tab === '3d' ? undefined : 'secondary'} onClick={() => setTab('3d')}>
            <Box size={16} aria-hidden="true" /> Không gian 3D
          </button>
          <button type="button" className={tab === '2d' ? undefined : 'secondary'} onClick={() => setTab('2d')}>
            <ImageIcon size={16} aria-hidden="true" /> Ảnh AI (2D)
          </button>
          <button type="button" className={tab === 'plan' ? undefined : 'secondary'} onClick={() => setTab('plan')}>
            <Map size={16} aria-hidden="true" /> Sơ đồ mặt bằng
          </button>
        </div>

      {tab === 'plan' ? (
        <Room2DPlan room={room} furniture={localFurniture} selectedIndex={selectedIndexRef.current} />
      ) : tab === '3d' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
            <span className="room3d-dropdown" ref={cameraMenuRef}>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowCameraMenu((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={showCameraMenu}
              >
                 Góc nhìn ▾
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
                     Góc nhìn đi bộ
                  </button>
                  <button type="button" onClick={() => { resetView(); setShowCameraMenu(false) }} title="Về hẳn góc nhìn mặc định ban đầu (khoảng cách/góc cố định)">
                    ↺ Đặt lại góc nhìn
                  </button>
                  <button type="button" onClick={() => { focusAll(); setShowCameraMenu(false) }} title="Canh khung hình sát đúng khu vực có nội thất hiện có">
                     Xem toàn bộ
                  </button>
                  <button type="button" onClick={() => { centerView(); setShowCameraMenu(false) }} title="Đưa điểm nhìn về giữa phòng, GIỮ NGUYÊN khoảng cách/góc nhìn hiện tại (khác Đặt lại góc nhìn)">
                     Về giữa phòng
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
              {isAutoRotating ? '⏸ Dừng tự xoay' : <><RotateCw size={16} aria-hidden="true" /> Tự động xoay 360°</>}
            </button>
            {selectedFurnitureIndex != null && (
              <>
                <button type="button" className="secondary" onClick={focusOnSelected} title="Camera phóng to, canh giữa đúng vào món đang chọn">
                   Phóng to món đã chọn
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => toggleLock(selectedFurnitureIndex)}
                  title="Khoá vị trí/góc xoay món này — vẫn chọn/xem/đổi màu/xoá được bình thường"
                >
                  {lockedIndices.has(selectedFurnitureIndex) ? ' Mở khoá' : ' Khoá món này'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={toggleIsolate}
                  title={isIsolating ? 'Hiện lại tất cả nội thất' : 'Tạm ẩn mọi món khác, chỉ giữ món đang chọn'}
                >
                  {isIsolating ? '↩️ Hiện lại tất cả' : ' Cô lập món này'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => toggleXrayRef.current()}
                  title="Xem xuyên nhẹ CHỈ món đang chọn (không ẩn/khoá), giúp kiểm tra vị trí bên trong scene"
                >
                  {xrayEnabled ? ' Tắt xuyên nhẹ' : ' Xuyên nhẹ'}
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
                   Về tâm phòng
                </button>
                <span className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                   Góc xoay:
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
                {selectedPosition && (
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                     Vị trí: ({selectedPosition.x}, {selectedPosition.z})m
                  </span>
                )}
                {selectedFurnitureIndex != null && localFurniture[selectedFurnitureIndex] && (() => {
                  const size = furnitureSize(localFurniture[selectedFurnitureIndex].category)
                  return (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                       Kích thước: {size.w}×{size.d}×{size.h}m
                    </span>
                  )
                })()}
              </>
            )}
            <button type="button" className="secondary" onClick={toggleFullscreen}>
              <Maximize2 size={16} aria-hidden="true" /> Toàn màn hình
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setLightingMode((prev) => (prev === 'day' ? 'evening' : 'day'))}
            >
              <Sun size={16} aria-hidden="true" /> {lightingMode === 'evening' ? 'Ban ngày' : 'Buổi tối'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setPreviewMode((prev) => !prev)}
              aria-pressed={previewMode}
              title={previewMode ? 'Đang xem trước — mọi chỉnh sửa bị khoá, bấm để mở khoá' : 'Khoá mọi chỉnh sửa để xem lại an toàn, không sợ bấm nhầm'}
            >
              <Eye size={16} aria-hidden="true" /> {previewMode ? 'Chế độ chỉnh sửa' : 'Chế độ xem trước'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={toggleLabels}
              title="Ẩn/hiện nhãn tên + giá nổi trên mỗi món nội thất"
            >
              {showLabels ? ' Ẩn nhãn' : ' Hiện nhãn'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setSnapStep((prev) => (prev === 0 ? 0.1 : prev === 0.1 ? 0.25 : 0))}
              title="Làm tròn vị trí về lưới khi kéo-thả nội thất bằng chuột, giúp căn hàng thẳng dễ hơn"
            >
              {snapStep === 0 ? ' Snap: Tắt' : ` Snap: ${snapStep}m`}
            </button>
            <span className="room3d-dropdown" ref={moreMenuRef}>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={showMoreMenu}
              >
                <MoreHorizontal size={16} aria-hidden="true" /> Thêm ▾
              </button>
              {showMoreMenu && (
                <span className="room3d-dropdown__menu">
                  <button type="button" onClick={() => { captureScreenshot(1); setShowMoreMenu(false) }}>
                     Tải ảnh (Chuẩn)
                  </button>
                  <button type="button" onClick={() => { captureScreenshot(2); setShowMoreMenu(false) }}>
                     Tải ảnh (Cao — 2x)
                  </button>
                  <button type="button" onClick={() => { captureScreenshot(3); setShowMoreMenu(false) }}>
                     Tải ảnh (Ultra — 3x)
                  </button>
                  <button type="button" onClick={copyScreenshotToClipboard}>
                     Sao chép ảnh{copyImageStatus === 'success' ? ' ' : copyImageStatus === 'error' ? ' (lỗi)' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowShortcutsHelp((prev) => !prev); setShowMoreMenu(false) }}
                  >
                     Phím tắt
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRoomSurfaces((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {showRoomSurfaces ? ' Ẩn tường/sàn' : ' Hiện tường/sàn'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWireframeMode((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {wireframeMode ? ' Chế độ đặc' : ' Chế độ khung dây'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraSpeed((prev) => (prev === 'slow' ? 'normal' : prev === 'normal' ? 'fast' : 'slow'))
                      setShowMoreMenu(false)
                    }}
                  >
                    {cameraSpeed === 'slow' ? ' Tốc độ camera: Chậm' : cameraSpeed === 'fast' ? ' Tốc độ camera: Nhanh' : ' Tốc độ camera: Bình thường'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShadowsEnabled((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {shadowsEnabled ? ' Tắt bóng đổ' : ' Bật bóng đổ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBrightnessLevel((prev) => (prev + 1) % 5); setShowMoreMenu(false) }}
                  >
                    {[' Độ sáng: Rất tối', ' Độ sáng: Tối', ' Độ sáng: Bình thường', ' Độ sáng: Sáng', ' Độ sáng: Rất sáng'][brightnessLevel]}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDecorOnlyMode((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {decorOnlyMode ? ' Hiện đồ trang trí' : ' Chỉ nội thất'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowGrid((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {showGrid ? '▦ Ẩn lưới sàn' : '▦ Hiện lưới sàn'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCameraLocked((prev) => !prev); setShowMoreMenu(false) }}
                  >
                    {cameraLocked ? ' Mở khoá góc nhìn' : ' Khoá góc nhìn'}
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
              <li>Nút " Tự động xoay 360°": xoay camera liên tục quanh phòng, không cần giữ chuột</li>
              <li>Nút " Góc nhìn đi bộ": chuyển sang góc nhìn ngang tầm mắt, như đang đứng trong phòng</li>
              <li>Ctrl/Cmd+Z: Hoàn tác thêm/xoá/nhân đôi/sửa giá/đổi màu — hoặc nút "↶ Hoàn tác"</li>
              <li>Ctrl/Cmd+Shift+Z hoặc Ctrl/Cmd+Y: Làm lại — hoặc nút "↷ Làm lại"</li>
              <li>Nút " Chế độ xem trước": khoá mọi chỉnh sửa (thêm/xoá/kéo-thả/đổi màu/xoay), vẫn xoay góc nhìn/đổi tab/chọn món để xem được</li>
              <li>Nút / trong danh sách nội thất: ẩn/hiện tạm 1 món khỏi scene (không xoá) — bấm vào tên món để chọn nhanh, kể cả khi đang ẩn</li>
              <li>Nút " Ẩn/Hiện tường-sàn" (trong "⋯ Thêm"): tạm ẩn sàn + 2 mặt tường để nhìn nội thất rõ hơn khi chỉnh bố cục</li>
              <li>Đang kéo 1 món: dòng " Cách tường trái/sau" phía trên khung 3D hiện khoảng cách thật tới 2 mặt tường</li>
              <li>Nút " Về tâm phòng": đưa món đang chọn về đúng giữa phòng, giữ nguyên góc xoay — khác "↺ Đặt lại vị trí/góc xoay" (về vị trí ban đầu + góc xoay 0°)</li>
              <li>Dòng " Góc xoay": hiện góc xoay hiện tại (độ) của món đang chọn, cập nhật ngay khi xoay</li>
              <li>Nút " Chế độ khung dây" (trong "⋯ Thêm"): nhìn xuyên nội thất dạng khung dây, dễ phát hiện món bị che khuất</li>
              <li>Nút tốc độ camera (trong "⋯ Thêm"): 3 mức Chậm/Bình thường/Nhanh cho xoay/pan/zoom bằng chuột</li>
              <li>Nút " Sao chép ảnh" (trong "⋯ Thêm"): sao chép khung hình 3D hiện tại thẳng vào clipboard, dán được ngay vào ứng dụng khác</li>
              <li>Ô nhập cạnh "Góc xoay": gõ trực tiếp số độ (0-359) thay vì bấm nhiều lần nút xoay</li>
              <li>Esc (khi đang chọn 1 món, không có dropdown/menu nào mở): bỏ chọn món ngay</li>
              <li>Nút "/ bóng đổ" và "/ Độ sáng" (trong "⋯ Thêm"): tắt bóng đổ hoặc chỉnh độ sáng scene, độc lập với chế độ Ngày/Đêm</li>
              <li>Nút " Về giữa phòng" (trong "Góc nhìn ▾"): đưa điểm nhìn CAMERA về giữa phòng, giữ nguyên khoảng cách/góc nhìn — khác " Về tâm phòng" (di chuyển nội thất đang chọn)</li>
              <li>Nút " Hoạt động gần đây": xem thêm vài thao tác gần nhất (không chỉ 1 mục như dòng "Thao tác gần nhất")</li>
              <li>Nút " Chỉ nội thất" (trong "⋯ Thêm"): tạm ẩn thảm/chậu cây/tranh tường, giữ nguyên nội thất chính</li>
              <li>W/A/S/D (khi CHƯA chọn món nào): điều khiển camera — giống hệt phím mũi tên tương ứng</li>
              <li>Rê chuột lên 1 món (không cần click): tên món hiện ngay gần con trỏ</li>
              <li>Camera giữ nguyên vị trí/góc nhìn qua mọi thao tác bật/tắt khác (Ẩn nhãn, Buổi tối, Khung dây...) — chỉ đổi khi bấm "Đặt lại góc nhìn" hoặc chuyển sang thiết kế khác</li>
              <li>Nút "/ Khoá món này": khoá vị trí/góc xoay món đang chọn (tránh kéo/xoay nhầm), vẫn chọn/xem/đổi màu/xoá được</li>
              <li>Nút " Cô lập món này"/"↩️ Hiện lại tất cả": tạm ẩn mọi món khác để tập trung chỉnh 1 món cụ thể</li>
              <li>Nút "▦ Hiện/Ẩn lưới sàn" (trong "⋯ Thêm"): lưới tham chiếu trên mặt sàn, độc lập với Snap-to-Grid</li>
              <li>Đang kéo 1 món: vùng sàn ngay dưới món được tô sáng nhẹ theo thời gian thực</li>
            </ul>
          )}
          {dragWallDistance && (
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 6px' }}>
               Cách tường trái: {dragWallDistance.toLeft.toFixed(1)}m · Cách tường sau: {dragWallDistance.toBack.toFixed(1)}m
            </p>
          )}
          <div ref={mountRef} className="room3d-mount" />
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
                 x Xoá
              </button>
              <button
                type="button"
                onClick={() => { toggleVisibility(contextMenu.index); setContextMenu(null) }}
              >
                {hiddenIndices.has(contextMenu.index) ? ' Hiện lại' : ' Ẩn tạm'}
              </button>
              <button
                type="button"
                disabled={previewMode}
                onClick={() => { resetSelectedTransform(); setContextMenu(null) }}
              >
                ↺ Đặt lại vị trí/góc xoay
              </button>
              <button type="button" onClick={() => { focusOnSelected(); setContextMenu(null) }}>
                 🕒 Phóng to
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
            <div style={{ display: furniturePanelOpen ? undefined : 'none' }}>
            <fieldset disabled={previewMode} style={{ border: 0, margin: 0, padding: 0 }}>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>
              {localFurniture.length} món · tổng ước tính{' '}
              {localFurniture.reduce((sum, item) => sum + (item.estimatedCost || 0), 0).toLocaleString('vi-VN')} đ
            </p>
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
            {budget > 0 && (() => {
              const total = localFurniture.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
              const over = total - budget
              if (over <= 0) {
                return (
                  <p style={{ fontSize: '0.85rem', margin: '0 0 8px', color: 'var(--color-accent-dark)' }}>
                     Trong ngân sách, còn dư {(-over).toLocaleString('vi-VN')} đ
                  </p>
                )
              }
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
                     Vượt ngân sách {over.toLocaleString('vi-VN')} đ
                  </p>
                  {removingPriciestEnough ? (
                    <button type="button" className="secondary" onClick={() => removeFurniture(priciest.index)}>
                       Xoá "{priciest.item.name || 'Nội thất'}" ({(priciest.item.estimatedCost || 0).toLocaleString('vi-VN')} đ) để về đúng ngân sách
                    </button>
                  ) : (
                    <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                       Cần bớt khoảng {itemsNeeded} món giá trị cao nhất để về đúng ngân sách.
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
                      {hiddenIndices.has(idx) ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
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
                    {lockedIndices.has(idx) && <span title="Đã khoá vị trí/góc xoay"><LockKeyhole size={14} aria-hidden="true" /></span>}
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
                      <Copy size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="room3d-furniture-remove"
                      aria-label={`Xoá ${item.name || 'món nội thất này'}`}
                      onClick={() => removeFurniture(idx)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
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
                {history.length > 1 && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setShowRecentActions((prev) => !prev)}
                    aria-expanded={showRecentActions}
                  >
                     Hoạt động gần đây
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
                  <span className="room3d-furniture-group-label"> Vừa dùng gần đây</span>
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
              placeholder=" Tìm loại đồ (vd: bàn, đèn, may)... (phím / để focus nhanh)"
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
                : (() => {
                    const roomWidth = room?.widthMeters > 0 ? room.widthMeters : DEFAULT_SIZE_METERS
                    const roomLength = room?.lengthMeters > 0 ? room.lengthMeters : DEFAULT_SIZE_METERS
                    return ` Kích thước phòng: ${roomWidth.toFixed(1)}m × ${roomLength.toFixed(1)}m (diện tích ${(roomWidth * roomLength).toFixed(1)} m²) — Kéo chuột để xoay/pan, cuộn để zoom. Kéo chấm đỏ để đổi kích thước phòng, kéo một món nội thất để đổi vị trí, nhấp đúp để xoay 90°, nhấp 1 lần để chọn rồi dùng phím mũi tên/Delete (chỉ trong phiên xem này, chưa lưu lại).`
                  })()}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="secondary" onClick={exportLayout} title="Lưu bố trí hiện tại (nội thất + màu) thành file JSON trên máy">
                 Lưu bố trí
              </button>
              <button type="button" className="secondary" disabled={previewMode} onClick={() => importInputRef.current?.click()} title="Khôi phục bố trí đã lưu từ file JSON">
                 Tải bố trí đã lưu
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
                   Xoá món tự thêm
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
                onClick={() => setImageLightboxOpen(false)}
              >
                <button
                  type="button"
                  aria-label="Đóng ảnh phóng to"
                  title="Đóng"
                  onClick={() => setImageLightboxOpen(false)}
                  style={{ position: 'absolute', top: 16, right: 16, zIndex: 1, borderRadius: '50%', padding: 8, display: 'grid', placeItems: 'center' }}
                ><X size={20} aria-hidden="true" /></button>
                <img src={imageUrl} alt="Ảnh AI phóng to" />
              </div>
            )}
          </>
        ) : (
          <div className="viewer-3d-placeholder">Chưa có ảnh AI để hiển thị.</div>
        )
      )}
      </div>

      <div className="room3d-print-plan">
        <h3>Sơ đồ mặt bằng</h3>
        <Room2DPlan room={room} furniture={localFurniture} />
      </div>
    </div>
  )
}
