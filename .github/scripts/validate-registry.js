#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

const REQUIRED_FIELDS = ['name', 'description', 'author', 'domain', 'url', 'tags', 'maturity', 'submitted'];
const VALID_MATURITY = ['draft', 'beta', 'stable', 'deprecated'];
const NAME_PATTERN = /^[a-z][a-z0-9]*\.[a-z][a-z0-9]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const warnings = [];

function error(feature, msg) {
  errors.push(`  x [${feature}] ${msg}`);
}
function warn(feature, msg) {
  warnings.push(`  ! [${feature}] ${msg}`);
}

try {
  const raw = fs.readFileSync('./registry.yaml', 'utf8');
  const registry = yaml.load(raw);
  const features = registry.features;

  if (!features || !Array.isArray(features)) {
    console.error('registry.yaml must contain a top-level "features" array');
    process.exit(1);
  }

  const names = new Set();
  const urls = new Set();

  for (const feature of features) {
    const id = feature.name || '(unnamed)';

    for (const field of REQUIRED_FIELDS) {
      if (!feature[field]) error(id, `missing required field: "${field}"`);
    }

    if (feature.name && !NAME_PATTERN.test(feature.name)) {
      error(id, `name must match company.subsystem (lowercase alphanumeric, dot separator) — got "${feature.name}"`);
    }

    if (feature.name) {
      if (names.has(feature.name)) error(id, 'duplicate name');
      else names.add(feature.name);
    }

    if (feature.url) {
      if (urls.has(feature.url)) error(id, 'duplicate url');
      else urls.add(feature.url);

      if (!feature.url.endsWith('.acs')) {
        error(id, 'url must point to a .acs file');
      }
    }

    if (feature.description && feature.description.length > 120) {
      error(id, `description exceeds 120 chars (${feature.description.length})`);
    }

    if (feature.maturity && !VALID_MATURITY.includes(feature.maturity)) {
      error(id, `maturity must be one of: ${VALID_MATURITY.join(', ')}`);
    }

    if (feature.maturity === 'deprecated' && !feature.replacement) {
      warn(id, 'deprecated feature should include a replacement URL');
    }

    if (feature.domain && feature.url) {
      try {
        const urlDomain = new URL(feature.url).hostname.replace(/^www\./, '');
        const declared = feature.domain.replace(/^www\./, '');
        const isGithubMirrorForSpecdir = declared === 'specdir.com' && urlDomain === 'raw.githubusercontent.com';
        if (!isGithubMirrorForSpecdir && !urlDomain.endsWith(declared) && !declared.endsWith(urlDomain)) {
          error(id, `domain "${feature.domain}" does not match URL hostname "${urlDomain}"`);
        }
      } catch {
        error(id, `invalid URL: "${feature.url}"`);
      }
    }

    if (feature.tags && (!Array.isArray(feature.tags) || feature.tags.length === 0)) {
      error(id, 'tags must be a non-empty array');
    }

    if (feature.submitted && !DATE_PATTERN.test(feature.submitted)) {
      error(id, 'submitted must be YYYY-MM-DD');
    }
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach((w) => console.log(w));
  }

  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach((e) => console.log(e));
    console.log(`\nValidation failed with ${errors.length} error(s)`);
    process.exit(1);
  }

  console.log(`OK registry.yaml valid — ${features.length} feature(s) passed`);
} catch (err) {
  console.error(`Failed to parse registry.yaml: ${err.message}`);
  process.exit(1);
}
