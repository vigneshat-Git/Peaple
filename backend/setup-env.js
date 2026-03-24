#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the .env.example file
const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  process.exit(0);
}

try {
  // Copy .env.example to .env
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  fs.writeFileSync(envPath, envExample);
  
  console.log('✅ Created .env file from .env.example');
  console.log('\n📝 Important: Make sure these Google OAuth values are set in your .env:');
  console.log('   GOOGLE_CLIENT_ID=814546020627-04jjtfg6kl5kcj7d7lkfr6h3nscqngmo.apps.googleusercontent.com');
  console.log('   GOOGLE_CLIENT_SECRET=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');
  console.log('   GOOGLE_REDIRECT_URI=https://peaple-production.up.railway.app/api/auth/google/callback');
  console.log('\n🚀 Restart your backend server after updating the .env file');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}
