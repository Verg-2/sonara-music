#!/usr/bin/env node
// Cross-platform script to start Rust service
const { spawn } = require('child_process');
const path = require('path');

const rustPath = path.join(__dirname, '../../rust-service');

console.log('[RUST] Starting Rust service...');
console.log('[RUST] Path:', rustPath);

const rustProcess = spawn('cargo', ['run'], {
    cwd: rustPath,
    stdio: 'inherit',
    shell: true
});

rustProcess.on('error', (err) => {
    console.error('[RUST] Error starting Rust service:', err);
    process.exit(1);
});

rustProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`[RUST] Rust service exited with code ${code}`);
        process.exit(code);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('[RUST] Stopping Rust service...');
    rustProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[RUST] Stopping Rust service...');
    rustProcess.kill('SIGTERM');
    process.exit(0);
});


