import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3002', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173'),
    credentials: true,
  },

  // File Storage
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
    // Public endpoint for URLs accessible by browser (hostname only, no http://)
    publicEndpoint: (process.env.STORAGE_PUBLIC_ENDPOINT || process.env.STORAGE_ENDPOINT || 'localhost').replace(/^https?:\/\//, '').replace(/:\d+$/, ''),
    port: parseInt(process.env.STORAGE_PORT || '9000', 10),
    // Public port for browser-accessible URLs (may differ from internal port, e.g. demo uses 9002)
    publicPort: parseInt(process.env.STORAGE_PUBLIC_PORT || process.env.STORAGE_PORT || '9000', 10),
    accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
    bucket: process.env.STORAGE_BUCKET || 'synax-files',
    useSSL: process.env.STORAGE_USE_SSL === 'true',
  },
} as const;

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set`);
  }
}
