# Logging

- Log có cấu trúc (structured), có request id / job id để trace theo luồng AI generation.
- Không log ảnh, prompt chứa dữ liệu cá nhân ở mức INFO — dùng DEBUG và che thông tin nhạy cảm nếu cần.
- Không log secrets/API key.
