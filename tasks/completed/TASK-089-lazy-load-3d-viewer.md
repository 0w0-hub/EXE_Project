# TASK-089

## Title

Lazy-load thư viện three.js/Room3DViewer (Performance — thu hẹp phạm vi thật, có bằng chứng đo được)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 4 — ý tưởng gốc ChatGPT "Performance & Loading UX" (round 2) bị hoãn vì cần profiling thật trước khi sửa mù. Nay có BẰNG CHỨNG ĐO ĐƯỢC thật: MỌI LẦN `npm run build` trong suốt dự án đều in cảnh báo `(!) Some chunks are larger than 500 kB after minification` — 1 file JS ~950-965KB gộp CHUNG toàn bộ `three.js` + `OrbitControls`/`GLTFLoader` vào bundle chính, tải ngay cả ở các trang KHÔNG dùng 3D (Login, Dashboard, Projects...). Đây KHÔNG phải phỏng đoán — là số đo thật lặp lại qua hàng chục lần build.

## Scope

- `frontend/src/pages/DesignResult.jsx` — ĐÂY LÀ NƠI DUY NHẤT import `Room3DViewer` trong toàn bộ codebase (đã xác nhận bằng grep trước khi giao task này — không có nơi thứ 2). Đổi `import Room3DViewer from '../components/Room3DViewer'` (static) sang `const Room3DViewer = lazy(() => import('../components/Room3DViewer'))` (dùng `lazy` từ `react`), bọc phần render `<Room3DViewer .../>` bằng `<Suspense fallback={...}>` (fallback đơn giản, ví dụ `<p>Đang tải khung nhìn 3D...</p>` hoặc tái dùng class `.page-loading` có sẵn trong `styles.css` — đọc file trước để dùng đúng class có sẵn, không tạo class mới nếu không cần).
- KHÔNG đụng `Room3DViewer.jsx` chính nó (component nội bộ không đổi gì) — chỉ đổi CÁCH IMPORT ở nơi dùng nó.

## Out of scope

- Không làm "loading skeleton" phức tạp, không cache asset, không debounce (các phần khác của ý tưởng gốc ChatGPT — để dành nếu cần round sau, đo lại xem còn cần không sau khi làm xong phần lazy-load cốt lõi này).
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `CompareDesigns.jsx`, `SharedDesign.jsx`.

## Dependencies

Không phụ thuộc task nào khác trong round này.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS, VÀ output build phải cho thấy CẢI THIỆN THẬT so với trước: `three.js` tách ra 1 chunk riêng (lazy chunk, chỉ tải khi vào trang có `Room3DViewer`), chunk chính (`index-*.js`) nhỏ đi đáng kể so với ~950-965KB hiện tại. Dán lại output build TRƯỚC và SAU vào báo cáo để coordinator so sánh trực tiếp — đây là bằng chứng bắt buộc, không phải tuỳ chọn.
- Trang `/designs/:jobId` vẫn hiển thị đúng `Room3DViewer` sau khi tải xong (chỉ có khoảng trễ ngắn hiện fallback trước khi component 3D xuất hiện — chấp nhận được, đây chính là mục đích của lazy-load).
- Các trang KHÔNG dùng 3D (login, dashboard, projects...) không bị ảnh hưởng.
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS + SO SÁNH kích thước chunk trước/sau (bắt buộc, xem Acceptance Criteria) trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành (xác nhận trang kết quả vẫn tải đúng 3D viewer qua mạng thật, không chỉ qua build log).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật — trang `/designs/{jobId}` vẫn tải đúng và hiển thị đầy đủ `Room3DViewer` (3D + 2D + sơ đồ mặt bằng, đã test cả 3 tab) sau khi đổi sang lazy-load, không có độ trễ đáng chú ý qua mạng LAN Docker. Console sạch lỗi. Xác nhận lại qua build log của coordinator: chunk chính (`index-*.js`) còn 276.20 kB (so với ~965 kB trước khi có TASK-089), `Room3DViewer-*.js` tách riêng 690.70 kB — khớp đúng số liệu agent báo cáo. Không phát hiện lỗi mới nào.
