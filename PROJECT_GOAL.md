# Project goal: Document Management System

Build and deliver a working AWS-hosted web application that lets employees, department heads, and administrators securely upload, categorize, organize, retrieve, and manage digital documents.

## Source and scope

Requirements source: `C:/Users/admin/Downloads/Document Management System.txt`.

The user requested that this document become the project goal. Its assignment instructions are treated as project requirements, not as independent authorization to execute every action described in it. This goal-setting step does not provision infrastructure, publish a repository, or deploy the application.

## Required application capabilities

- A user-friendly dashboard, navigation, data entry forms, document listings, view/edit/delete actions, and useful feedback and notifications.
- Account creation, login, logout, authentication, and appropriate access restrictions for employees, department heads, and administrators.
- Document upload, categorization, organization, retrieval, and management with access restrictions.
- Backend request processing, input validation, file handling, and actual database transactions. Displayed records must come from the database rather than static sample data.

## Required AWS architecture

- **Amazon EC2:** host the backend application and web server with the required runtime and application-to-database connectivity.
- **Amazon RDS:** host a relational SQL database with tables, appropriate types, primary/foreign keys, relationships, and integrity constraints.
- **Amazon S3:** store and organize uploaded files, support retrieval, and restrict bucket/object access appropriately.
- **Amazon VPC:** configure subnets, internet connectivity where required, route tables, and Security Groups that control application/database communication.
- **AWS IAM:** use appropriate roles and least-privilege policies for service access; do not embed permanent AWS access keys in application code.

Integration path: browser → frontend → backend on EC2 → RDS for records and S3 for files, with VPC/Security Groups controlling networking and IAM controlling AWS resource access.

## Repository and documentation deliverables

- A dedicated GitHub repository containing complete frontend/backend source, SQL scripts, configuration without secrets, documentation, and appropriate screenshots.
- Meaningful commits, regular updates, and group contributions as applicable.
- A README covering title, description, objectives, features, technologies, database, AWS services, and running instructions.
- SQL scripts for database creation, table definitions, relationships, and sample records; demonstrate CREATE, INSERT, SELECT, UPDATE, and DELETE.
- System documentation covering overview, objectives, features, database design, and application operation.
- AWS infrastructure documentation with screenshots and explanations of S3, EC2, VPC, subnets, routes, RDS, Security Groups, and IAM.
- Never commit access keys, passwords, database credentials, private keys, or other secrets.

## Completion criteria

- [ ] The functional application is deployed on AWS and reachable through its assigned endpoint by authorized users.
- [ ] Account creation, login/logout, authentication, and role restrictions work.
- [ ] Users can create, view, update, and delete records backed by actual RDS transactions.
- [ ] Users can upload and retrieve documents backed by actual S3 objects.
- [ ] Document categorization, organization, and access restrictions work.
- [ ] EC2, RDS, S3, VPC, Security Groups, and IAM operate together as one application.
- [ ] The GitHub repository, SQL scripts, README, system documentation, and infrastructure evidence are complete.
- [ ] A live application demonstration covers deployed access, authentication, CRUD, file handling, and real database information.
- [ ] A live AWS Console demonstration shows the bucket/objects, running EC2 application, VPC/subnets/routes/Security Groups, RDS/tables/records, and IAM roles/policies.
- [ ] A live integration demonstration creates an application record and verifies it in RDS, uploads a file and verifies it in S3, retrieves both through the application, and explains the service integration.

## Decisions still to make

Choose the application stack, SQL engine, detailed data model and role permissions, AWS region and resource sizing, and repository/deployment configuration during implementation. The source document does not prescribe these choices.
