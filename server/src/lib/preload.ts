import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== "production") {
  const envPath = path.resolve(__dirname, '../../.env');
  console.log('📁 PRELOAD: Loading .env from:', envPath);
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn('PRELOAD: Failed to load .env file:', result.error);
  } else {
    console.log('PRELOAD: .env loaded successfully');
  }
} else {
  console.log('PRELOAD: Production mode, using injected environment variables.');
}