# Security Documentation — Index

Rules chi tiết: [../../rules/security/README.md](../../rules/security/README.md)

## Checklist tối thiểu trước khi coi backend là VERIFIED

- [ ] Password hash, không lưu plaintext.
- [ ] JWT secret khác nhau giữa các môi trường, không hardcode.
- [ ] Ownership check cho room/design (user chỉ thấy dữ liệu của mình).
- [ ] Upload ảnh giới hạn kích thước/định dạng.
- [ ] Không log secrets/API key.
