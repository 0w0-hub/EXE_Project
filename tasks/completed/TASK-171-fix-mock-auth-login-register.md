# TASK-171 — Fix mock auth login/register

## Status
COMPLETED

## Changes
- `AuthContext.register()` now uses the same mock user/token path as login when `VITE_MOCK_AUTH=true`.
- Added `npm run dev:mock` so mock mode is enabled explicitly with one command.
- Added mock-mode notice to the registration page.
- Updated README instructions.

## Validation
- `npm run build`: PASS.
- Browser registration with `UI Demo` and `register-demo@example.com`: redirected to `/`.
- `homely_mock_user` and `homely_access_token=mock-access-token` were stored in localStorage.
- No auth request was needed. Dashboard data requests still need a backend and may show `Không thể kết nối tới server` when backend is stopped.
