#!/usr/bin/env node

// Validates that each listed URL returns a valid ACL file.
// A valid ACL file must include an ACL metadata block with DOMAIN/CONTEXT/VERSION.
// Also validates local capability mappings in acl/mappings/*.map.acl.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');
const http = require('http');

const REQUIRED_METADATA = ['DOMAIN', 'CONTEXT', 'VERSION'];
const FEATURE_CONTEXTS = ['Schema', 'Flow', 'Contract', 'Persona'];
const VALID_CONTEXTS = [...FEATURE_CONTEXTS, 'Mapping'];
const DOMAIN_PATTERN = /^[a-z][a-z0-9]*\.[a-z][a-z0-9]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const CAPABILITY_PATTERN = /^[a-z][a-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+$/;
const ALIAS_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

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
  const match = content.match(/:::ACL_METADATA\s*([\s\S]*?)\s*:::/m);
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
      metadata[key] = value || '';
      currentKey = key;
      continue;
    }

    if ((currentKey === 'IMPORT' || currentKey === 'REQUIRES') && line.startsWith('- ')) {
      metadata[currentKey] = metadata[currentKey] || [];
      metadata[currentKey].push(line.slice(2).trim());
    }
  }

  return metadata;
}

function getSourcePathname(source) {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      return new URL(source).pathname;
    } catch {
      return source;
    }
  }
  return source;
}

function validateContextForSource(context, source) {
  try {
    const pathname = getSourcePathname(source);
    const file = pathname.split('/').pop() || '';
    const mapMatch = file.match(/\.map\.acl$/i);
    if (mapMatch) {
      if (context !== 'Mapping') {
        return `CONTEXT "${context}" does not match filename context "Mapping"`;
      }
      return null;
    }

    const match = file.match(/\.(schema|flow|contract|persona)\.acl$/i);
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

function isValidRangeToken(token) {
  if (token === '*') return true;
  return /^(?:\^|~|>=|<=|>|<)?\d+\.\d+(?:\.\d+)?$/.test(token);
}

function isValidSemverRange(range) {
  const tokens = range
    .split('||')
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(isValidRangeToken);
}

function parseImportEntry(entry) {
  const match = entry.match(/^([a-z][a-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+)\s+AS\s+([A-Z][A-Za-z0-9]*)$/);
  if (!match) return null;
  return { source: match[1], alias: match[2] };
}

function parseRequiresEntry(entry) {
  const match = entry.match(
    /^([a-z][a-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+)\@([^\s]+)\s+AS\s+([A-Z][A-Za-z0-9]*)$/
  );
  if (!match) return null;
  return { capability: match[1], range: match[2], alias: match[3] };
}

function normalizeVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] || 0),
  };
}

function parseRangeAnchor(range) {
  const first = range
    .split('||')
    .map((token) => token.trim())
    .filter(Boolean)[0];
  if (!first || first === '*') return { op: '*', version: null };
  const match = first.match(/^(\^|~|>=|<=|>|<)?(\d+\.\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return { op: match[1] || '', version: normalizeVersion(match[2]) };
}

function rangesCompatible(requiredRange, providedRange) {
  if (requiredRange === '*' || providedRange === '*') return true;
  const required = parseRangeAnchor(requiredRange);
  const provided = parseRangeAnchor(providedRange);
  if (!required || !provided || !required.version || !provided.version) return false;
  if (required.version.major !== provided.version.major) return false;

  // Conservative check for ~ ranges: keep the same major/minor track.
  if (required.op === '~' && required.version.minor !== provided.version.minor) return false;
  if (provided.op === '~' && required.op === '~' && required.version.minor !== provided.version.minor) return false;
  return true;
}

function validateACL(content, source, options = {}) {
  const errors = [];
  const parsedImports = [];
  const parsedRequires = [];
  const metadata = parseMetadata(content);
  const allowMappingContext = options.allowMappingContext === true;
  const requireAclExtension = options.requireAclExtension !== false;

  if (!metadata) {
    return { errors: ['missing :::ACL_METADATA block'], metadata: null, imports: [], requires: [] };
  }

  for (const field of REQUIRED_METADATA) {
    if (!metadata[field]) {
      errors.push(`missing metadata field: "${field}"`);
    }
  }

  if (metadata.DOMAIN && !DOMAIN_PATTERN.test(metadata.DOMAIN)) {
    errors.push('DOMAIN must match company.subsystem (lowercase alphanumeric, dot separator)');
  }

  const allowedContexts = allowMappingContext ? VALID_CONTEXTS : FEATURE_CONTEXTS;
  if (metadata.CONTEXT && !allowedContexts.includes(metadata.CONTEXT)) {
    errors.push(`CONTEXT must be one of: ${allowedContexts.join(', ')}`);
  }

  if (metadata.VERSION && !SEMVER_PATTERN.test(metadata.VERSION)) {
    errors.push('VERSION must be SemVer (x.y.z)');
  }

  if (requireAclExtension && !source.endsWith('.acl')) {
    errors.push('source must point to a .acl file');
  }

  if (metadata.CONTEXT) {
    const contextError = validateContextForSource(metadata.CONTEXT, source);
    if (contextError) {
      errors.push(contextError);
    }
  }

  const aliasSet = new Set();
  for (const entry of metadata.IMPORT || []) {
    const parsed = parseImportEntry(entry);
    if (!parsed) {
      errors.push(`invalid IMPORT entry: "${entry}"`);
      continue;
    }
    if (!parsed.source.endsWith('.Contract')) {
      errors.push(`IMPORT must target a feature Contract: "${entry}"`);
    }
    if (!ALIAS_PATTERN.test(parsed.alias)) {
      errors.push(`IMPORT alias must be PascalCase: "${parsed.alias}"`);
    }
    if (aliasSet.has(parsed.alias)) {
      errors.push(`duplicate dependency alias: "${parsed.alias}"`);
    }
    aliasSet.add(parsed.alias);
    parsedImports.push(parsed);
  }

  for (const entry of metadata.REQUIRES || []) {
    const parsed = parseRequiresEntry(entry);
    if (!parsed) {
      errors.push(`invalid REQUIRES entry: "${entry}"`);
      continue;
    }
    if (!CAPABILITY_PATTERN.test(parsed.capability)) {
      errors.push(`REQUIRES capability path is invalid: "${parsed.capability}"`);
    }
    if (!isValidSemverRange(parsed.range)) {
      errors.push(`REQUIRES version range is invalid: "${parsed.range}"`);
    }
    if (!ALIAS_PATTERN.test(parsed.alias)) {
      errors.push(`REQUIRES alias must be PascalCase: "${parsed.alias}"`);
    }
    if (aliasSet.has(parsed.alias)) {
      errors.push(`duplicate dependency alias: "${parsed.alias}"`);
    }
    aliasSet.add(parsed.alias);
    parsedRequires.push(parsed);
  }

  return { errors, metadata, imports: parsedImports, requires: parsedRequires };
}

function collectFiles(rootDir, predicate) {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
      continue;
    }
    if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseCallOperations(content) {
  const callRegex = /\bCALL\s+([A-Z][A-Za-z0-9]*)\.([A-Za-z][A-Za-z0-9_]*)/g;
  const callsByAlias = new Map();
  let match;
  while ((match = callRegex.exec(content)) !== null) {
    const alias = match[1];
    const operation = match[2];
    if (!callsByAlias.has(alias)) {
      callsByAlias.set(alias, new Set());
    }
    callsByAlias.get(alias).add(operation);
  }
  return callsByAlias;
}

function parseMappingBlocks(content, filePath) {
  const mappings = [];
  const errors = [];
  const blockRegex = /MAPPING\s+([A-Za-z][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}/g;
  const blocks = [...content.matchAll(blockRegex)];

  if (blocks.length === 0) {
    errors.push(`${filePath}: missing MAPPING block`);
    return { mappings, errors };
  }

  for (const block of blocks) {
    const mappingName = block[1];
    const body = block[2];
    const lines = body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^- /, '').trim());

    let capability = null;
    let target = null;
    const operations = new Map();

    for (const line of lines) {
      if (line.startsWith('CAPABILITY ')) {
        const capMatch = line.match(
          /^CAPABILITY\s+([a-z][a-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+)\@([^\s]+)\s+AS\s+([A-Z][A-Za-z0-9]*)$/
        );
        if (!capMatch) {
          errors.push(`${filePath}: invalid CAPABILITY declaration in mapping "${mappingName}"`);
          continue;
        }
        const range = capMatch[2];
        if (!isValidSemverRange(range)) {
          errors.push(`${filePath}: invalid CAPABILITY version range "${range}" in mapping "${mappingName}"`);
        }
        capability = { path: capMatch[1], range, alias: capMatch[3] };
        continue;
      }

      if (line.startsWith('TO FEATURE ')) {
        const featureMatch = line.match(/^TO FEATURE\s+([a-z][a-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+)\@([^\s]+)$/);
        if (!featureMatch) {
          errors.push(`${filePath}: invalid TO FEATURE target in mapping "${mappingName}"`);
          continue;
        }
        if (!isValidSemverRange(featureMatch[2])) {
          errors.push(`${filePath}: invalid TO FEATURE version range "${featureMatch[2]}" in mapping "${mappingName}"`);
        }
        target = { type: 'feature', value: featureMatch[1], range: featureMatch[2] };
        continue;
      }

      if (line.startsWith('TO ADAPTER ')) {
        const adapterMatch = line.match(/^TO ADAPTER\s+([A-Za-z0-9._/-]+)$/);
        if (!adapterMatch) {
          errors.push(`${filePath}: invalid TO ADAPTER target in mapping "${mappingName}"`);
          continue;
        }
        target = { type: 'adapter', value: adapterMatch[1] };
        continue;
      }

      if (!line.includes('->')) continue;
      const opMatch = line.match(/^([A-Z][A-Za-z0-9]*)\.([A-Za-z][A-Za-z0-9_]*)\s*->\s*(.+)$/);
      if (!opMatch) {
        errors.push(`${filePath}: invalid operation mapping "${line}" in mapping "${mappingName}"`);
        continue;
      }
      operations.set(opMatch[2], { sourceAlias: opMatch[1], target: opMatch[3].trim() });
    }

    if (!capability) {
      errors.push(`${filePath}: mapping "${mappingName}" is missing CAPABILITY declaration`);
      continue;
    }

    if (!target) {
      errors.push(`${filePath}: mapping "${mappingName}" is missing TO FEATURE/TO ADAPTER binding`);
      continue;
    }

    if (operations.size === 0) {
      errors.push(`${filePath}: mapping "${mappingName}" is missing OPERATION MAP entries`);
      continue;
    }

    for (const [operation, op] of operations.entries()) {
      if (op.sourceAlias !== capability.alias) {
        errors.push(
          `${filePath}: mapping "${mappingName}" operation "${operation}" must use alias "${capability.alias}"`
        );
      }
    }

    mappings.push({ name: mappingName, capability, target, operations, filePath });
  }

  return { mappings, errors };
}

function validateLocalMappingsAndContracts() {
  const errors = [];
  const mappings = [];

  const mappingFiles = collectFiles(path.join('acl', 'mappings'), (filePath) => filePath.endsWith('.map.acl'));
  for (const filePath of mappingFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = validateACL(content, filePath, { allowMappingContext: true });
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        errors.push(`${filePath}: ${err}`);
      }
      continue;
    }
    if (result.metadata && result.metadata.CONTEXT !== 'Mapping') {
      errors.push(`${filePath}: mapping files must set CONTEXT to "Mapping"`);
      continue;
    }
    const parsedMappings = parseMappingBlocks(content, filePath);
    errors.push(...parsedMappings.errors);
    mappings.push(...parsedMappings.mappings);
  }

  const contractFiles = collectFiles('features', (filePath) => filePath.endsWith('.contract.acl'));
  for (const filePath of contractFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = validateACL(content, filePath);
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        errors.push(`${filePath}: ${err}`);
      }
      continue;
    }

    if (!result.requires || result.requires.length === 0) {
      continue;
    }

    const callsByAlias = parseCallOperations(content);

    for (const requirement of result.requires) {
      const candidates = mappings.filter(
        (mapping) =>
          mapping.capability.path === requirement.capability &&
          rangesCompatible(requirement.range, mapping.capability.range)
      );

      if (candidates.length === 0) {
        errors.push(
          `${filePath}: missing capability mapping for ${requirement.capability}@${requirement.range} AS ${requirement.alias}`
        );
        continue;
      }

      if (candidates.length > 1) {
        errors.push(
          `${filePath}: ambiguous capability mapping for ${requirement.capability}@${requirement.range} AS ${requirement.alias}`
        );
        continue;
      }

      const selected = candidates[0];
      const operations = callsByAlias.get(requirement.alias) || new Set();
      for (const operation of operations) {
        if (!selected.operations.has(operation)) {
          errors.push(
            `${filePath}: mapping "${selected.name}" does not define operation ${requirement.alias}.${operation}`
          );
        }
      }
    }
  }

  return errors;
}

async function validateRegistryFeatures() {
  const raw = fs.readFileSync('./registry.yaml', 'utf8');
  const registry = yaml.load(raw);
  const features = registry.features || [];

  console.log(`Validating ACL format for ${features.length} registry feature(s)...\n`);
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

      const result = validateACL(response.body, feature.url);
      const metadata = result.metadata || {};

      if (result.errors.length > 0) {
        console.log(`  FAIL [${feature.name}]`);
        result.errors.forEach((e) => console.log(`       - ${e}`));
        failed++;
      } else {
        console.log(
          `  OK   [${feature.name}] feature: ${metadata.DOMAIN} context: ${metadata.CONTEXT} (acl ${metadata.VERSION})`
        );
      }
    } catch (err) {
      console.log(`  FAIL [${feature.name}] ${err.message}`);
      failed++;
    }
  }

  return failed;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const localOnly = args.has('--local-only');
  let failed = 0;

  if (!localOnly) {
    failed += await validateRegistryFeatures();
    console.log('');
  } else {
    console.log('Skipping registry URL validation (--local-only).\n');
  }

  const localErrors = validateLocalMappingsAndContracts();
  console.log(`Validating local feature ACL and mapping glue...\n`);
  if (localErrors.length === 0) {
    console.log('  OK   local ACL files and mappings are valid');
  } else {
    console.log('  FAIL local ACL validation');
    localErrors.forEach((e) => console.log(`       - ${e}`));
    failed += localErrors.length;
  }

  console.log('');

  if (failed > 0) {
    console.log(`ACL validation failed: ${failed} issue(s) found`);
    process.exit(1);
  }

  console.log('All ACL checks passed');
}

main();
