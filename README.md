# Homely — AI Room Design Platform

AI phân tích ảnh phòng thực tế + yêu cầu/sở thích của người dùng, tự động đề xuất phương án thiết kế nội thất (bố trí, màu sắc, danh sách nội thất, chi phí), sinh không gian 3D để xem/chỉnh sửa.

Chi tiết đầy đủ về sản phẩm, kiến trúc, rules: xem [`CLAUDE.md`](CLAUDE.md) (index cho AI coding agent) hoặc [`docs/README.md`](docs/README.md).

**Stack:** SQL Server · Spring Boot (Java 21) · React (Vite) · Nginx · Docker

**Trạng thái hiện tại:** SCAFFOLDED — luồng chính (đăng ký/đăng nhập → tạo phòng → nhập sở thích → AI sinh phương án → xem kết quả) đã chạy được thật end-to-end, cùng mẫu thiết kế (templates), lịch sử thiết kế có phân trang, giới hạn lượt tạo theo gói Free/Pro, và admin panel (dashboard/users/designs). AI provider mặc định là `mock` (không tốn phí); provider thật (Replicate) đã code + unit test xong nhưng **chưa verify với API key thật** — xem mục 4 dưới và [ADR-0003](docs/decisions/ADR-0003-ai-integration-approach.md). 3D viewer thật **chưa** được tích hợp.

---

## 1. Chạy bằng Docker (khuyến nghị)

Yêu cầu: Docker Desktop đang chạy.

```bash
# 1. Tạo file .env từ mẫu
cp .env.example .env

# 2. Build + khởi động toàn bộ (SQL Server, backend, frontend)
docker compose up -d --build

# 3. Theo dõi log khi cần
docker compose logs -f backend
```

Lần khởi động đầu tiên sẽ:
- Kéo image SQL Server, build image backend (Maven) và frontend (npm + Nginx).
- Service `db-init` tự tạo database `homely_db` (SQL Server không tự tạo DB qua biến môi trường như Postgres/MySQL).
- Backend tự chạy Flyway migration để tạo schema khi khởi động.

Sau khi lên:

| Thành phần | URL |
|---|---|
| Frontend | http://localhost (hoặc `FRONTEND_PORT` trong `.env` nếu 80 đã bị chiếm) |
| Backend API | http://localhost:8080/api/v1 |
| Backend health | http://localhost:8080/actuator/health |
| SQL Server | localhost:1433 |

> Nếu port 80 đã bị ứng dụng khác chiếm, đổi `FRONTEND_PORT` trong `.env` (ví dụ `FRONTEND_PORT=8082`) trước khi `docker compose up`.

Dừng và dọn dẹp:

```bash
docker compose down        # dừng, giữ lại data (volume)
docker compose down -v     # dừng + xoá luôn data (SQL Server, uploads)
```

---

## 2. Chạy không dùng Docker (dev thủ công)

Cần cài sẵn: **JDK 21**, **Maven**, **Node.js 20+**, và **SQL Server** (chạy local, hoặc chỉ chạy riêng container SQL Server bằng lệnh dưới).

### 2.1. Chuẩn bị database

Cách nhanh nhất là chỉ chạy riêng SQL Server bằng Docker (không cần chạy cả stack):

```bash
docker run -d --name homely-sqlserver -p 1433:1433 \
  -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD="YourStrong!Passw0rd" \
  mcr.microsoft.com/mssql/server:2022-latest

# Tạo database (SQL Server không tự tạo qua env var)
docker exec -it homely-sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa \
  -P "YourStrong!Passw0rd" -Q "CREATE DATABASE homely_db"
```

Hoặc dùng SQL Server đã cài sẵn trên máy — chỉ cần tạo database `homely_db`.

> Nếu máy bạn đã có SQL Server/SQL Express cài sẵn chiếm port 1433, lệnh `docker run -p 1433:1433` phía trên vẫn tạo container thành công (Docker không báo lỗi trùng port), nhưng `localhost:1433` từ máy host sẽ nối vào SQL Server có sẵn đó chứ không phải container mới — gây lỗi "Login failed" khó hiểu. Đổi sang port khác cho container, ví dụ `-p 14330:1433`, và sửa `DB_URL` ở bước 2.2 tương ứng (`localhost:14330`).

### 2.2. Chạy backend

```bash
cd backend

# Biến môi trường trỏ tới SQL Server đang chạy (đổi giá trị nếu khác)
export DB_URL="jdbc:sqlserver://localhost:1433;databaseName=homely_db;encrypt=true;trustServerCertificate=true"
export DB_USERNAME=sa
export DB_PASSWORD="YourStrong!Passw0rd"
export JWT_SECRET="dev-secret-change-me"
export AI_PROVIDER=mock

mvn spring-boot:run
```

Backend chạy tại `http://localhost:8080`, tự áp Flyway migration khi start. Chạy `mvn test` để chạy unit test.

> PowerShell: dùng `$env:DB_URL="..."` thay cho `export ... =`.

### 2.3. Chạy frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend dev server chạy tại `http://localhost:5173`, tự proxy `/api` sang backend `http://localhost:8080` (xem `vite.config.js`). Không cần Nginx khi chạy dev.

### 2.4. Chỉ xem UI bằng mock login

Nếu chỉ đảm nhiệm UI và chưa muốn chạy backend/database, bật auth giả khi chạy frontend:

```bash
cd frontend
npm install
npm run dev:mock
```

Mở `http://localhost:5173/login`, nhập email và mật khẩu bất kỳ. Frontend sẽ tạo user giả trong `localStorage` và cho vào các route cần đăng nhập. Cờ này chỉ mock đăng nhập; các màn hình cần dữ liệu server vẫn có thể hiện trạng thái không kết nối nếu backend chưa chạy. Auth thật mặc định vẫn giữ nguyên khi không bật cờ.

---

## 3. Trở thành Admin

Không có tài khoản admin mặc định (tránh hardcode credentials — xem `rules/security/secrets.md`). Để có quyền admin:

1. Đăng ký tài khoản bình thường qua UI (`/register`).
2. Update trực tiếp trong SQL Server:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'ban@example.com';
```

Qua Docker: `docker exec -it homely_sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "<mật khẩu>" -d homely_db -Q "UPDATE users SET role='ADMIN' WHERE email='ban@example.com'"`

3. **Đăng xuất rồi đăng nhập lại.** JWT gắn `role` vào token lúc đăng nhập và không đọc lại từ DB theo từng request — nếu không đăng nhập lại, các trang `/admin/*` sẽ vẫn báo `403 ACCESS_DENIED` dù DB đã đúng (đây không phải bug, chỉ cần lấy token mới).

---

## 4. Bật AI provider thật (Replicate)

Mặc định `AI_PROVIDER=mock` — sinh phương án thiết kế bằng thuật toán xác định, không gọi API ngoài, không tốn phí. Để dùng AI thật (Replicate: LLaVA phân tích ảnh phòng + SDXL sinh ảnh visualization — xem [ADR-0003](docs/decisions/ADR-0003-ai-integration-approach.md)):

1. Lấy API key tại https://replicate.com/account/api-tokens (cần tài khoản Replicate, có thẻ thanh toán).
2. Trong `.env`:

```bash
AI_PROVIDER=replicate
REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. `docker compose up -d --build backend` (hoặc restart nếu chạy không dùng Docker).

**Chi phí thật:** mỗi lượt tạo thiết kế tốn ~$0.02–0.05 (SDXL) + phí LLaVA nếu có ảnh phòng — tính trên tài khoản Replicate của bạn, không liên quan tới giới hạn gói Free/Pro trong app (giới hạn đó vẫn áp dụng song song, không tự động dừng chi phí Replicate nếu bạn tăng giới hạn gói).

**Nếu thiếu `REPLICATE_API_KEY` mà `AI_PROVIDER=replicate`:** backend sẽ **không khởi động được** (fail fast, có chủ đích — xem `rules/ai/model-integration.md`) — đổi lại `AI_PROVIDER=mock` hoặc thêm key.

---

## 5. Cấu trúc thư mục dự án

```text
Homely/
├── CLAUDE.md                  # Index kiến thức cho AI coding agent (đọc trước khi code)
├── README.md                  # File này
├── docker-compose.yml         # Compose cho toàn bộ stack (sqlserver, backend, frontend)
├── .env.example                # Mẫu biến môi trường cho docker-compose
│
├── backend/                   # Spring Boot API (modular monolith)
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/homely/api/
│       ├── HomelyApplication.java
│       ├── common/            # ApiResponse, ApiException, GlobalExceptionHandler, CurrentUser
│       ├── config/             # SecurityConfig (JWT, CORS)
│       ├── auth/               # Đăng ký/đăng nhập, JwtService, JwtAuthFilter
│       ├── user/               # User entity + hồ sơ người dùng
│       ├── room/               # Room + RoomPreference (input: loại phòng, ảnh, sở thích, ngân sách...)
│       ├── asset/               # Lưu trữ file (ảnh phòng, ảnh kết quả)
│       ├── aidesign/           # Module lõi: DesignJob/DesignResult + AiDesignProvider (mock + replicate)
│       │   └── provider/       # Interface provider AI + MockAiDesignProvider
│       │       └── replicate/  # ReplicateAiDesignProvider + ReplicateClient (provider thật, ADR-0003)
│       ├── billing/            # Plan/Subscription + kiểm tra giới hạn lượt tạo theo tháng
│       ├── template/           # Mẫu thiết kế (preset phong cách/màu sắc/ngân sách)
│       └── admin/              # Dashboard/users/designs cho ADMIN — @PreAuthorize("hasRole('ADMIN')")
│       └── resources/
│           ├── application.yml
│           └── db/migration/   # Flyway SQL migration (V1: core, V2: templates + billing)
│
├── frontend/                   # React (Vite) SPA
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── nginx.conf              # Nginx config dùng khi build Docker image (proxy /api -> backend)
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── contexts/AuthContext.jsx
│       ├── services/api.js     # axios instance + các hàm gọi API
│       ├── components/         # NavBar, Room3DViewerPlaceholder
│       └── pages/
│           ├── Login, Register, Dashboard, RoomNew, DesignResult
│           ├── Templates.jsx, Projects.jsx
│           └── admin/          # AdminDashboard, AdminUsers, AdminDesigns (chỉ role ADMIN)
│
├── rules/                      # Quy tắc kỹ thuật (source of truth) — xem rules/README.md
├── docs/                       # Tài liệu sản phẩm/kiến trúc/ADR — xem docs/README.md
├── tasks/                      # Task tracking — xem tasks/README.md
├── logs/                       # Progress log + AI session log — xem logs/README.md
└── infrastructure/             # Ghi chú hạ tầng Docker/CI-CD — xem infrastructure/*/README.md
```

Giải thích đầy đủ về kiến trúc, input/output của chức năng AI, và các quyết định kỹ thuật: xem [`docs/project/overview.md`](docs/project/overview.md), [`docs/project/requirements.md`](docs/project/requirements.md), và [`docs/architecture/overview.md`](docs/architecture/overview.md).
