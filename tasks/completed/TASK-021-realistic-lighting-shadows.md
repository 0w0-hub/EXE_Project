# TASK-021

## Title

Nâng chất lượng hình ảnh `Room3DViewer` cho giống thật hơn (đổ bóng, tone mapping, texture sàn)

## Goal

Theo phản hồi user ("Tôi thấy mô hình 3D vẫn đang rất xấu... làm đẹp hơn nhìn giống thật"), cải thiện chất lượng hình ảnh của scene 3D bằng các kỹ thuật render tiêu chuẩn (không đổi model nội thất, không cần asset mới) — trọng tâm là thứ khiến scene trông "phẳng như dán giấy": không có bóng đổ, màu tone-mapping mặc định phẳng, sàn/tường là màu phẳng tuyệt đối, viền phòng như khung wireframe debug.

## Scope

`frontend/src/components/Room3DViewer.jsx`:

- **Đổ bóng thật**: bật `renderer.shadowMap.enabled` (`PCFSoftShadowMap`); đèn chính (`DirectionalLight`) đổ bóng, cấu hình `shadow.camera` (ortho frustum) khớp kích thước phòng + `shadow.mapSize` 1024; sàn `receiveShadow`; tường `receiveShadow`; khối hộp nội thất + model GLB (AI thật lẫn tĩnh CC0, qua `model.traverse`) đều `castShadow`/`receiveShadow`.
- **Tone mapping + màu sắc tự nhiên hơn**: `renderer.toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 1.05`; thêm đèn phụ (`fillLight`, không đổ bóng) làm dịu phía tối; tăng nhẹ cường độ đèn chính để bù lại tone mapping làm tối ảnh.
- **Texture sàn thay màu phẳng**: `makeFloorTexture(hexColor)` — vẽ bằng canvas (không tải ảnh ngoài, không rủi ro bản quyền) tạo hoạ tiết ván lát so le + đường viền mờ, nhuộm đúng theo màu sàn hiện tại (AI thật hoặc override từ TASK-020); áp làm `map` cho vật liệu sàn kèm `roughness/metalness` hợp lý.
- **Nền gradient thay màu phẳng**: `makeBackgroundTexture(hexColor)` — gradient dọc nhẹ theo đúng tông màu thương hiệu hiện tại, thay `scene.background` dạng `THREE.Color` phẳng.
- **Viền phòng dịu hơn**: outline (2 mặt tường còn thiếu) đổi sang `transparent + opacity 0.45` thay vì nét đặc, đỡ giống khung wireframe "debug".
- Set `texture.colorSpace = THREE.SRGBColorSpace` cho mọi `CanvasTexture` mới (bắt buộc với three.js quản lý màu hiện đại, tránh màu bị lệch tông).

## Out of scope

- Không đổi model nội thất (giữ nguyên bộ CC0 Kenney từ TASK-018/020), không thêm asset/texture tải từ ngoài.
- Không đổi raycasting/kéo-thả/kéo-resize, không đổi backend/API.
- Không thêm môi trường phản chiếu (envMap/HDRI) — vượt quá nhu cầu cho 1 preview nhẹ trong trình duyệt.

## Dependencies

TASK-020 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật qua Docker + browser: scene hiển thị bóng đổ rõ dưới mọi món nội thất (kể cả sau khi model GLB tải xong, không phải bóng hình hộp lộ ra khi đã có model thật); sàn có hoạ tiết ván lát rõ, đổi đúng theo màu chọn ở bảng màu (TASK-020); nền có gradient nhẹ; không hồi quy kéo-thả/kéo-resize/tab 2D-3D/bảng chọn màu/biến thể model.
- Console sạch lỗi trong suốt quá trình test.

## Testing

- Xác nhận kỹ thuật shadow đúng qua đọc thẳng source `three` (`node_modules/three/src/renderers/webgl/WebGLShadowMap.js`) — xác nhận nhánh `else if (material.visible)` nghĩa là khi model GLB thật đã gắn vào (proxy box set `material.visible = false`), box không còn đổ bóng hộp giả — chỉ mesh GLB thật (đã bật `castShadow` qua `traverse`) đổ bóng đúng hình dạng.
- `npm run build` PASS.
- Docker rebuild `frontend` + browser thật (Claude in Chrome), job `1cb66743-1f03-4b1f-b733-e63b42394f91`:
  - Zoom xác nhận bóng đổ mềm dưới sofa/bàn/kệ/đèn sàn, sàn có hoạ tiết ván lát rõ ràng (không còn phẳng 1 màu), nền có gradient nhẹ.
  - Đổi màu sàn sang tông gỗ walnut (#B08D63) qua bảng màu TASK-020 → xác nhận hoạ tiết ván lát hiện đúng theo tông màu mới.
  - Reset màu (nút "Mặc định") → quay lại đúng texture sàn theo màu AI/fallback ban đầu.
  - Chuyển tab "Ảnh AI (2D)" ↔ "Không gian 3D", "Đặt lại bố trí" (qua JS do vướng lệch toạ độ click canvas — ghi nhận lại đây là vấn đề công cụ, không phải lỗi app, đã có trong Known Issues) → scene dựng lại đúng, bóng/texture không đổi bất thường.
  - `read_console_messages(onlyErrors=true)` — sạch lỗi trong toàn bộ quá trình.

## Status

COMPLETED
