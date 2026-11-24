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
# Fill in DATABASE_URL, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME

# 4. Generate Prisma client
npm run db:generate

# 5. Run dev server
npm run dev
```

Open http://localhost:3000

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Administrator | admin@docket.local | Docket123 |
| Department Head | head@docket.local | Docket123 |
| Employee | employee@docket.local | Docket123 |

## Features

### Role-Based Access Control
- **Employee** — Upload documents, view approved documents and own pending uploads
- **Department Head** — Approve/archive documents in their department, all employee features
- **Administrator** — Full system access, manage users, departments, categories, approve any document

### Document Approval Workflow
- Employee uploads are **PENDING** by default and require approval
- Department Heads and Admins can upload directly as **APPROVED**
- Department Heads can approve/archive documents within their department
- Administrators can approve/archive any document
- Real-time pending approval alerts for Department Heads and Admins

### Document Management
- Upload documents with metadata (title, description, category, department)
- Files stored securely on Amazon S3 with presigned URL access
- Document status tracking: PENDING, APPROVED, ARCHIVED
- Filter and search by department, category, status
- Download documents with single-use presigned URLs

### User Management (Admin Only)
- Create, update, and delete users
- Assign roles and departments
- System administrator (admin@docket.local) is protected from deletion

### Department & Category Management (Admin Only)
- Organize documents by department and category
- Track document count per department
- Manage organizational structure

## AWS Services

- **EC2** — Ubuntu 22.04, t3.micro, runs Next.js behind Nginx
- **RDS** — PostgreSQL 16, private subnet, Single-AZ
- **S3** — Private bucket, files accessed via presigned URLs
- **VPC** — Custom VPC, public + private subnets
- **IAM** — EC2 instance role (no hardcoded keys)
- **Security Groups** — HTTP/HTTPS open; PostgreSQL only from EC2

## Deployment (EC2)

```bash
# Deploy latest changes
cd ~/Docket---Document-Management-System/frontend
git pull origin main --rebase
rm -rf .next
npm run build
sudo systemctl restart docket
```

## Recent Updates

### UI/UX Improvements
- ✅ Improved typography with higher contrast colors for better readability
- ✅ Changed from green-tinted text to professional neutral grays
- ✅ Removed promotional banners and footer text for cleaner interface
- ✅ Simplified page title to "Docket"
- ✅ Enhanced login page readability with darker, more legible text

### Backend Features
- ✅ Document approval workflow implementation
- ✅ Status-based filtering (Pending, Approved, Archived)
- ✅ Department Head privileges and authorization
- ✅ User deletion with system admin protection
- ✅ Pending approvals dashboard and alerts
- ✅ Database migration for approval workflow fields

## Authors

- Joshua Castillejos
- Justin Cedric Espe
- Shamier Repalda
- Cj Rigor
- Jhonard Rollo

CCS4301 – Cloud Computing, 1st Semester 2026-2027
University of the East — College of Engineering
