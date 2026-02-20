#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

const REQUIRED_FIELDS = ['name', 'description', 'author', 'domain', 'url', 'tags', 'maturity', 'submitted'];
const VALID_MATURITY = ['draft', 'beta', 'stable', 'deprecated'];
const NAME_PATTERN = /^[a-z][a-z0-9]*\.[a-z][a-z0-9]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

let errors = [];
let warnings = [];

function error(pkg, msg) { errors.push(`  x [${pkg}] ${msg}`); }
function warn(pkg, msg) { warnings.push(`  ! [${pkg}] ${msg}`); }

try {
  const raw = fs.readFileSync('./registry.yaml', 'utf8');
  const registry = yaml.load(raw);

  if (!registry.packages || !Array.isArray(registry.packages)) {
    console.error('registry.yaml must contain a top-level "packages" array');
    process.exit(1);
  }

  const names = new Set();
  const urls = new Set();

  for (const pkg of registry.packages) {
    const id = pkg.name || '(unnamed)';

    for (const field of REQUIRED_FIELDS) {
      if (!pkg[field]) error(id, `missing required field: "${field}"`);
    }

    if (pkg.name && !NAME_PATTERN.test(pkg.name)) {
      error(id, `name must match publisher.domain (lowercase alphanumeric, dot separator) — got "${pkg.name}"`);
    }

    if (pkg.name) {
      if (names.has(pkg.name)) error(id, `duplicate name`);
      else names.add(pkg.name);
    }

    if (pkg.url) {
      if (urls.has(pkg.url)) error(id, `duplicate url`);
      else urls.add(pkg.url);
    }

    if (pkg.description && pkg.description.length > 120) {
      error(id, `description exceeds 120 chars (${pkg.description.length})`);
    }

    if (pkg.maturity && !VALID_MATURITY.includes(pkg.maturity)) {
      error(id, `maturity must be one of: ${VALID_MATURITY.join(', ')}`);
    }

    if (pkg.maturity === 'deprecated' && !pkg.replacement) {
      warn(id, `deprecated package should include a replacement URL`);
    }

    if (pkg.domain && pkg.url) {
      try {
        const urlDomain = new URL(pkg.url).hostname.replace(/^www\./, '');
        const declared = pkg.domain.replace(/^www\./, '');
        const isGithubMirrorForSpecdir = declared === 'specdir.com' && urlDomain === 'raw.githubusercontent.com';
        if (!isGithubMirrorForSpecdir && !urlDomain.endsWith(declared) && !declared.endsWith(urlDomain)) {
          error(id, `domain "${pkg.domain}" does not match URL hostname "${urlDomain}"`);
        }
      } catch {
        error(id, `invalid URL: "${pkg.url}"`);
      }
    }

    if (pkg.tags && (!Array.isArray(pkg.tags) || pkg.tags.length === 0)) {
      error(id, `tags must be a non-empty array`);
    }

    if (pkg.submitted && !DATE_PATTERN.test(pkg.submitted)) {
      error(id, `submitted must be YYYY-MM-DD`);
    }
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(w => console.log(w));
  }

  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(e));
    console.log(`\nValidation failed with ${errors.length} error(s)`);
    process.exit(1);
  }

  console.log(`OK registry.yaml valid — ${registry.packages.length} package(s) passed`);

} catch (err) {
  console.error(`Failed to parse registry.yaml: ${err.message}`);
  process.exit(1);
}
