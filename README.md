# Docket — Document Management System

A cloud-based document management system built on AWS for CCS4301 – Cloud Computing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Bootstrap 5, Vanilla JS (ES Modules) |
| Backend | Node.js + Express.js |
| Database | MySQL 8 on Amazon RDS |
| File Storage | Amazon S3 (private bucket + pre-signed URLs) |
| Hosting | Amazon EC2 (Ubuntu 22.04) |
| Auth | Express-Session + bcryptjs |
| Cloud Security | AWS IAM Roles + Security Groups |

## Project Structure

```
Docket/
├── frontend/
│   ├── css/
│   │   └── style.css              # Global styles
│   ├── js/
│   │   ├── api.js                 # Fetch wrapper for all API calls
│   │   ├── auth.js                # Session guard helpers
│   │   ├── sidebar.js             # Shared sidebar injector
│   │   ├── toast.js               # Toast notification helper
│   │   ├── login.js               # Login page logic
│   │   ├── register.js            # Register page logic
│   │   ├── dashboard.js           # Dashboard page logic
│   │   ├── documents.js           # Documents page logic
│   │   ├── categories.js          # Categories page logic
│   │   ├── users.js               # User management page logic
│   │   └── logout.js              # Logout button handler
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── dashboard.html
│   │   ├── documents.html
│   │   ├── categories.html
│   │   └── users.html
│   └── index.html                 # Redirects to login
│
├── backend/
│   └── src/
│       ├── config/
│       │   ├── db.js              # MySQL connection pool
│       │   ├── s3.js              # S3 client
│       │   └── session.js         # Express-session config
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── categoryController.js
│       │   ├── documentController.js
│       │   └── userController.js
│       ├── middleware/
│       │   ├── requireAuth.js     # Session auth guard
│       │   ├── requireAdmin.js    # Admin role guard
│       │   └── uploadMiddleware.js # Multer → S3
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── categoryRoutes.js
│       │   ├── documentRoutes.js
│       │   └── userRoutes.js
│       ├── services/
│       │   ├── authService.js
│       │   ├── categoryService.js
│       │   ├── documentService.js
│       │   └── userService.js
│       ├── utils/
│       │   ├── hashPassword.js
│       │   ├── comparePassword.js
│       │   ├── generateS3Key.js
│       │   ├── presignedUrl.js
│       │   └── deleteS3Object.js
│       └── app.js                 # Express entry point
│
├── sql/
│   ├── 01_create_database.sql
│   ├── 02_create_tables.sql
│   ├── 03_seed_data.sql
│   └── 04_sample_queries.sql
│
└── README.md
```

## Local Development

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Run the database scripts against your RDS instance (or local MySQL)
mysql -h <host> -u <user> -p < ../sql/01_create_database.sql
mysql -h <host> -u <user> -p < ../sql/02_create_tables.sql
mysql -h <host> -u <user> -p < ../sql/03_seed_data.sql

# 4. Start the backend (serves frontend too via express.static)
npm run dev
# → http://localhost:3000
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register a new user |
| POST | /api/auth/login | — | Login |
| POST | /api/auth/logout | ✓ | Logout |
| GET | /api/auth/me | — | Current session info |
| GET | /api/categories | ✓ | List all categories |
| POST | /api/categories | admin | Create category |
| DELETE | /api/categories/:id | admin | Delete category |
| GET | /api/documents | ✓ | List documents (with search/filter) |
| POST | /api/documents/upload | ✓ | Upload a document to S3 |
| GET | /api/documents/:id/download | ✓ | Get pre-signed download URL |
| PATCH | /api/documents/:id/rename | ✓ | Rename document |
| DELETE | /api/documents/:id | ✓ | Delete document |
| GET | /api/users | admin | List all users |
| PATCH | /api/users/:id/role | admin | Change user role |
| DELETE | /api/users/:id | admin | Delete user |

## Default Admin Account

| Field | Value |
|-------|-------|
| Email | admin@docket.com |
| Password | Admin@1234 |

> Change the admin password immediately after first login.

## AWS Services Used

- **Amazon EC2** — Hosts the Node.js application (Ubuntu 22.04, t2.micro)
- **Amazon RDS** — MySQL 8.0 database instance
- **Amazon S3** — Private bucket for document storage
- **Amazon VPC** — Custom VPC with public and private subnets
- **AWS IAM** — EC2 instance role with S3 and RDS access (no hard-coded keys)
- **Security Groups** — HTTP/HTTPS from anywhere; MySQL only from EC2 security group

## Authors

- Joshua B. Castillejos
- CCS4301 – Cloud Computing, 1st Semester 2026-2027
- University of the East — College of Engineering
