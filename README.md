# Docket — Document Management System

A cloud-based document management system built on AWS for CCS4301 – Cloud Computing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS (ES Modules) |
| Backend | Node.js + Express.js + **TypeScript** |
| ORM | **Prisma ORM 7** |
| Database | **PostgreSQL 16** on Amazon RDS |
| File Storage | Amazon S3 (private bucket + pre-signed URLs) |
| Authentication | **Better Auth** (email/password + sessions) |
| Hosting | Amazon EC2 (Ubuntu 22.04) + Nginx reverse proxy |
| Cloud Security | AWS IAM Roles + Security Groups |

## Project Structure

```
Docket/
├── frontend/
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js          # Fetch wrapper (Better Auth + app routes)
│   │   ├── auth.js         # Session guard (localStorage for mock mode)
│   │   ├── sidebar.js      # Sidebar injector
│   │   ├── toast.js        # Toast notifications
│   │   ├── mockApi.js      # Mock backend for local preview
│   │   ├── login.js / register.js / logout.js
│   │   ├── dashboard.js / documents.js / categories.js / users.js
│   ├── pages/
│   │   ├── login.html / register.html / dashboard.html
│   │   ├── documents.html / categories.html / users.html
│   └── index.html
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL schema (Prisma)
│   │   └── seed.ts         # Category seed data
│   └── src/
│       ├── config/
│       │   ├── auth.ts     # Better Auth configuration
│       │   ├── db.ts       # Prisma client singleton
│       │   └── s3.ts       # AWS S3 client
│       ├── controllers/    # HTTP handlers (TypeScript)
│       ├── middleware/     # requireAuth, requireAdmin, upload
│       ├── routes/         # Express routers (TypeScript)
│       ├── services/       # Business logic (TypeScript + Prisma)
│       ├── utils/          # S3 key generator, presigned URL, delete
│       └── app.ts          # Express entry point
│
├── sql/
│   ├── 01_create_database.sql
│   ├── 02_create_tables.sql
│   ├── 03_seed_data.sql
│   └── 04_sample_queries.sql
└── README.md
```

## Local Development

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env

# Push schema to your PostgreSQL database
npm run db:push

# Seed default categories
npm run db:seed

# Start dev server
npm run dev
# → http://localhost:3000
```

For local preview without a database, open:
```
frontend/pages/login.html
```
via Python: `python -m http.server 5500` from the `frontend/` directory.
Login with any email/password — mockApi.js handles it in-memory.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/sign-up/email | — | Register |
| POST | /api/auth/sign-in/email | — | Login |
| POST | /api/auth/sign-out | ✓ | Logout |
| GET | /api/auth/get-session | — | Current session |
| GET | /api/categories | ✓ | List categories |
| POST | /api/categories | admin | Create category |
| DELETE | /api/categories/:id | admin | Delete category |
| GET | /api/documents | ✓ | List (search/filter) |
| POST | /api/documents/upload | ✓ | Upload to S3 |
| GET | /api/documents/:id/download | ✓ | Pre-signed URL |
| PATCH | /api/documents/:id/rename | ✓ | Rename |
| DELETE | /api/documents/:id | ✓ | Delete |
| GET | /api/users | admin | List users |
| PATCH | /api/users/:id/role | admin | Change role |
| DELETE | /api/users/:id | admin | Delete user |

## Roles

| Role | Permissions |
|------|------------|
| `USER` | Upload, view, rename, delete own documents |
| `DEPARTMENT_HEAD` | Same as USER (extended permissions planned) |
| `ADMIN` | All documents + category and user management |

## AWS Services Used

- **Amazon EC2** — Ubuntu 22.04, runs Node.js + Express behind Nginx
- **Amazon RDS** — PostgreSQL 16, private subnet
- **Amazon S3** — Private bucket, files accessed via pre-signed URLs
- **Amazon VPC** — Custom VPC, public + private subnets
- **AWS IAM** — EC2 instance role (no hardcoded keys)
- **Security Groups** — HTTP/HTTPS open; PostgreSQL only from EC2 SG

## Authors

- Joshua  Castillejos
- Justin Cedric  Espe
- Shamier Repalda
- Cj Rigor
- Jhonard Rollo

- CCS4301 – Cloud Computing, 1st Semester 2026-2027
- University of the East — College of Engineering
