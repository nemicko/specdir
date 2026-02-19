#!/usr/bin/env node

// Converts registry.yaml to registry.json for programmatic access by AI agents

const fs = require('fs');
const yaml = require('js-yaml');

const raw = fs.readFileSync('./registry.yaml', 'utf8');
const registry = yaml.load(raw);

registry.generated = new Date().toISOString();
registry.count = registry.packages ? registry.packages.length : 0;

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/registry.json', JSON.stringify(registry, null, 2));
fs.copyFileSync('./registry.yaml', './dist/registry.yaml');

console.log(`Generated registry.json with ${registry.count} package(s)`);
