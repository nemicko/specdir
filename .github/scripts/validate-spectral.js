#!/usr/bin/env node

// Validates that each listed URL returns a valid Spectral package.
// A valid package must contain at least one .spectral node with required metadata.

const fs = require('fs');
const yaml = require('js-yaml');
const https = require('https');
const http = require('http');

const REQUIRED_NODE_FIELDS = ['spectral', 'node', 'description'];
const VALID_NODE_SUFFIXES = ['model', 'views', 'interactions', 'interfaces', 'index'];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    let data = '';
    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function validateNode(content, url) {
  const errors = [];

  let parsed;
  try {
    parsed = yaml.load(content);
  } catch (e) {
    return [`invalid YAML: ${e.message}`];
  }

  if (!parsed || typeof parsed !== 'object') {
    return ['spec did not parse to an object'];
  }

  // Check required metadata fields
  for (const field of REQUIRED_NODE_FIELDS) {
    if (!parsed[field]) errors.push(`missing field: "${field}"`);
  }

  // Check spectral version declared
  if (parsed.spectral && typeof parsed.spectral !== 'string') {
    errors.push(`"spectral" version must be a string`);
  }

  // Check node address format
  if (parsed.node) {
    const parts = parsed.node.split('.');
    const isIndex = url && url.endsWith('index.spectral');
    if (parts.length < 2 && !isIndex) {
      errors.push(`"node" must be dot-notation with at least 2 parts e.g. "users.model"`);
    }
    if (parts.length >= 2) {
      const suffix = parts[parts.length - 1];
      if (parts.length === 2 && !VALID_NODE_SUFFIXES.includes(suffix) && suffix !== parts[0]) {
        errors.push(`unknown node type "${suffix}" — expected one of: ${VALID_NODE_SUFFIXES.join(', ')}`);
      }
    }
  }

  // Check dependencies format
  if (parsed.dependencies !== undefined) {
    if (!Array.isArray(parsed.dependencies)) {
      errors.push(`"dependencies" must be an array`);
    } else {
      for (const dep of parsed.dependencies) {
        if (typeof dep !== 'string') {
          errors.push(`dependency entries must be strings`);
          break;
        }
        if (!dep.startsWith('@') && !dep.startsWith('http')) {
          errors.push(`dependency "${dep}" must start with @ (local ref) or http (registry URL)`);
        }
      }
    }
  }

  return errors;
}

async function main() {
  const raw = fs.readFileSync('./registry.yaml', 'utf8');
  const registry = yaml.load(raw);
  const packages = registry.packages || [];

  console.log(`Validating Spectral format for ${packages.length} package(s)...\n`);

  let failed = 0;

  for (const pkg of packages) {
    if (!pkg.url || pkg.maturity === 'deprecated') {
      console.log(`  SKIP [${pkg.name}]`);
      continue;
    }

    try {
      const response = await fetch(pkg.url);

      if (response.status !== 200) {
        console.log(`  FAIL [${pkg.name}] HTTP ${response.status}`);
        failed++;
        continue;
      }

      const errors = validateNode(response.body, pkg.url);

      if (errors.length > 0) {
        console.log(`  FAIL [${pkg.name}]`);
        errors.forEach(e => console.log(`       - ${e}`));
        failed++;
      } else {
        const parsed = yaml.load(response.body);
        console.log(`  OK   [${pkg.name}] node: ${parsed.node} (spectral ${parsed.spectral})`);
      }

    } catch (err) {
      console.log(`  FAIL [${pkg.name}] ${err.message}`);
      failed++;
    }
  }

  console.log('');

  if (failed > 0) {
    console.log(`Spectral validation failed: ${failed} package(s) invalid`);
    process.exit(1);
  }

  console.log(`All packages valid Spectral format`);
}

main();
