# Docket

Docket is a web-based document management system for employees, department heads, and administrators to securely upload, organize, retrieve, and manage digital documents.

## Run the frontend preview

Use Node.js 22 LTS. Run `npm ci`, then `npm run dev`, and open http://127.0.0.1:3000.
No AWS credentials or database setup are required yet.

| Demo role | Email | Password |
| --- | --- | --- |
| Administrator | admin@docket.local | Docket123! |
| Department head | head@docket.local | Docket123! |
| Employee | employee@docket.local | Docket123! |

The role buttons fill the login form; click Sign in. Head and employee accounts belong to Human Resources.

## Implemented

- Responsive dashboard, department summaries, recent documents, and mobile navigation.
- Document search, category/department filters, sorting, and URL-based pagination.
- Actual upload with transfer progress, details, download, editing, and confirmed deletion.
- Account creation/editing/deactivation, roles, categories, and department management.
- Cookie sessions, hashed passwords, server-side permissions, validation, and feedback states.

## Temporary local backend

This is a single-process local demo. Records and sessions persist in `.data/store.json`; uploaded files live in `.data/files/`. They are ignored by Git. Restarting preserves them. Use sample files only; demo credentials are public. Production mode is disabled by default. For a local production-build check only, set `DOCKET_ENABLE_LOCAL_DEMO=true` before `npm start`. Do not publicly deploy demo mode.

Deliberate differences from the final API contract:

- `/api/auth/login` and `/api/auth/logout` use local cookie sessions, not Better Auth.
- `POST /api/documents/uploads` accepts multipart form data and returns a completed document. Downloads stream authorized local files. S3 intent/completion and signed URLs are deferred.

Server logic is in `src/server/handler.ts`, local persistence in `src/server/db/local.ts`, and permissions in `src/server/authorization/`. Thin route adapters and shared DTOs keep the frontend ready for backend replacement. The UI uses custom styled native controls; shadcn/ui can be added where useful later. Demo files are actual text files, labeled TXT.

## Verification

```sh
npm run typecheck
npm run lint
npm run build
# With the local server running:
npm test
```

The integration test covers sessions, upload/read/edit/download/delete, department isolation, mutation permissions, invalid file rejection, and cross-origin mutation denial. It cleans up its own document. Use unchanged demo accounts/departments for the test.

## Next phase

After frontend review, add Prisma/PostgreSQL and the course SQL deliverables, connect Better Auth, and replace local storage with private S3 and verified upload finalization. Add production login throttling, stronger Office-file inspection, cleanup/retry behavior, and EC2/Nginx/systemd/IAM deployment configuration. The local backend does not yet satisfy live AWS/SQL requirements.

The requested final folder structure remains the target. Prisma, SQL, and infrastructure folders will be populated with their actual implementations after team configurations arrive.

Planning references: [Frontend](docs/plans/FRONTEND_PLAN.md), [Backend](docs/plans/BACKEND_PLAN.md), [API contract](docs/plans/API_CONTRACT.md), [Delivery](docs/plans/PROJECT_PLAN.md).
