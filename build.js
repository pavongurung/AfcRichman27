#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  console.log('Building frontend...');
  execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
  
  console.log('Building backend with ESM format...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --outdir=dist --format=esm', {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}