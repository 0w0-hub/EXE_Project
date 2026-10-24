# Current Phase

**AI_INTEGRATION**

Đã hoàn thành: knowledge base (PROJECT_BOOTSTRAP) + scaffold code chạy được thật end-to-end (backend, frontend, database, Docker) + 4 tính năng SaaS (templates, lịch sử phân trang, giới hạn gói/usage, admin panel) + ADR-0003 chốt ACCEPTED và implement `ReplicateAiDesignProvider` (vision + image-gen thật), tất cả verify qua unit test + regression Docker E2E với mock.

Đã hoàn thành thêm: `Room3DViewer` (three.js) thay `Room3DViewerPlaceholder` — scene 3D thật, camera orbit, kéo-thả nội thất cơ bản, verify E2E qua Docker + browser thật (TASK-004).

Đã hoàn thành thêm (ADR-0005, TASK-005/006/007): 2D redesign giữ bố cục phòng thật qua ControlNet (`rocketdigitalai/interior-design-sdxl`), sinh mesh 3D thật cho 1 món nội thất "hero" (`firtoz/trellis`, `GLTFLoader`), kéo tường trong `Room3DViewer` để đổi kích thước phòng + persist qua API mới — tất cả verify unit test + regression Docker E2E mock; riêng 2 model mới ADR-0005 field input/output best-effort chưa xác thực.

Đã hoàn thành thêm (TASK-008/009, ngoài luồng AI): recode toàn bộ giao diện frontend theo mockup Stitch/Figma user duyệt — design token bảng màu "Peacock Feather" + font Plus Jakarta Sans/Inter, áp dụng cho toàn bộ 10 route; verify E2E thật qua Docker + browser (không phải mock), không hồi quy chức năng.

Còn lại trong phase này (chưa xong): verify E2E thật với `AI_PROVIDER=replicate` + key thật (chờ user cung cấp `REPLICATE_API_KEY`), bao gồm xác nhận/sửa field input của 2 model mới ADR-0005 nếu cần.
