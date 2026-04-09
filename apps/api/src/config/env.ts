export const env = {
  PORT: parseInt(process.env.PORT || '4000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  MAILJET_API_KEY: process.env.MAILJET_API_KEY || '',
  MAILJET_API_SECRET: process.env.MAILJET_API_SECRET || '',
  MAILJET_FROM_EMAIL: process.env.MAILJET_FROM_EMAIL || '',
  MAILJET_FROM_NAME: process.env.MAILJET_FROM_NAME || 'Vouch',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
};

const required = [
  'DATABASE_URL',
  'GEMINI_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const key of required) {
  if (!env[key as keyof typeof env]) {
    console.warn(`Warning: Missing environment variable ${key}`);
  }
}