import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';

// Remove pnpm lockfile if it exists
if (existsSync('../pnpm-lock.yaml')) {
  unlinkSync('../pnpm-lock.yaml');
  console.log('Removed pnpm-lock.yaml');
}

// Generate npm lockfile
console.log('Generating package-lock.json...');
execSync('cd .. && npm install --package-lock-only --legacy-peer-deps', { stdio: 'inherit' });
console.log('Done! package-lock.json created.');
