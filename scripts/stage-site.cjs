#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, '_site');
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination);
for (const filename of ['index.html', '.nojekyll', 'css', 'js', 'assets']) {
  fs.cpSync(path.join(root, filename), path.join(destination, filename), { recursive: true });
}
console.log('Static game files staged in _site/.');
