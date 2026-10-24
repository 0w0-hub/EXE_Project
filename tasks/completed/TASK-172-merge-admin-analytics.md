# TASK-172 — Merge admin analytics into main

Status: VERIFIED

Resolved 17 conflicts in the existing main-to-dashboard merge, preserving analytics queries, report route, PDF dependencies, PayOS checkout routes, webhook security and configuration. Retained the local PostgreSQL service and added PayOS environment variables.

Admin bootstrap is disabled by default and requires explicit environment credentials when enabled. Removed real database credentials from the example environment file.

Validation: frontend npm ci and npm run build succeeded; backend mvn test passed all 37 tests, including 5 new analytics/bootstrap regression tests; git diff --check passed. Vite reports a bundle-size warning. Database integration and end-to-end tests were not run because backend/database services are unavailable locally.
