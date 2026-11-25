# Docket — Document Management System

A cloud-based document management system with role-based access control, document approval workflows, and AWS infrastructure built for CCS4301 – Cloud Computing.

**Live site:** http://54.254.200.247

---

## 📋 System Overview

Docket is an enterprise document management system that enables organizations to securely store, organize, and manage documents with granular access control and approval workflows. Built on AWS infrastructure with Next.js and PostgreSQL.

## 🏗️ Architecture Specifications

### Frontend Architecture
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **State Management:** React hooks + Server Components
- **Authentication:** Better-Auth (session-based)
- **API Communication:** Native fetch with custom API client wrapper

### Backend Architecture
- **Runtime:** Node.js 20 LTS
- **API:** Next.js Route Handlers (REST-like endpoints)
- **ORM:** Prisma 7
- **Database:** PostgreSQL 16 (Amazon RDS)
- **File Storage:** Amazon S3 with presigned URLs
- **Authentication:** Better-Auth with PostgreSQL session store

### Infrastructure Stack
- **Compute:** Amazon EC2 (t3.micro, Ubuntu 22.04 LTS)
- **Database:** Amazon RDS PostgreSQL 16 (Single-AZ, private subnet)
- **Storage:** Amazon S3 (private bucket, server-side encryption)
- **Networking:** Custom VPC with public/private subnets
- **Load Balancing:** Nginx reverse proxy
- **Process Management:** systemd service
- **IAM:** EC2 instance role with S3 access policies

### Security Architecture
- **Authentication:** Session-based with secure HTTP-only cookies
- **Authorization:** Role-based access control (RBAC) with three tiers
- **File Access:** Presigned S3 URLs with 5-minute expiration
- **Database:** Private subnet, security group restricted to EC2
- **API:** Server-side authorization checks on all endpoints
- **Credentials:** Environment variables, no hardcoded secrets

---

## 🎯 Core Features & Specifications

### 1. Role-Based Access Control (RBAC)

#### Employee Role
- Upload documents with metadata (title, description, category, department)
- View all APPROVED documents in the system
- View own PENDING documents
- Download approved documents
- Cannot approve, archive, or manage users

#### Department Head Role
- All Employee permissions
- Approve documents within assigned department
- Archive documents within assigned department  
- Restore archived documents within assigned department
- View pending documents in assigned department
- Upload documents (auto-approved)
- Cannot manage users or other departments

#### Administrator Role
- All Department Head permissions across all departments
- Create, update, and delete users
- Manage departments and categories
- Approve/archive/restore any document
- View system-wide statistics
- Protected account: admin@docket.local cannot be deleted

### 2. Document Approval Workflow

#### Document States
- **PENDING** — Awaiting approval from Department Head or Admin
- **APPROVED** — Visible to all users, available for download
- **ARCHIVED** — Hidden from normal view, can be restored

#### Workflow Rules
1. Employee uploads → Status: PENDING
2. Department Head/Admin uploads → Status: APPROVED (auto)
3. Department Head can approve within their department only
4. Admin can approve any document
5. Only approvers can archive/restore documents
6. Pending documents trigger alerts for Department Heads and Admins

### 3. Document Management System

#### Upload Specifications
- **Supported formats:** PDF, DOCX, XLSX, PNG, JPG, JPEG
- **Storage:** Amazon S3 private bucket
- **Metadata fields:**
  - Title (required)
  - Description (optional)
  - Category (required, from predefined list)
  - Department (required, from predefined list)
  - Uploader (auto-captured)
  - Upload date (auto-captured)
  - File size (auto-calculated)
  - Status (auto-assigned based on role)

#### File Access Control
- Files stored in S3 with private ACL
- Access via presigned URLs only
- Presigned URLs expire after 5 minutes
- Generated on-demand per download request
- No direct S3 bucket access

#### Search & Filter
- Filter by department
- Filter by category
- Filter by document status (Admin/Dept Head only)
- Search by document title
- Pagination (20 documents per page)

### 4. User Management (Admin Only)

#### User Operations
- Create new users with email, password, name, role, department
- Update user information
- Delete users (except system admin)
- Assign roles: Employee, Department Head, Administrator
- Assign departments to users

#### User Table Specifications
- Email (unique, required)
- Name (required)
- Password (hashed with bcrypt)
- Role (enum: EMPLOYEE, DEPARTMENT_HEAD, ADMIN)
- Department (foreign key, nullable for Admins)
- Created date
- Updated date

### 5. Department & Category Management

#### Departments
- Create departments
- Update department names
- Delete departments (cascade deletes related documents)
- Track document count per department
- Assign Department Heads to departments

#### Categories
- Create document categories
- Update category names
- Delete categories (cascade updates related documents)
- Track document count per category

### 6. Dashboard & Analytics

#### Employee Dashboard
- Total visible documents count
- Departments count
- Categories count
- Storage used (visible documents only)
- Recent documents list (10 most recent)
- Browse by department cards

#### Department Head Dashboard
- All Employee dashboard features
- Pending approvals count with alert banner
- Link to pending approvals page
- Department-specific statistics

#### Admin Dashboard
- All Department Head dashboard features
- System-wide pending approvals count
- Total users count
- Quick links to management pages

---

## 🛠️ Technical Stack

| Component | Technology | Version |
|---|---|---|
| **Frontend Framework** | Next.js | 15.x |
| **UI Library** | React | 19.x |
| **Styling** | Tailwind CSS | 4.x |
| **Backend Runtime** | Node.js | 20 LTS |
| **API Architecture** | Next.js Route Handlers | REST-like |
| **Database** | PostgreSQL | 16 |
| **ORM** | Prisma | 7.x |
| **Authentication** | Better-Auth | Latest |
| **File Storage** | Amazon S3 | - |
| **Cloud Compute** | Amazon EC2 | t3.micro |
| **Cloud Database** | Amazon RDS | db.t3.micro |
| **Operating System** | Ubuntu Server | 22.04 LTS |
| **Web Server** | Nginx | Latest |
| **Process Manager** | systemd | - |

---

## ☁️ AWS Infrastructure Specifications

### Amazon EC2
- **Instance Type:** t3.micro (2 vCPU, 1 GB RAM)
- **Operating System:** Ubuntu 22.04 LTS
- **AMI:** Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
- **Storage:** 8 GB gp3 EBS volume
- **Security Group:** HTTP (80), HTTPS (443), SSH (22) inbound
- **IAM Role:** EC2 instance role with S3 access
- **Services:** Nginx (reverse proxy), systemd (process management)

### Amazon RDS
- **Engine:** PostgreSQL 16
- **Instance Class:** db.t3.micro (2 vCPU, 1 GB RAM)
- **Storage:** 20 GB gp2 SSD
- **Deployment:** Single-AZ
- **Network:** Private subnet, no public access
- **Security Group:** PostgreSQL (5432) from EC2 only
- **Backup:** Automated daily backups, 7-day retention

### Amazon S3
- **Bucket Type:** Private bucket
- **Encryption:** Server-side encryption (AES-256)
- **Access:** Presigned URLs only (5-minute expiration)
- **Versioning:** Disabled
- **Public Access:** Blocked
- **IAM Policy:** EC2 instance role has PutObject, GetObject permissions

### Amazon VPC
- **CIDR Block:** Custom VPC
- **Subnets:** Public subnet (EC2), Private subnet (RDS)
- **Internet Gateway:** Attached for public subnet
- **NAT Gateway:** Optional for private subnet updates
- **Route Tables:** Public and private route tables
- **Network ACLs:** Default allow all

### IAM Configuration
- **EC2 Instance Role:** Attached to EC2 instance
- **S3 Permissions:** PutObject, GetObject, DeleteObject on specific bucket
- **No Access Keys:** Uses instance role instead of hardcoded credentials

---

## 📊 Database Schema

### Users Table
```sql
- id: UUID (primary key)
- email: VARCHAR(255) UNIQUE NOT NULL
- password: VARCHAR(255) NOT NULL (bcrypt hashed)
- name: VARCHAR(255) NOT NULL
- role: ENUM('EMPLOYEE', 'DEPARTMENT_HEAD', 'ADMIN')
- departmentId: UUID (foreign key, nullable)
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Documents Table
```sql
- id: UUID (primary key)
- title: VARCHAR(255) NOT NULL
- description: TEXT
- filename: VARCHAR(255) NOT NULL
- s3Key: VARCHAR(500) NOT NULL
- mimeType: VARCHAR(100)
- sizeBytes: BIGINT
- status: ENUM('PENDING', 'APPROVED', 'ARCHIVED')
- uploaderId: UUID (foreign key)
- departmentId: UUID (foreign key)
- categoryId: UUID (foreign key)
- approvedById: UUID (foreign key, nullable)
- approvedAt: TIMESTAMP (nullable)
- archivedAt: TIMESTAMP (nullable)
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Departments Table
```sql
- id: UUID (primary key)
- name: VARCHAR(255) UNIQUE NOT NULL
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Categories Table
```sql
- id: UUID (primary key)
- name: VARCHAR(255) UNIQUE NOT NULL
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Sessions Table (Better-Auth)
```sql
- id: VARCHAR(255) (primary key)
- userId: UUID (foreign key)
- expiresAt: TIMESTAMP
- createdAt: TIMESTAMP
```

---

## 🔐 Security Specifications

### Authentication
- **Method:** Session-based authentication
- **Session Storage:** PostgreSQL database
- **Cookie Security:** HTTP-only, Secure flag (in production)
- **Password Hashing:** bcrypt with salt rounds
- **Session Expiration:** Configurable (default: 7 days)

### Authorization
- **Strategy:** Role-based access control (RBAC)
- **Enforcement:** Server-side checks on every API endpoint
- **Document Access:** Verified per request based on user role and document status
- **Admin Protection:** System admin account cannot be deleted

### File Security
- **S3 Bucket:** Private, no public access
- **File Access:** Presigned URLs with 5-minute expiration
- **URL Generation:** Server-side only, never exposed to client
- **Download Logging:** All downloads tracked with userId and timestamp

### API Security
- **CSRF Protection:** Built into Better-Auth
- **SQL Injection:** Prevented by Prisma ORM parameterized queries
- **XSS Protection:** React auto-escaping, Content-Security-Policy headers
- **Rate Limiting:** Configurable (future enhancement)

---

## 📁 Project Structure

```
Docket/
├── frontend/                      # Next.js application
│   ├── src/
│   │   ├── app/                   # App Router pages & API routes
│   │   │   ├── (auth)/            # Authentication pages
│   │   │   │   └── login/
│   │   │   ├── (workspace)/       # Protected workspace pages
│   │   │   │   ├── dashboard/
│   │   │   │   ├── documents/
│   │   │   │   └── admin/
│   │   │   ├── api/               # API route handlers
│   │   │   │   ├── auth/
│   │   │   │   ├── documents/
│   │   │   │   ├── admin/
│   │   │   │   └── categories/
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── globals.css        # Global styles
│   │   ├── components/            # Reusable UI components
│   │   │   ├── layout/            # Layout components
│   │   │   ├── documents/         # Document-related components
│   │   │   └── ui/                # Base UI components
│   │   ├── server/                # Server-only code
│   │   │   ├── auth/              # Authentication logic
│   │   │   ├── authorization/     # RBAC logic
│   │   │   ├── storage/           # S3 integration
│   │   │   └── handler.aws.ts     # Main API handler
│   │   ├── lib/                   # Shared utilities
│   │   │   ├── api-client.ts      # Frontend API client
│   │   │   ├── contracts.ts       # TypeScript types/DTOs
│   │   │   └── utils.ts           # Helper functions
│   │   └── hooks/                 # React hooks
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.ts                # Seed script
│   │   └── migrations/            # Database migrations
│   ├── public/                    # Static assets
│   ├── .env                       # Environment variables
│   ├── .env.example               # Environment template
│   ├── package.json               # Dependencies
│   ├── tsconfig.json              # TypeScript config
│   └── tailwind.config.ts         # Tailwind config
│
├── backend/                       # Legacy/reference code
│   ├── database/                  # Raw SQL scripts
│   ├── prisma/                    # Prisma schema backup
│   └── infra/                     # Infrastructure files
│       ├── nginx/                 # Nginx config
│       ├── systemd/               # systemd service file
│       └── scripts/               # Deployment scripts
│
└── README.md                      # This file
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20 LTS
- npm or yarn
- PostgreSQL 16 (local or RDS)
- AWS Account with S3 bucket
- Git

### Environment Variables
Create a `.env` file in the `frontend/` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# AWS Configuration
AWS_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"

# Application
NODE_ENV="development"
BETTER_AUTH_SECRET="your-random-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/Jhonard2314/Docket.git
cd Docket/frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Generate Prisma Client
npm run db:generate

# 5. Run database migrations
npm run db:migrate

# 6. Seed database with demo data
npm run db:seed

# 7. Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio (database GUI)
```

### Access Application
- **Local:** http://localhost:3000
- **Production:** http://54.254.200.247

---

## 🔑 Default Account

| Role | Email | Password |
|---|---|---|
| **Administrator** | admin@docket.local | Docket123 |

**Note:** The administrator creates all user accounts. Use the admin account to access the system and create additional users with appropriate roles and departments.

---

## 🚢 Production Deployment (EC2)

### One-Command Deployment
```bash
cd ~/Docket---Document-Management-System/frontend && \
git pull origin main --rebase && \
rm -rf .next && \
npm run build && \
sudo systemctl restart docket
```

### Manual Deployment Steps
```bash
# 1. SSH into EC2 instance
ssh -i your-key.pem ubuntu@54.254.200.247

# 2. Navigate to project directory
cd ~/Docket---Document-Management-System/frontend

# 3. Pull latest changes
git pull origin main --rebase

# 4. Clear build cache
rm -rf .next

# 5. Install dependencies (if package.json changed)
npm install

# 6. Build production bundle
npm run build

# 7. Restart application service
sudo systemctl restart docket

# 8. Check service status
sudo systemctl status docket

# 9. View logs if needed
sudo journalctl -u docket -f
```

### Service Management Commands
```bash
# Start service
sudo systemctl start docket

# Stop service
sudo systemctl stop docket

# Restart service
sudo systemctl restart docket

# Check status
sudo systemctl status docket

# Enable auto-start on boot
sudo systemctl enable docket

# View real-time logs
sudo journalctl -u docket -f

# View nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### systemd Service Configuration
```ini
[Unit]
Description=Docket Document Management System
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Docket---Document-Management-System/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name 54.254.200.247;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔄 Recent Updates

### UI/UX Improvements
- ✅ Improved typography with higher contrast colors for better readability
- ✅ Changed from green-tinted text to professional neutral grays
- ✅ Removed promotional banners and footer text for cleaner interface
- ✅ Simplified page title to "Docket"
- ✅ Enhanced login page readability with darker, more legible text
- ✅ Cleaner sidebar without promotional content

### Backend Features
- ✅ Document approval workflow implementation
- ✅ Status-based filtering (Pending, Approved, Archived)
- ✅ Department Head privileges and authorization
- ✅ User deletion with system admin protection
- ✅ Pending approvals dashboard and alerts
- ✅ Database migration for approval workflow fields
- ✅ Authorization middleware for all API endpoints

---

## 👥 Authors

- Joshua Castillejos
- Justin Cedric Espe
- Shamier Repalda
- Cj Rigor
- Jhonard Rollo

**Course:** CCS4301 – Cloud Computing  
**Semester:** 1st Semester 2026-2027  
**Institution:** University of the East — College of Engineering

---

## 📄 License

This project is part of an academic requirement for CCS4301 – Cloud Computing.

---

## 🔗 Links

- **Live Application:** http://54.254.200.247
- **GitHub Repository:** https://github.com/Jhonard2314/Docket
- **University:** University of the East
