-- FlowCast Seed: Default Admin User
-- Password: admin123  (bcrypt hash below)
-- Change this immediately in production!

INSERT INTO users (email, password_hash, role)
VALUES (
  'admin@flowcast.ai',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
