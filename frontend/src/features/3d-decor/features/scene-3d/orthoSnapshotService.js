/**
 * orthoSnapshotService.js — Chụp ảnh trực giao 3D (Orthographic Top-Down) từ file .glb
 *
 * Tính năng:
 * - Dùng offscreen THREE.WebGLRenderer và THREE.OrthographicCamera nhìn thẳng từ trên xuống (-Y)
 * - Tự động tải file GLTF .glb thực tế
 * - Căn chỉnh tâm và scale model đúng theo kích thước width x depth của đồ vật
 * - Bố trí hệ thống ánh sáng 3 điểm (Ambient + Key Directional + Fill Directional)
 * - Xuất ảnh PNG trong suốt độ nét cao (512px)
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let renderer = null;
let scene = null;
let camera = null;
let keyLight = null;
let gltfLoader = null;
const modelCache = new Map(); // modelPath -> loaded gltf scene

function getOrthoContext() {
  if (renderer) return { renderer, scene, camera, keyLight };

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  // Bật hệ thống tính toán bóng đổ mềm
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();

  // 1. Ánh sáng môi trường dịu nhẹ giữ tỷ lệ tương phản sáng tối (Chiaroscuro)
  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  // 2. Nguồn sáng chính mặt trời kiến trúc chiếu xiên 45 độ tạo bóng đổ tự nhiên
  keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  keyLight.position.set(3.5, 12, 3.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.radius = 3;
  scene.add(keyLight);

  // 3. Nguồn sáng phụ fill light làm dịu các vùng tối khuất
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-3.5, 8, -3.5);
  scene.add(fillLight);

  // 4. Ánh sáng viền nhẹ (rim light) từ phía sau định hình đường cong mép vật thể
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
  rimLight.position.set(0, 6, -5);
  scene.add(rimLight);

  // 5. Mặt phẳng sàn hứng bóng trong suốt (Shadow Receiver)
  // ShadowMaterial có đặc tính: trong suốt 100% nhưng hiển thị bóng đổ tiếp xúc mềm của vật thể
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.38 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Camera trực giao: nhìn từ +Y xuống gốc toạ độ (0, 0, 0)
  // Vector up = (0, 0, -1) để cạnh trên của ảnh là -Z (phía sau), cạnh dưới là +Z (mặt trước)
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 15, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  gltfLoader = new GLTFLoader();

  return { renderer, scene, camera, keyLight };
}

/**
 * Tải model GLTF với cache bộ nhớ
 */
async function loadGLTF(path) {
  if (modelCache.has(path)) {
    return modelCache.get(path);
  }
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        modelCache.set(path, gltf);
        resolve(gltf);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

/**
 * Chụp ảnh trực giao từ trên xuống cho một món đồ nội thất
 * @param {Object} item Thông tin món đồ (dimensions, modelPath, modelType)
 * @returns {Promise<string|null>} DataURL PNG của ảnh chụp
 */
export async function renderOrthoSnapshot(item) {
  if (!item || !item.modelPath) return null;

  try {
    const { renderer: ren, scene: sc, camera: cam, keyLight: kLight } = getOrthoContext();
    const gltf = await loadGLTF(item.modelPath);
    if (!gltf || !gltf.scene) return null;

    const clone = gltf.scene.clone(true);

    // 1. Tính toán bounding box ban đầu
    const bbox = new THREE.Box3().setFromObject(clone);
    const rawSize = new THREE.Vector3();
    bbox.getSize(rawSize);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const targetW = item.dimensions?.width || 1;
    const targetH = item.dimensions?.height || 1;
    const targetD = item.dimensions?.depth || 1;

    // 2. Co giãn model đúng kích thước thực tế
    const scaleX = rawSize.x > 0 ? targetW / rawSize.x : 1;
    const scaleY = rawSize.y > 0 ? targetH / rawSize.y : 1;
    const scaleZ = rawSize.z > 0 ? targetD / rawSize.z : 1;
    clone.scale.set(scaleX, scaleY, scaleZ);

    // 3. Đưa tâm X, Z về 0, đáy Y về 0
    clone.position.set(
      -center.x * scaleX,
      -bbox.min.y * scaleY,
      -center.z * scaleZ
    );

    // Bật đổ bóng và nhận bóng cho toàn bộ mesh con, giữ nguyên 100% vật liệu và màu sắc gốc của file .glb
    const clonedMaterials = [];
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = item.modelType !== 'lamp';
        child.receiveShadow = true;
        if (child.material) {
          const mat = child.material.clone();
          mat.side = THREE.DoubleSide;
          mat.shadowSide = THREE.DoubleSide;
          child.material = mat;
          clonedMaterials.push(mat);
        }
      }
    });

    sc.add(clone);

    // Điều chỉnh vùng camera shadow để phủ trọn món đồ
    if (kLight && kLight.shadow && kLight.shadow.camera) {
      const maxDim = Math.max(targetW, targetD, targetH, 1.5);
      kLight.shadow.camera.left = -maxDim * 1.4;
      kLight.shadow.camera.right = maxDim * 1.4;
      kLight.shadow.camera.top = maxDim * 1.4;
      kLight.shadow.camera.bottom = -maxDim * 1.4;
      kLight.shadow.camera.updateProjectionMatrix();
    }

    // 4. Thiết lập khung canvas và camera khớp tỉ lệ hình học của vật thể
    // Chiều rộng canvas chuẩn 512px, chiều cao theo tỉ lệ targetD / targetW
    const canvasW = 512;
    const canvasH = Math.max(96, Math.min(1024, Math.round(512 * (targetD / targetW))));
    ren.setSize(canvasW, canvasH);

    // Frustum camera bao trọn vật thể kèm lề an toàn 8% để bóng tiếp xúc không bị cụt
    const pad = 1.08;
    const halfW = (targetW / 2) * pad;
    const halfD = (targetD / 2) * pad;
    cam.left = -halfW;
    cam.right = halfW;
    cam.top = halfD;
    cam.bottom = -halfD;
    cam.updateProjectionMatrix();

    // 5. Render và trích xuất DataURL
    ren.render(sc, cam);
    const dataUrl = ren.domElement.toDataURL('image/png');

    // Dọn dẹp object và giải phóng bộ nhớ vật liệu khỏi scene
    sc.remove(clone);
    for (const mat of clonedMaterials) {
      mat.dispose();
    }

    return dataUrl;
  } catch (err) {
    console.warn('[orthoSnapshotService] Không thể chụp ảnh 3D cho model:', item.modelPath, err);
    return null;
  }
}
