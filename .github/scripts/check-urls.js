#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const https = require('https');
const http = require('http');

function fetchHead(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
    });
    req.on('error', (err) => resolve({ ok: false, status: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 'timeout' });
    });
    req.end();
  });
}

async function main() {
  const raw = fs.readFileSync('./registry.yaml', 'utf8');
  const registry = yaml.load(raw);
  const features = registry.features || [];

  console.log(`Checking ${features.length} URL(s)...\n`);

  let failed = 0;

  for (const feature of features) {
    if (!feature.url) {
      console.log(`  SKIP [${feature.name}] no URL`);
      continue;
    }

    const result = await fetchHead(feature.url);

    if (result.ok) {
      console.log(`  OK   [${feature.name}] ${feature.url} (${result.status})`);
    } else {
      console.log(`  FAIL [${feature.name}] ${feature.url} (${result.status})`);
      failed++;
    }
  }

  console.log('');

  if (failed > 0) {
    console.log(`URL check failed: ${failed} unreachable URL(s)`);
    process.exit(1);
  }

  console.log('All URLs reachable');
}

main();
