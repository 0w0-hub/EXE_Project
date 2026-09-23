# REST Conventions

- Base path: `/api/v1`.
- Resource theo domain: `/api/v1/rooms`, `/api/v1/designs`, `/api/v1/assets`.
- Tác vụ AI generation là bất đồng bộ: `POST /api/v1/designs/generate` trả về `jobId`, client poll `GET /api/v1/designs/jobs/{jobId}`.
