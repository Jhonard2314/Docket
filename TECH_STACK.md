# Document Management System: proposed tech stack

Planning baseline prepared November 18, 2026, for the November 26, 2026 deadline.

## Basis for the recommendation

- Five team members; the user has experience with Next.js and TypeScript.
- An interactive dashboard is a priority.
- Complete the core working system before considering additional features.
- Use a teammate's AWS account with credits; available credits, account permissions, and resource costs still need verification before provisioning.
- Follow the requirements in `Document Management System.txt` and the scope summarized in `PROJECT_GOAL.md`.

## Application stack

| Component | Recommendation | Responsibility |
| --- | --- | --- |
| Application framework | Next.js App Router with React | Dashboard pages and backend Route Handlers in one application |
| Language | TypeScript | Frontend and backend application code |
| Styling | Tailwind CSS | Responsive layouts and visual styling |
| UI components | shadcn/ui | Tables, forms, dialogs, navigation, and feedback |
| Authentication | Better Auth | Email/password authentication and database-backed sessions |
| Authorization | Application-level server-side checks | Employee, department-head, and administrator permissions, plus document access rules |
| SQL database | PostgreSQL on Amazon RDS | Users, departments, categories, document metadata, access rules, and authentication records |
| Database access | Prisma ORM | Relational models, migrations, queries, and transactions |
| File integration | AWS SDK for JavaScript v3 | Server-side S3 operations and presigned URLs |
| Source control and packages | GitHub and npm | Team collaboration and a committed package lockfile |

PostgreSQL is the recommended SQL engine because the core data is relational and needs foreign keys, constraints, and transactions. It is available through Amazon RDS and works with the proposed application stack. The team has no existing SQL-engine preference.

Next.js provides the backend through Route Handlers running on EC2. Database access, authorization checks, validation, and S3 permissions belong on the server. The browser receives only data and operations allowed for the authenticated user.

Better Auth handles authentication; it does not automatically define the project's department and document access policies. Those policies must be implemented and enforced by the application.

## AWS and hosting stack

| Component | Recommendation | Responsibility |
| --- | --- | --- |
| Compute | Amazon EC2 with Ubuntu LTS and a compatible Node.js LTS release | Run the Next.js production server |
| Web server | Nginx | Reverse proxy to Next.js and serve the public HTTPS endpoint |
| Process supervision | systemd | Start the application on boot and restart it after failures |
| Database | Amazon RDS for PostgreSQL | Managed SQL database with application access restricted by Security Groups |
| File storage | Private Amazon S3 bucket | Store uploaded document files |
| Networking | Amazon VPC, subnets, route tables, and Security Groups | Public application access and controlled database connectivity |
| AWS permissions | IAM role attached to EC2 | Least-privilege access to the application's S3 resources without permanent AWS keys in code |

Initial deployment target: one EC2 application instance and one Single-AZ RDS database instance. Select the AWS region and instance sizes after checking the account's available credits and estimating costs. RDS should be private, with database access allowed from the application's Security Group. Its DB subnet group must cover at least two Availability Zones even for a Single-AZ deployment.

Choose the public hostname and TLS certificate setup before deployment. Keep credentials and session secrets in protected server configuration, outside GitHub and browser bundles.

## Integration flow

1. The browser accesses the dashboard through Nginx and the Next.js server on EC2.
2. The server authenticates the user, checks permissions, validates input, and processes requests.
3. Prisma reads and writes actual PostgreSQL records in RDS.
4. Actual document files are stored in S3; their object keys and metadata are stored in RDS.
5. The backend authorizes each file operation. For downloads, it can issue a short-lived presigned URL for the specific private object.
6. VPC Security Groups restrict network access; the EC2 IAM role controls AWS service permissions.

## First-version scope

- Account creation, login, and logout.
- Employee, department-head, and administrator access restrictions.
- Dashboard showing database-backed information.
- Document upload, listing, download, metadata editing, and deletion.
- Document categories and department organization.
- Search by title or filename, with category and department filters subject to access rules.
- Drag-and-drop uploads, upload progress, loading indicators, and success/error feedback.

Approval workflows, document version history, OCR, and searching inside document contents remain optional additions after the integrated core system works.

Detailed permissions, account-creation rules, accepted file types, file-size limits, and deletion behavior remain requirements decisions for the next planning step.

## SQL deliverables and dependency policy

Prisma is an application development tool, not a replacement for the assignment's SQL deliverables. Include executable PostgreSQL creation scripts, relationships and constraints, sample records, and examples demonstrating INSERT, SELECT, UPDATE, and DELETE. Keep these scripts consistent with the actual deployed schema and demonstrate live RDS transactions.

Pin compatible stable dependency versions and commit the npm lockfile during setup. The currently documented Better Auth Prisma integration uses Prisma ORM 7 and explicitly does not support Prisma ORM 8 yet; use a compatible Prisma 7 release for this baseline. Verify the exact Next.js, Node.js, Better Auth, and Prisma versions together when implementation begins.

## Technical references

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js self-hosting and reverse proxy guidance](https://nextjs.org/docs/app/guides/self-hosting)
- [shadcn/ui and Tailwind CSS installation](https://ui.shadcn.com/docs/installation/manual)
- [Better Auth email/password authentication](https://better-auth.com/docs/authentication/email-password)
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth Prisma adapter and compatibility](https://better-auth.com/docs/adapters/prisma)
- [Prisma ORM 7 PostgreSQL support](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql)
- [Amazon RDS overview and supported engines](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
- [Amazon RDS VPC and subnet requirements](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html)
- [S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [AWS SDK for JavaScript v3 S3 presigner](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/)
- [IAM roles for applications on EC2](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html)
