#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  console.log('Starting AFC Richman application...');
  execSync('cross-env NODE_ENV=production node dist/index.mjs', { 
    stdio: 'inherit', 
    cwd: __dirname 
  });
} catch (error) {
  console.error('Failed to start application:', error.message);
  process.exit(1);
}