#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const REPO_URL = 'https://github.com/nemicko/specdir';
const BRAND_ICON_DATA_URI = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect x=%224%22 y=%224%22 width=%2256%22 height=%2256%22 rx=%2216%22 fill=%22%230b1f2a%22/%3E%3Cpath d=%22M24 18L12 32L24 46%22 stroke=%22%2367e8f9%22 stroke-width=%224.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 fill=%22none%22/%3E%3Cpath d=%22M40 18L52 32L40 46%22 stroke=%22%235eead4%22 stroke-width=%224.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 fill=%22none%22/%3E%3Ccircle cx=%2232%22 cy=%2225%22 r=%222.5%22 fill=%22%23ffffff%22/%3E%3Ccircle cx=%2232%22 cy=%2232%22 r=%222.5%22 fill=%22%23ffffff%22/%3E%3Ccircle cx=%2232%22 cy=%2239%22 r=%222.5%22 fill=%22%23ffffff%22/%3E%3C/svg%3E';

const raw = fs.readFileSync('./registry.yaml', 'utf8');
const registry = yaml.load(raw);
const features = registry.features || [];
const promptTemplate = fs.existsSync('./prompts/implement.md')
  ? fs.readFileSync('./prompts/implement.md', 'utf8')
  : '';

const maturityStyle = {
  draft: 'background:#6b7280;color:#fff',
  beta: 'background:#d97706;color:#fff',
  stable: 'background:#16a34a;color:#fff',
  deprecated: 'background:#dc2626;color:#fff',
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contextFilesForFeature(featureName) {
  const subsystem = featureName.split('.').pop();
  return [
    `${subsystem}.schema.acl`,
    `${subsystem}.flow.acl`,
    `${subsystem}.contract.acl`,
    `${subsystem}.persona.acl`,
  ];
}

function sourceDirForFeature(featureName) {
  const featureDir = path.join('.', 'features', featureName);
  if (fs.existsSync(featureDir)) return featureDir;
  return null;
}

function copyLocalFeatureFiles(featureName, targetDir) {
  const sourceDir = sourceDirForFeature(featureName);
  if (!sourceDir) return;
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: linear-gradient(160deg, #ecfeff, #f0f9ff); }
  header { background: #0b1f2a; color: #f8fafc; padding: 2rem; }
  header p { margin-top: 0.5rem; color: #67e8f9; font-size: 0.95rem; }
  .brand { display: inline-flex; align-items: center; gap: 0.8rem; color: inherit; text-decoration: none; }
  .brand-mark { width: 36px; height: 36px; border-radius: 10px; box-shadow: 0 8px 18px rgba(20,184,166,0.35); }
  .brand-title { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.3px; line-height: 1.1; }
  nav { display: flex; gap: 1.25rem; margin-top: 1rem; flex-wrap: wrap; }
  nav a { color: #67e8f9; text-decoration: none; font-size: 0.9rem; }
  nav a:hover { text-decoration: underline; }
  nav a.active { color: #fff; font-weight: 600; }
  main { max-width: 1000px; margin: 2rem auto; padding: 0 1.5rem; }
  h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; color: #111827; }
  h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #111827; }
  p { color: #374151; line-height: 1.7; margin-bottom: 1rem; }
  a { color: #0f766e; }
  pre { background: #1f2937; color: #f9fafb; padding: 1rem 1.25rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; margin-bottom: 1rem; }
  code { font-family: 'Fira Code', monospace; }
  .search { margin-bottom: 1.5rem; }
  .search input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #a5f3fc; border-radius: 8px; font-size: 1rem; outline: none; }
  .search input:focus { border-color: #22d3ee; box-shadow: 0 0 0 3px rgba(34,211,238,0.18); }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 1.5rem; }
  th { background: #ccfbf1; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #0f766e; }
  td { padding: 0.85rem 1rem; border-top: 1px solid #ccfbf1; font-size: 0.92rem; vertical-align: top; }
  td a { color: #0f766e; text-decoration: none; font-weight: 500; }
  td a:hover { text-decoration: underline; }
  tr:hover td { background: #f0fdfa; }
  .tag { background: #ccfbf1; color: #0f766e; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; margin-right: 4px; display: inline-block; }
  .badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
  .meta { margin-top: 2rem; color: #6b7280; font-size: 0.82rem; text-align: center; padding-bottom: 3rem; }
  .hero { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 2rem; }
  .hero h2 { margin-bottom: 0.75rem; }
  .hero-lead { font-size: 1.06rem; color: #1f2937; margin-bottom: 1.1rem; }
  .hero-list { margin: 0.6rem 0 0.2rem 1.1rem; color: #1f2937; line-height: 1.6; }
  .hero-list li { margin-bottom: 0.45rem; }
  .nodes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
  .node { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 1rem; }
  .node strong { display: block; color: #111827; margin-bottom: 0.25rem; font-size: 0.9rem; }
  .node span { color: #4b5563; font-size: 0.82rem; }
  .actions { display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; }
  .btn { padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
  .btn-primary { background: #0f766e; color: #fff; }
  .btn-secondary { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
  .prompt-wrap { position: relative; }
  .prompt-wrap pre { max-height: 400px; overflow-y: auto; }
  .copy-btn { position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.35rem 0.75rem; border: 1px solid #6b7280; border-radius: 6px; background: #374151; color: #f9fafb; font-size: 0.78rem; cursor: pointer; }
  .copy-btn:hover { background: #4b5563; }
  .feature-header { margin-bottom: 2rem; }
  .feature-header h2 { margin-bottom: 0.25rem; }
  .feature-meta { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-top: 0.5rem; }
`;

function rootPath(depth) {
  if (depth <= 0) return '.';
  return Array.from({ length: depth }, () => '..').join('/');
}

function layout(title, activePage, content, depth = 0) {
  const root = rootPath(depth);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — specdir.com</title>
  <link rel="icon" type="image/svg+xml" href="${BRAND_ICON_DATA_URI}">
  <style>${css}</style>
</head>
<body>
  <header>
    <a href="${root}/index.html" class="brand">
      <img class="brand-mark" src="${BRAND_ICON_DATA_URI}" alt="ACL">
      <span>
        <span class="brand-title">Application Context Language</span>
      </span>
    </a>
    <p>Define intent. AI builds the stack.</p>
    <nav>
      <a href="${root}/index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
      <a href="${root}/directory/index.html" class="${activePage === 'directory' ? 'active' : ''}">Directory</a>
      <a href="${root}/spec/index.html" class="${activePage === 'spec' ? 'active' : ''}">ACL Spec</a>
      <a href="${REPO_URL}">GitHub</a>
      <a href="${root}/registry.json">registry.json</a>
    </nav>
  </header>
  <main>
    ${content}
  </main>
</body>
</html>`;
}

const homePage = layout(
  'Home',
  'home',
  `
  <div class="hero">
    <h2>The Language for AI-Built Software</h2>
    <p class="hero-lead"><strong>ACL is source code for product intent. AI is the compiler.</strong></p>
    <p class="hero-lead">Define what your product does — the data, the logic, the experience — in a structured, language-agnostic protocol. Hand it to any AI agent, and it generates the implementation in whatever stack you need.</p>
    <p class="hero-lead"><strong>Write features once. AI builds them anywhere.</strong></p>
    <p>Each ACL Feature is a complete, parseable definition of one product slice — designed for AI to read, reason about, and synthesize into working code.</p>
    <div class="nodes">
      <div class="node"><strong>Schema</strong><span>Data truth — entities, fields, constraints, relationships</span></div>
      <div class="node"><strong>Flow</strong><span>Internal mechanics — triggers, jobs, state transitions</span></div>
      <div class="node"><strong>Contract</strong><span>External exchange — business rules, APIs, interfaces</span></div>
      <div class="node"><strong>Persona</strong><span>User experience — views, actions, interaction logic</span></div>
    </div>
    <div class="actions">
      <a href="./spec/index.html" class="btn btn-primary">Read ACL Spec</a>
      <a href="./features/juice.users/index.html" class="btn btn-secondary">See <code>juice.users</code></a>
      <a href="./directory/index.html" class="btn btn-secondary">Browse Directory</a>
      <a href="${REPO_URL}/blob/main/CONTRIBUTING.md" class="btn btn-secondary">Publish a Feature</a>
    </div>
  </div>

  <h2>Why ACL Exists</h2>
  <p>AI can build software — but only as well as you describe it. Today, product intent lives scattered across tickets, docs, Slack threads, and developer memory. Every time you switch stacks or start fresh, you re-explain the same thing.</p>
  <p>ACL replaces that cycle. You define each feature once — what the data looks like, how the system behaves, what gets exposed, and what the user experiences — in four structured context files. AI reads them and generates the implementation: models, APIs, UI, and wiring. In any language, any framework.</p>

  <h2>How It Works With AI</h2>
  <p>An AI agent consuming ACL files follows a defined handshake:</p>
  <ul class="hero-list">
    <li><strong>Parse</strong> all <code>.acl</code> files and build the dependency graph.</li>
    <li><strong>Detect</strong> the target environment — language, framework, database.</li>
    <li><strong>Synthesize</strong> the implementation — from scratch, or as adapter layers over existing code.</li>
    <li><strong>Verify</strong> consistency — every user action maps to a Contract, every Contract is backed by a Flow or Schema.</li>
  </ul>

  <h2>Open Feature Directory</h2>
  <p>This is an open registry of ACL Features anyone can read, import, and implement. AI agents can fetch the full registry programmatically:</p>
  <pre><code>GET https://specdir.com/registry.yaml
GET https://specdir.com/registry.json</code></pre>
`,
  0
);

const rows = features
  .map(
    (feature) => `
  <tr>
    <td><a href="../features/${feature.name}/index.html">${feature.name}</a></td>
    <td>${feature.description}</td>
    <td>${feature.author}</td>
    <td>${(feature.tags || []).map((t) => `<span class="tag">${t}</span>`).join(' ')}</td>
    <td><span class="badge" style="${maturityStyle[feature.maturity] || ''}">${feature.maturity}</span></td>
  </tr>`
  )
  .join('');

const directoryPage = layout(
  'Directory',
  'directory',
  `
  <h2>Feature Directory</h2>
  <p style="margin-bottom:1.5rem">
    ${features.length} feature(s) listed. Features are hosted by their authors.
    <a href="${REPO_URL}/blob/main/CONTRIBUTING.md">Submit a feature -></a>
  </p>
  <div class="search">
    <input type="text" id="search" placeholder="Search features by name, tag, or description..." oninput="filterTable()">
  </div>
  <table id="registry">
    <thead>
      <tr>
        <th>Feature</th>
        <th>Description</th>
        <th>Author</th>
        <th>Tags</th>
        <th>Maturity</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="meta">Updated ${new Date().toISOString().split('T')[0]} &middot;
    <a href="${REPO_URL}">Contribute on GitHub</a>
  </p>
  <script>
    function filterTable() {
      const q = document.getElementById('search').value.toLowerCase();
      document.querySelectorAll('#registry tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
  </script>
`,
  1
);

const specContent = fs.existsSync('./spec/README.md')
  ? fs.readFileSync('./spec/README.md', 'utf8')
  : '';

function renderSpec(md) {
  return md
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #99f6e4;margin:2rem 0">')
    .replace(/```(\w*)\n([\s\S]*?)```/gm, (_, _lang, code) => '<pre><code>' + code.replace(/\n/g, '&#10;') + '</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:#ccfbf1;padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line.split('|').filter((c) => c.trim() && !c.match(/^[-\s]+$/));
      if (!cells.length) return '';
      return '<tr>' + cells.map((c) => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (m) => `<table>${m}</table>`)
    .replace(/\[(.+)\]\((.+)\)/g, '<a href="$2">$1</a>')
    .replace(/^(?!<[h|p|t|u|o|l|d|b|i|c|h|p|s|r]).+/gm, (line) =>
      line.trim() ? `<p>${line}</p>` : ''
    )
    .replace(/<p><\/p>/g, '');
}

const specPage = layout(
  'Protocol Spec',
  'spec',
  `
  <div style="background:#fff;border-radius:12px;padding:2rem;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
    ${renderSpec(specContent)}
  </div>
`,
  1
);

function generateFeaturePage(feature) {
  const fileNames = contextFilesForFeature(feature.name);
  const rowsHtml = fileNames
    .map((f) => `<tr><td><a href="./${f}" target="_blank">${f}</a></td></tr>`)
    .join('');

  const alias = feature.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '');
  const usageSample = `:::ACL_METADATA\nDOMAIN: acme.billing\nCONTEXT: Contract\nVERSION: 1.2.0\nIMPORT:\n  - ${feature.name}.Contract AS ${alias.charAt(0).toUpperCase() + alias.slice(1)}\n:::`;

  const prompt = promptTemplate
    ? escapeHtml(promptTemplate.replace(/\{\{FEATURE_URL\}\}/g, feature.url))
    : '';

  const promptSection = prompt
    ? `
    <h2>Implement with AI</h2>
    <p>Copy this prompt into your AI coding tool to implement this Feature.</p>
    <div class="prompt-wrap">
      <button class="copy-btn" onclick="copyPrompt()">Copy</button>
      <pre id="prompt-text"><code>${prompt}</code></pre>
    </div>
    <script>
      function copyPrompt() {
        const text = document.getElementById('prompt-text').textContent;
        navigator.clipboard.writeText(text).then(() => {
          const btn = document.querySelector('.copy-btn');
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 2000);
        });
      }
    </script>
  `
    : '';

  return layout(
    feature.name,
    'directory',
    `
    <div class="feature-header">
      <h2>${escapeHtml(feature.name)}</h2>
      <p>${escapeHtml(feature.description)}</p>
      <div class="feature-meta">
        <span>by <strong>${escapeHtml(feature.author)}</strong></span>
        <span class="badge" style="${maturityStyle[feature.maturity] || ''}">${feature.maturity}</span>
        ${(feature.tags || []).map((t) => `<span class="tag">${t}</span>`).join(' ')}
      </div>
    </div>

    <h2>Context Files</h2>
    <table>
      <thead><tr><th>File</th></tr></thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <h2>Usage</h2>
    <p>Import this Feature Contract from another <code>.acl</code> Contract file:</p>
    <pre><code>${usageSample}</code></pre>

    ${promptSection}
  `,
    2
  );
}

fs.mkdirSync('./dist', { recursive: true });
fs.rmSync('./dist/index.html', { force: true });
fs.rmSync('./dist/directory', { recursive: true, force: true });
fs.rmSync('./dist/spec', { recursive: true, force: true });
fs.rmSync('./dist/features', { recursive: true, force: true });
fs.mkdirSync('./dist/directory', { recursive: true });
fs.mkdirSync('./dist/spec', { recursive: true });
fs.mkdirSync('./dist/features', { recursive: true });

fs.writeFileSync('./dist/index.html', homePage);
fs.writeFileSync('./dist/directory/index.html', directoryPage);
fs.writeFileSync('./dist/spec/index.html', specPage);

for (const feature of features) {
  const featureDir = `./dist/features/${feature.name}`;
  fs.rmSync(featureDir, { recursive: true, force: true });
  fs.mkdirSync(featureDir, { recursive: true });
  copyLocalFeatureFiles(feature.name, featureDir);
  fs.writeFileSync(`${featureDir}/index.html`, generateFeaturePage(feature));
}

if (fs.existsSync('./CNAME')) {
  fs.copyFileSync('./CNAME', './dist/CNAME');
}

console.log(`Generated site: home + directory (${features.length} feature(s)) + spec + ${features.length} feature page(s)`);
