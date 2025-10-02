#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('node:path');

async function main() {
    console.log('--- Build nas ---');

    const distPath = path.resolve(__dirname, '../dist');

    await fs.move(
        path.resolve(distPath, 'index.html'),
        path.resolve(distPath, 'index.php'),
    );

    await fs.rm(
        path.resolve(distPath, 'pic'),
        { recursive: true, force: true },
    );
}

main();
