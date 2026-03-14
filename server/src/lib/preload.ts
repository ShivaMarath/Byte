import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Current file: /server/src/lib/preload.ts
// Need to go up TWO levels to reach server root: src/lib -> src -> server root
const envPath = path.resolve(__dirname, '../../.env');
console.log('📁 PRELOAD: Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(' PRELOAD: Failed to load .env file:', result.error);
  console.error(' Make sure .env exists at:', envPath);
  process.exit(1);
} else {
  console.log(' PRELOAD: .env loaded successfully');
  console.log(' PRELOAD: Variables loaded:', Object.keys(result.parsed || {}).length);
  console.log(' PRELOAD: GitHub ID present:', !!process.env.GITHUB_CLIENT_ID);
  console.log(' PRELOAD: GitHub Secret present:', !!process.env.GITHUB_CLIENT_SECRET);
}