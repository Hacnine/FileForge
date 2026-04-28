process.env.APP_NAME = "saas-file-management-backend-test";
process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/saas_file_management_test";
process.env.JWT_SECRET = "test-access-secret-with-at-least-32-chars";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-with-at-least-32-chars";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.FRONTEND_URL = "http://localhost:3000,http://localhost:3001";
process.env.ACCESS_TOKEN_COOKIE_NAME = "access_token";
process.env.REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
process.env.COOKIE_SAME_SITE = "lax";
process.env.LOG_LEVEL = "silent";
process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "mailer@example.com";
process.env.SMTP_PASS = "password";