import 'dotenv/config';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cleverbooks';
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SEED_SCRIPT_PATH = resolve(SCRIPT_DIR, '../seeds/seed.js');

function runSeedScript() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SEED_SCRIPT_PATH], {
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Seed script exited with code ${code}`));
    });
  });
}

async function resetDatabase() {
  try {
    console.log('[Reset] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Reset] Connected to MongoDB');

    console.log('[Reset] Dropping database...');
    await mongoose.connection.dropDatabase();
    console.log('[Reset] Database dropped successfully');

    await mongoose.connection.close();
    console.log('[Reset] MongoDB connection closed');

    console.log('[Reset] Seeding fresh data...');
    await runSeedScript();
    console.log('[Reset] Database reset completed successfully');
  } catch (error) {
    console.error('[Reset] Error:', error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

resetDatabase();