# Logs 23/10/2026 — Homely Project

---

## 1. Docker / Hạ tầng

**File sửa:** `EXE_Project/docker-compose.yml`

- Thêm service `homely_db` (PostgreSQL 16-alpine) để thay thế Neon cloud DB (credentials hết hạn)
- Thêm healthcheck cho `homely_db`: `pg_isready -U homely -d homely`
- Thêm volume `db_data` để persist dữ liệu
- Đổi biến môi trường backend:
  - `DB_URL`: `jdbc:postgresql://db:5432/homely`
  - `DB_USERNAME`: `homely`
  - `DB_PASSWORD`: `homely123`

---

## 2. Database — Seed dữ liệu demo

**File tạo mới (tạm):** `C:\Users\ADMIN\AppData\Local\Temp\...\scratchpad\seed_demo.sql`

Chạy trực tiếp vào container `homely_db` qua `docker exec`.

**Nội dung seed:**
- **250 users** — đăng ký trải đều 180 ngày (nặng hơn ở 60 ngày gần nhất)
  - Password hash: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lkii` (= `demo123`)
- **~394 rooms** — 70% users tạo 1–4 phòng
- **~515 design_jobs** — 60% phòng có 1–3 jobs
  - Phân bố status: 70% COMPLETED · 15% FAILED · 10% PENDING · 5% PROCESSING
- **251 subscriptions** — 65% FREE · 25% PLUS · 10% STUDIO

**Fix sau seed:**
```sql
UPDATE design_jobs
SET updated_at = created_at + (INTERVAL '5 minutes' * (1 + floor(random() * 115)::INT))
WHERE status = 'COMPLETED';
```
*(Ban đầu `updated_at` của tất cả jobs = NOW(), cần trải ngẫu nhiên 5–575 phút sau `created_at`)*

---

## 3. Backend

### 3.1 Fix ClassCastException + Bug plan distribution

**File sửa:** `EXE_Project/backend/src/main/java/com/homely/api/admin/AdminAnalyticsService.java`

**Vấn đề:** Native SQL trả về kiểu `String` hoặc `BigInteger` cho cột COUNT, nhưng code cast trực tiếp sang `Number` → `ClassCastException` → API trả về `INTERNAL_ERROR`.

**Fix 1 — Thêm helper `toLong()`:**
```java
private static long toLong(Object o) {
    if (o == null) return 0L;
    if (o instanceof Number n) return n.longValue();
    try { return Long.parseLong(o.toString().trim()); } catch (NumberFormatException e) { return 0L; }
}
```

**Fix 2 — Plan distribution (method `buildRetention()`):**

Query `countActiveUsersByPlanCode()` trả về array `[code, name, count]` nhưng code cũ gọi `toNameValue()` dùng index `[1]` (= tên gói, kiểu String) làm giá trị số → toàn bộ plan = 0.

```java
// Trước (sai):
List<NameValuePoint> byPlan = toNameValue(subscriptionRepository.countActiveUsersByPlanCode());

// Sau (đúng):
List<NameValuePoint> byPlan = subscriptionRepository.countActiveUsersByPlanCode().stream()
    .map(r -> new NameValuePoint(r[1] != null ? r[1].toString() : "?", toLong(r[2])))
    .collect(Collectors.toList());
```

---

## 4. Frontend

### 4.1 Trang báo cáo analytics

**File tạo mới:** `EXE_Project/frontend/src/pages/admin/AdminReport.jsx`

Trang admin report với 4 section, ~15 biểu đồ (thư viện Recharts), xuất PDF (html2canvas + jsPDF).

**Section A — Tăng trưởng người dùng:**
- AreaChart: người dùng mới theo ngày (30 ngày)
- BarChart: theo tuần (12 tuần) — có số label trên đầu cột
- BarChart: theo tháng (12 tháng) — có số label trên đầu cột
- 4 stat tiles: tổng tài khoản, đã dùng AI, chưa tạo thiết kế, tăng trưởng 30 ngày

**Section B — Hành vi & thời gian sử dụng:**
- AreaChart: hoạt động theo ngày (proxy qua design jobs)
- BarChart: phân bố giờ trong ngày — có số label trên đầu cột
- LineChart: hoạt động theo tuần
- 3 stat tiles: tổng hoạt động, TB job/user, ngày bận nhất

**Section C — Hiệu quả sử dụng AI:**
- PieChart: tỷ lệ job theo trạng thái
- BarChart ngang: phong cách phòng phổ biến — có số label bên phải
- LineChart: jobs hoàn thành theo tháng — có label số trên điểm
- BarChart: phân bố thời gian xử lý — có số label trên đầu cột
- 5 stat tiles: tổng jobs, thành công, thất bại, TB thời gian xử lý, TB jobs/user

**Section D — Giữ chân & chuyển đổi (đơn giản hóa):**
- ~~FunnelChart~~ → **BarChart ngang** tỷ lệ chuyển đổi từng bước với % label
- **BarChart đứng** retention D1/D7/D30 với % lớn trên đầu cột
- ~~PieChart~~ → **BarChart đứng** phân bố gói đăng ký với số users trên đầu cột
- 7 stat tiles: đã đăng ký, tạo phòng, tạo thiết kế, có kết quả, D1, D7, D30

### 4.2 Files liên quan đã sửa trước đó (session trước)

**File sửa:** `EXE_Project/frontend/src/App.jsx`
- Thêm route `/admin/report` → `<AdminReport />`

**File sửa:** `EXE_Project/frontend/src/pages/admin/AdminDashboard.jsx`
- Thêm NavLink "Báo cáo" trỏ đến `/admin/report`

**File sửa:** `EXE_Project/frontend/src/services/api.js`
- Thêm `analytics: () => api.get('/admin/analytics')` vào `adminApi`

---

## 5. Backend — Analytics API (session trước)

**File tạo mới:** `EXE_Project/backend/src/main/java/com/homely/api/admin/AdminAnalyticsController.java`
- `GET /api/v1/admin/analytics` — yêu cầu role ADMIN

**File tạo mới:** `EXE_Project/backend/src/main/java/com/homely/api/admin/AdminAnalyticsService.java`
- Logic tính toán 4 section: UserGrowthStats, BehaviorStats, AiEfficiencyStats, RetentionStats

**File tạo mới:** `EXE_Project/backend/src/main/java/com/homely/api/admin/dto/AdminAnalyticsResponse.java`
- DTO response với 4 nested record

**Files sửa — thêm queries:**
- `EXE_Project/backend/src/main/java/com/homely/api/user/UserRepository.java`
- `EXE_Project/backend/src/main/java/com/homely/api/aidesign/DesignJobRepository.java`
- `EXE_Project/backend/src/main/java/com/homely/api/room/RoomRepository.java`
- `EXE_Project/backend/src/main/java/com/homely/api/billing/SubscriptionRepository.java`

**File tạo mới:** `EXE_Project/backend/src/main/java/com/homely/api/room/RoomPreferenceRepository.java`
- Query `countByStyleGrouped()` — GROUP BY style

---

*Ghi chú: Dữ liệu hành vi (Section B) dựa trên proxy design_jobs — ứng dụng chưa có bảng session tracking riêng.*
