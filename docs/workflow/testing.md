# Testing Workflow

- Unit test khi code logic module.
- Integration test khi có API + DB thật.
- E2E theo luồng chính trong [../../rules/testing/e2e.md](../../rules/testing/e2e.md) trước khi đánh dấu `VERIFIED`.
- Không đánh dấu `PRODUCTION_READY` nếu chưa chạy qua Docker Compose thật, giống cách đã kiểm tra dự án tham khảo `dizaine_deploy`.
