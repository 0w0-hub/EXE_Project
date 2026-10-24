# Integration Testing

- Test API với SQL Server thật (test container hoặc DB test riêng), không mock DB ở test integration.
- Test luồng tạo job generation end-to-end với AI provider giả lập (mock/stub), không gọi provider thật trong CI.
