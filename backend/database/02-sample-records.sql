

\c docket_db;

INSERT INTO departments (id, name) VALUES
  (gen_random_uuid()::text, 'Human Resources'),
  (gen_random_uuid()::text, 'Finance'),
  (gen_random_uuid()::text, 'Legal'),
  (gen_random_uuid()::text, 'Operations'),
  (gen_random_uuid()::text, 'IT & Technology'),
  (gen_random_uuid()::text, 'Marketing')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (id, name) VALUES
  (gen_random_uuid()::text, 'Policy'),
  (gen_random_uuid()::text, 'Report'),
  (gen_random_uuid()::text, 'Contract'),
  (gen_random_uuid()::text, 'Memo'),
  (gen_random_uuid()::text, 'Presentation'),
  (gen_random_uuid()::text, 'Invoice'),
  (gen_random_uuid()::text, 'Manual'),
  (gen_random_uuid()::text, 'Other')
ON CONFLICT (name) DO NOTHING;
