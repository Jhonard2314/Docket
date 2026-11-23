# Docket — Document Management System

A cloud-based document management system built on AWS for CCS4301 – Cloud Computing.

**Live site:** http://54.254.200.247

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js Route Handlers (Node.js runtime) |
| Database | PostgreSQL 16 on Amazon RDS |
| ORM | Prisma 7 |
| File Storage | Amazon S3 (private bucket + presigned URLs) |
| Hosting | Amazon EC2 (Ubuntu 22.04) + Nginx |
| Process | systemd |

## Project Structure

```
Docket/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/           # Pages and API routes
│   │   ├── components/    # UI components
│   │   ├── server/        # Server-only logic (DB, auth, S3)
│   │   └── lib/           # Shared types and utilities
│   ├── prisma/            # Database schema
│   └── package.json
│
├── backend/
│   ├── database/          # SQL scripts for assignment
│   ├── prisma/            # Prisma schema + seed
│   └── infra/             # Nginx, systemd, deploy script
│
└── README.md
```

## Local Development

```bash
# 1. Clone
git clone https://github.com/Jhonard2314/Docket.git
cd Docket/frontend

# 2. Install dependencies
npm install

# 3. Create .env file (get values from team lead)
cp .env.example .env
# Fill in DATABASE_URL, AWS_REGION, S3_BUCKET_NAME

# 4. Generate Prisma client
npm run db:generate

# 5. Run dev server
npm run dev
```

Open http://127.0.0.1:3000

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Administrator | admin@docket.local | Docket123 |

## AWS Services

- **EC2** — Ubuntu 22.04, t3.micro, runs Next.js behind Nginx
- **RDS** — PostgreSQL 16, private subnet, Single-AZ
- **S3** — Private bucket, files accessed via presigned URLs
- **VPC** — Custom VPC, public + private subnets
- **IAM** — EC2 instance role (no hardcoded keys)
- **Security Groups** — HTTP/HTTPS open; PostgreSQL only from EC2

## Deployment (EC2)

```bash
cd ~/Docket---Document-Management-System
git pull origin main --rebase
cd frontend && npm run build
sudo systemctl restart docket
```

## Authors

- Joshua Castillejos
- Justin Cedric Espe
- Shamier Repalda
- Cj Rigor
- Jhonard Rollo

CCS4301 – Cloud Computing, 1st Semester 2026-2027
University of the East — College of Engineering
