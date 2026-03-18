#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

console.log('🔄 Restarting backend services...\n');

async function restartServices() {
  try {
    // Start auth service
    console.log('🚀 Starting Auth Service (port 4001)...');
    const authProcess = exec('npm start', {
      cwd: path.join(__dirname, 'services', 'auth-service'),
      detached: true
    });
    
    authProcess.unref();
    authProcess.stdout?.pipe(process.stdout);
    authProcess.stderr?.pipe(process.stderr);
    
    // Wait a moment for auth service to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start API Gateway
    console.log('🚀 Starting API Gateway (port 5000)...');
    const gatewayProcess = exec('npm start', {
      cwd: path.join(__dirname, 'gateway', 'api-gateway'),
      detached: true
    });
    
    gatewayProcess.unref();
    gatewayProcess.stdout?.pipe(process.stdout);
    gatewayProcess.stderr?.pipe(process.stderr);
    
    console.log('\n✅ Services restarted successfully!');
    console.log('📍 Auth Service: http://localhost:4001');
    console.log('📍 API Gateway: http://localhost:5000');
    console.log('\n🎯 Google OAuth should now be working!');
    
  } catch (error) {
    console.error('❌ Error restarting services:', error.message);
  }
}

restartServices();
