<!-- Copilot / AI agent instructions for visualize-dashboard -->

# Quick Purpose
This file tells an AI coding agent how this repository is organized, where to find the important code, and the concrete commands and patterns to follow so changes are safe and consistent.

## Big picture
- Backend: Spring Boot application (Java 21, Spring Boot 3.5.7) in `src/main/java/com/app/dashboard/visualize_dashboard`. Entry: `VisualizeDashboardApplication`.
- Frontend: React + Vite in `frontend/` (uses `axios`, `recharts`, `react-grid-layout`). API client: `frontend/src/services/api.js`.
- Data / persistence: H2 in-memory for dev (`application.properties`), Postgres runtime dependency included for production.
- File handling: uploads stored under `uploads/` (property `file.upload-dir` in `src/main/resources/application.properties`). Excel parsing uses Apache POI (see `pom.xml`).

## Where to look (quick links)
- `pom.xml` — backend dependencies and packaging (Spring Boot Maven plugin).
- `src/main/java/.../controller` — REST endpoints (e.g. `DashboardController`).
- `src/main/java/.../service` — business logic (constructor-injected services).
- `src/main/resources/application.properties` — dev DB, file upload sizes, server port (8080).
- `frontend/src/services/api.js` — concrete axios usage and API routes used by the UI.

## Concrete developer workflows & commands
Use the repository's Maven wrapper and the frontend's npm scripts. Examples for Windows PowerShell:

```powershell
# Backend: run in dev
.\mvnw.cmd spring-boot:run

# Backend: build artifact
.\mvnw.cmd clean package

# Run backend tests
.\mvnw.cmd test

# Frontend: dev server (hot reload)
cd frontend; npm install; npm run dev

# Frontend: build for production
cd frontend; npm install; npm run build
```

Notes: backend defaults to port `8080`. Frontend expects API at `VITE_API_URL` (see `frontend/src/services/api.js`); default in code is `http://localhost:8080/api`.

## API & integration patterns (do not change lightly)
- API base path: `/api` (controllers use `@RequestMapping("/api/...")`). Example endpoints: `/api/dashboards`, `/api/files/*`, `/api/data/*`.
- Frontend communicates via `axios` wrappers in `frontend/src/services/api.js`. Prefer updating or reusing those functions for new features.
- CORS: controllers use `@CrossOrigin(origins = "*")` allowing frontend dev to call backend directly.

## Project-specific conventions
- Constructor injection for Spring-managed beans (avoid field injection). Look at controllers and services for examples.
- DTOs live under `model/dto` and are used in controller signatures (e.g. `DashboardRequest`, `DashboardResponse`).
- File uploads use `multipart/form-data` and are handled by the backend endpoints referenced in `fileService.uploadFiles`.
- Use `uploads/` for persisted uploaded files — the app expects `file.upload-dir` to point to `./uploads` in dev.

## Testing and running locally
- Unit/integration tests are run with the Maven lifecycle (`mvnw.cmd test`). Integration tests use Spring Boot test support (see `test/` folder).
- If making DB-sensitive changes, note the default is H2 in-memory in `application.properties`. For Postgres locally, change properties accordingly.

## Safety & common gotchas
- Don't change the API path structure unless the frontend `frontend/src/services/api.js` is updated accordingly.
- Large file upload sizes are configured in `application.properties` (defaults 50MB). Increase there if necessary and ensure frontend form uploads are created as `FormData`.
- Excel/parsing uses Apache POI — add tests when changing parsing logic to avoid regressions.

## When to ask the user
- If a change affects API routes, CORS, or file storage paths, confirm whether the frontend or deployment manifests must be updated.
- If switching the DB from H2 to Postgres, ask for connection details and whether migration tools (Flyway/liquibase) should be added.

## Helpful file examples to copy from
- `frontend/src/services/api.js` — API client patterns and parameter passing.
- `src/main/java/.../controller/DashboardController.java` — REST controller and response patterns.
- `src/main/resources/application.properties` — example config for ports, DB, multipart limits.

---
If any section is unclear or you want more detail (example PR checklist, code style rules, or additional command examples), tell me which part to expand or revise.
