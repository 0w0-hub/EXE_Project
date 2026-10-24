# Configuration

- Toàn bộ secrets (DB, AI API key) qua environment variables, không hardcode, không commit `.env` thật.
- Cấu hình theo profile: `local`, `docker`, `production`.
- Tham khảo cách tổ chức `.env`/`docker-compose.yml` ở dự án tham khảo: `../../../dizaine_deploy/docker-compose.yml`.
