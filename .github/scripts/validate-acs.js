#!/usr/bin/env node

// Validates that each listed URL returns a valid ACS file.
// A valid ACS file must include an ACS metadata block with DOMAIN/CONTEXT/VERSION.

const fs = require('fs');
const yaml = require('js-yaml');
const https = require('https');
const http = require('http');

const REQUIRED_METADATA = ['DOMAIN', 'CONTEXT', 'VERSION'];
const VALID_CONTEXTS = ['Schema', 'Flow', 'Contract', 'Persona'];
const DOMAIN_PATTERN = /^[a-z][a-z0-9]*\.[a-z][a-z0-9]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    let data = '';
    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function parseMetadata(content) {
  const match = content.match(/:::ACS_METADATA\s*([\s\S]*?)\s*:::/m);
  if (!match) {
    return null;
  }

  const metadata = {};
  const lines = match[1].split('\n');
  let currentKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const keyMatch = line.match(/^([A-Z]+):\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const value = keyMatch[2];
      metadata[key] = value;
      currentKey = key;
      continue;
    }

    if (currentKey === 'IMPORT' && line.startsWith('- ')) {
      metadata.IMPORT = metadata.IMPORT || [];
      metadata.IMPORT.push(line.slice(2).trim());
    }
  }

  return metadata;
}

function validateContextForFilename(context, url) {
  try {
    const pathname = new URL(url).pathname;
    const file = pathname.split('/').pop() || '';
    const match = file.match(/\.(schema|flow|contract|persona)\.acs$/i);
    if (!match) return null;

    const expected = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    if (context !== expected) {
      return `CONTEXT "${context}" does not match filename context "${expected}"`;
    }
  } catch {
    return null;
  }
  return null;
}

function validateACS(content, url) {
  const errors = [];
  const metadata = parseMetadata(content);

  if (!metadata) {
    return ['missing :::ACS_METADATA block'];
  }

  for (const field of REQUIRED_METADATA) {
    if (!metadata[field]) {
      errors.push(`missing metadata field: "${field}"`);
    }
  }

  if (metadata.DOMAIN && !DOMAIN_PATTERN.test(metadata.DOMAIN)) {
    errors.push('DOMAIN must match company.subsystem (lowercase alphanumeric, dot separator)');
  }

  if (metadata.CONTEXT && !VALID_CONTEXTS.includes(metadata.CONTEXT)) {
    errors.push(`CONTEXT must be one of: ${VALID_CONTEXTS.join(', ')}`);
  }

  if (metadata.VERSION && !SEMVER_PATTERN.test(metadata.VERSION)) {
    errors.push('VERSION must be SemVer (x.y.z)');
  }

  if (!url.endsWith('.acs')) {
    errors.push('registry URL must point to a .acs file');
  }

  if (metadata.CONTEXT) {
    const contextError = validateContextForFilename(metadata.CONTEXT, url);
    if (contextError) {
      errors.push(contextError);
    }
  }

  return errors;
}

async function main() {
  const raw = fs.readFileSync('./registry.yaml', 'utf8');
  const registry = yaml.load(raw);
  const features = registry.features || [];

  console.log(`Validating ACS format for ${features.length} feature(s)...\n`);

  let failed = 0;

  for (const feature of features) {
    if (!feature.url || feature.maturity === 'deprecated') {
      console.log(`  SKIP [${feature.name}]`);
      continue;
    }

    try {
      const response = await fetch(feature.url);

      if (response.status !== 200) {
        console.log(`  FAIL [${feature.name}] HTTP ${response.status}`);
        failed++;
        continue;
      }

      const errors = validateACS(response.body, feature.url);
      const metadata = parseMetadata(response.body) || {};

      if (errors.length > 0) {
        console.log(`  FAIL [${feature.name}]`);
        errors.forEach((e) => console.log(`       - ${e}`));
        failed++;
      } else {
        console.log(
          `  OK   [${feature.name}] feature: ${metadata.DOMAIN} context: ${metadata.CONTEXT} (acs ${metadata.VERSION})`
        );
      }
    } catch (err) {
      console.log(`  FAIL [${feature.name}] ${err.message}`);
      failed++;
    }
  }

  console.log('');

  if (failed > 0) {
    console.log(`ACS validation failed: ${failed} feature(s) invalid`);
    process.exit(1);
  }

  console.log('All features valid ACS format');
}

main();
