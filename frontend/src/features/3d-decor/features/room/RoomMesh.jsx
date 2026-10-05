import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../../stores/useSceneStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { getMaterialTextureBundle } from '../materials/textureGenerators';
import { FLOOR_MATERIALS, WALL_MATERIALS } from '../../constants/roomDefaults';
import {
  computeVertexMiterOffsets,
  buildThickWallGeometries,
  buildFloorShape,
  getOpeningsForSegment,
  getSegmentWorld,
} from './wallGraphUtils';
import { WallOpeningItem } from './WallOpeningItem';

/**
 * Component dựng cấu trúc căn phòng 3D hoàn chỉnh:
 * 1. Sàn nhà phẳng dạng polygon tạo trực tiếp từ các đỉnh tường kèm PBR material & bump map
 * 2. Lưới toạ độ sàn
 * 3. Tường 3D đùn từ tứ giác đáy ghép miter phân giác với texture metric chuẩn xác
 * 4. Lỗ khoét cửa và cửa sổ kèm khung 3D & kính
 * 5. Hỗ trợ tường điểm nhấn (Accent Wall) riêng lẻ cho từng đoạn tường
 */
export function RoomMesh() {
  const room = useSceneStore((state) => state.room);
  const wallGraph = useSceneStore((state) => state.wallGraph);
  const showGrid = useEditorStore((state) => state.showGrid);
  const transparentWalls = useEditorStore((state) => state.transparentWalls);
  const activeTab = useEditorStore((state) => state.activeTab);

  const selectedSegmentId = useSceneStore((state) => state.selectedSegmentId);
  const selectItem = useSceneStore((state) => state.selectItem);
  const selectOpening = useSceneStore((state) => state.selectOpening);
  const selectSegment = useSceneStore((state) => state.selectSegment);

  const {
    width = 6,
    length = 5,
    floorColor = '#d6c7b2',
    floorMaterialId = 'wood-straight',
    floorRepeat = 1.0,
    floorRoughness = 0.45,
    wallColor = '#f1f5f9',
    wallMaterialId = 'wall-paint',
    wallRepeat = 1.0,
    wallRoughness = 0.65,
  } = room;

  // 1. Tính toán Miter Bisector Offsets cho toàn bộ các đỉnh
  const miterOffsets = useMemo(() => {
    return computeVertexMiterOffsets(wallGraph);
  }, [wallGraph]);

  // 2. Tính toán các geometries 3D của tường kèm lỗ khoét cửa/cửa sổ
  const wallSegmentsData = useMemo(() => {
    const list = [];
    const { segments, vertices } = wallGraph;

    for (const seg of Object.values(segments)) {
      const openingsOnSeg = getOpeningsForSegment(wallGraph, seg.id);
      const geometries = buildThickWallGeometries(seg, vertices, miterOffsets, openingsOnSeg, wallGraph);
      const sw = getSegmentWorld(seg, vertices);

      list.push({
        id: seg.id,
        seg,
        geometries,
        openings: openingsOnSeg,
        sw,
        label: seg.label,
      });
    }

    return list;
  }, [wallGraph, miterOffsets]);

  // 3. Tính hình phẳng Sàn nhà từ chu trình các đỉnh tường
  const floorShape = useMemo(() => {
    return buildFloorShape(wallGraph);
  }, [wallGraph]);

  // Bounding box của sàn
  const floorBounds = useMemo(() => {
    const verts = Object.values(wallGraph.vertices);
    if (verts.length === 0) {
      return { minX: -width / 2, maxX: width / 2, minZ: -length / 2, maxZ: length / 2 };
    }
    const xs = verts.map((v) => v.x);
    const zs = verts.map((v) => v.z);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
    };
  }, [wallGraph.vertices, width, length]);

  const floorWidth = Math.max(width, floorBounds.maxX - floorBounds.minX + 0.3);
  const floorLength = Math.max(length, floorBounds.maxZ - floorBounds.minZ + 0.3);
  const floorCenterX = (floorBounds.minX + floorBounds.maxX) / 2;
  const floorCenterZ = (floorBounds.minZ + floorBounds.maxZ) / 2;

  // ── 4. Texture & Vật Liệu Sàn Nhà ──────────────────────────────────────────
  const floorMatDef = useMemo(() => {
    return FLOOR_MATERIALS.find((m) => m.id === floorMaterialId) || FLOOR_MATERIALS[0];
  }, [floorMaterialId]);

  const floorBundle = useMemo(() => {
    return getMaterialTextureBundle('floor', floorMaterialId, floorColor);
  }, [floorMaterialId, floorColor]);

  // Cập nhật tỷ lệ lặp hoa văn sàn chuẩn theo kích thước vật lý (mét)
  useEffect(() => {
    if (!floorBundle?.map) return;
    const physW = floorMatDef.physicalWidth ?? 1.2;
    const physL = floorMatDef.physicalLength ?? 1.2;
    const userScale = floorRepeat || 1.0;

    // Số lần lặp = chiều dài thực tế mặt sàn / (kích thước thật của hoa văn * tỷ lệ người dùng chọn)
    const repX = floorWidth / (physW * userScale);
    const repZ = floorLength / (physL * userScale);

    floorBundle.map.repeat.set(repX, repZ);
    if (floorBundle.bumpMap) {
      floorBundle.bumpMap.repeat.set(repX, repZ);
    }
  }, [floorBundle, floorWidth, floorLength, floorRepeat, floorMatDef]);

  const floorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: floorBundle.map,
      bumpMap: floorBundle.bumpMap,
      bumpScale: floorBundle.bumpScale || 0.02,
      roughness: floorRoughness ?? floorBundle.roughness ?? 0.45,
      metalness: floorBundle.metalness ?? 0.02,
      side: THREE.DoubleSide,
    });
  }, [floorBundle, floorRoughness]);

  useEffect(() => {
    return () => {
      floorMaterial.dispose();
    };
  }, [floorMaterial]);

  // ── 5. Texture & Vật Liệu Tường Mặc Định ────────────────────────────────────
  const wallMatDef = useMemo(() => {
    return WALL_MATERIALS.find((m) => m.id === wallMaterialId) || WALL_MATERIALS[0];
  }, [wallMaterialId]);

  const defaultWallBundle = useMemo(() => {
    return getMaterialTextureBundle('wall', wallMaterialId, wallColor);
  }, [wallMaterialId, wallColor]);

  useEffect(() => {
    if (!defaultWallBundle?.map) return;
    const physW = wallMatDef.physicalWidth ?? 1.0;
    const physH = wallMatDef.physicalLength ?? 1.0;
    const userScale = wallRepeat || 1.0;

    // UVs của tường tính theo mét thực tế [u, y]
    const repU = 1 / (physW * userScale);
    const repV = 1 / (physH * userScale);

    defaultWallBundle.map.repeat.set(repU, repV);
    if (defaultWallBundle.bumpMap) {
      defaultWallBundle.bumpMap.repeat.set(repU, repV);
    }
  }, [defaultWallBundle, wallRepeat, wallMatDef]);

  const defaultWallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: defaultWallBundle.map,
      bumpMap: defaultWallBundle.bumpMap,
      bumpScale: defaultWallBundle.bumpScale || 0.02,
      roughness: wallRoughness ?? defaultWallBundle.roughness ?? 0.65,
      metalness: defaultWallBundle.metalness ?? 0.02,
      side: THREE.DoubleSide,
      shadowSide: THREE.FrontSide,
    });
  }, [defaultWallBundle, wallRoughness]);

  useEffect(() => {
    return () => {
      defaultWallMaterial.dispose();
    };
  }, [defaultWallMaterial]);

  // ── 6. Map Vật Liệu Từng Đoạn Tường (Hỗ trợ Tường Điểm Nhấn - Accent Wall) ─
  const segmentMaterials = useMemo(() => {
    const matMap = {};
    for (const seg of Object.values(wallGraph.segments || {})) {
      const isCustomMat = seg.materialId && seg.materialId !== 'wall-default' && seg.materialId !== wallMaterialId;
      const isCustomColor = seg.color && seg.color !== wallColor;

      if (!isCustomMat && !isCustomColor) {
        matMap[seg.id] = defaultWallMaterial;
        continue;
      }

      const activeMatId = isCustomMat ? seg.materialId : wallMaterialId;
      const activeColor = isCustomColor ? seg.color : wallColor;
      const bundle = getMaterialTextureBundle('wall', activeMatId, activeColor);

      const segDef = WALL_MATERIALS.find((m) => m.id === activeMatId) || WALL_MATERIALS[0];
      const physW = segDef.physicalWidth ?? 1.0;
      const physH = segDef.physicalLength ?? 1.0;
      const rep = wallRepeat || 1.0;
      const repU = 1 / (physW * rep);
      const repV = 1 / (physH * rep);

      bundle.map.repeat.set(repU, repV);
      if (bundle.bumpMap) bundle.bumpMap.repeat.set(repU, repV);

      matMap[seg.id] = new THREE.MeshStandardMaterial({
        map: bundle.map,
        bumpMap: bundle.bumpMap,
        bumpScale: bundle.bumpScale || 0.02,
        roughness: wallRoughness ?? bundle.roughness ?? 0.65,
        metalness: bundle.metalness ?? 0.02,
        side: THREE.DoubleSide,
        shadowSide: THREE.FrontSide,
      });
    }
    return matMap;
  }, [wallGraph.segments, wallMaterialId, wallColor, wallRepeat, wallRoughness, defaultWallMaterial]);

  useEffect(() => {
    return () => {
      for (const mat of Object.values(segmentMaterials)) {
        if (mat !== defaultWallMaterial) {
          mat.dispose();
        }
      }
    };
  }, [segmentMaterials, defaultWallMaterial]);

  // ── 7. Camera Cutaway ──────────────────────────────────────────────────────
  const wallGroupRefs = useRef({});

  useFrame(({ camera }) => {
    const shouldCutaway = activeTab !== '2d-plan' && transparentWalls;

    for (const segData of wallSegmentsData) {
      const grp = wallGroupRefs.current[segData.id];
      if (!grp) continue;

      if (!shouldCutaway || !segData.sw) {
        grp.visible = true;
        continue;
      }

      const { start, end, normal } = segData.sw;
      const midX = (start.x + end.x) / 2;
      const midZ = (start.z + end.z) / 2;

      const outNx = -normal.x;
      const outNz = -normal.z;

      const toCamX = camera.position.x - midX;
      const toCamZ = camera.position.z - midZ;

      const dot = toCamX * outNx + toCamZ * outNz;
      grp.visible = dot <= 0.05;
    }
  });

  return (
    <group>
      {/* 1. Mặt sàn nhà phẳng dạng Polygon */}
      {floorShape ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.001, 0]}
          material={floorMaterial}
          receiveShadow
          onPointerDown={(e) => {
            if (e.button === 0) {
              selectItem(null);
              selectOpening(null);
              selectSegment(null);
            }
          }}
        >
          <shapeGeometry args={[floorShape]} />
        </mesh>
      ) : (
        <mesh
          position={[floorCenterX, -0.001, floorCenterZ]}
          material={floorMaterial}
          receiveShadow
          onPointerDown={(e) => {
            if (e.button === 0) {
              selectItem(null);
              selectOpening(null);
              selectSegment(null);
            }
          }}
        >
          <boxGeometry args={[floorWidth, 0.002, floorLength]} />
        </mesh>
      )}

      {/* 2. Lưới toạ độ trên sàn */}
      {showGrid && (
        <gridHelper
          args={[
            Math.max(floorWidth, floorLength) * 1.5,
            Math.round(Math.max(floorWidth, floorLength) * 3),
            '#2563eb',
            '#94a3b8',
          ]}
          position={[floorCenterX, 0.003, floorCenterZ]}
        />
      )}

      {/* 3. Tường 3D đùn miter phân giác với lỗ khoét cửa/cửa sổ & Accent Materials */}
      <group>
        {wallSegmentsData.map((segData) => {
          const segMat = segmentMaterials[segData.id] || defaultWallMaterial;
          const isSelected = selectedSegmentId === segData.id;

          return (
            <group
              key={segData.id}
              ref={(el) => {
                if (el) wallGroupRefs.current[segData.id] = el;
                else delete wallGroupRefs.current[segData.id];
              }}
            >
              {/* Các khối lăng trụ của đoạn tường */}
              {segData.geometries.map((geo, idx) => (
                <group key={`${segData.id}-part-${idx}`}>
                  <mesh
                    geometry={geo}
                    material={segMat}
                    receiveShadow
                    castShadow
                    onPointerDown={(e) => {
                      if (e.button === 0) {
                        e.stopPropagation();
                        selectSegment(segData.id);
                        selectItem(null);
                        selectOpening(null);
                      }
                    }}
                  />
                  {/* Viền highlight khi đoạn tường được chọn */}
                  {isSelected && (
                    <mesh geometry={geo}>
                      <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.65} />
                    </mesh>
                  )}
                </group>
              ))}

              {/* Cửa và cửa sổ tương tác */}
              {segData.openings.map((op) => (
                <WallOpeningItem key={op.id} op={op} segData={segData} />
              ))}
            </group>
          );
        })}
      </group>
    </group>
  );
}
