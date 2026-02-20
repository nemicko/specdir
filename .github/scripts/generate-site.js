#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const REPO_URL = 'https://github.com/nemicko/specdir';

const raw = fs.readFileSync('./registry.yaml', 'utf8');
const registry = yaml.load(raw);
const packages = registry.packages || [];
const promptTemplate = fs.existsSync('./prompts/implement.md')
  ? fs.readFileSync('./prompts/implement.md', 'utf8')
  : '';

const maturityStyle = {
  draft:      'background:#6b7280;color:#fff',
  beta:       'background:#d97706;color:#fff',
  stable:     'background:#16a34a;color:#fff',
  deprecated: 'background:#dc2626;color:#fff',
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function copyLocalPackageFiles(pkgName, targetDir) {
  const sourceDir = path.join('.', 'packages', pkgName);
  if (!fs.existsSync(sourceDir)) return;
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fafafa; }
  header { background: #0f172a; color: #f8fafc; padding: 2rem; }
  header h1 { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }
  header h1 span { color: #38bdf8; }
  header p { margin-top: 0.5rem; color: #94a3b8; font-size: 0.95rem; }
  nav { display: flex; gap: 1.5rem; margin-top: 1rem; flex-wrap: wrap; }
  nav a { color: #38bdf8; text-decoration: none; font-size: 0.9rem; }
  nav a:hover { text-decoration: underline; }
  nav a.active { color: #fff; font-weight: 600; }
  main { max-width: 1000px; margin: 2rem auto; padding: 0 1.5rem; }
  h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; color: #0f172a; }
  h3 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #0f172a; }
  p { color: #475569; line-height: 1.7; margin-bottom: 1rem; }
  a { color: #0284c7; }
  pre { background: #1e293b; color: #e2e8f0; padding: 1rem 1.25rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; margin-bottom: 1rem; }
  code { font-family: 'Fira Code', monospace; }
  .search { margin-bottom: 1.5rem; }
  .search input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; outline: none; }
  .search input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.15); }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 1.5rem; }
  th { background: #f1f5f9; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  td { padding: 0.85rem 1rem; border-top: 1px solid #f1f5f9; font-size: 0.92rem; vertical-align: top; }
  td a { color: #0284c7; text-decoration: none; font-weight: 500; }
  td a:hover { text-decoration: underline; }
  tr:hover td { background: #f8fafc; }
  .tag { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; margin-right: 4px; display: inline-block; }
  .badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
  .meta { margin-top: 2rem; color: #94a3b8; font-size: 0.82rem; text-align: center; padding-bottom: 3rem; }
  .hero { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); margin-bottom: 2rem; }
  .hero h2 { margin-bottom: 0.75rem; }
  .nodes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
  .node { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
  .node strong { display: block; color: #0f172a; margin-bottom: 0.25rem; font-size: 0.9rem; }
  .node span { color: #64748b; font-size: 0.82rem; }
  .actions { display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; }
  .btn { padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
  .btn-primary { background: #0284c7; color: #fff; }
  .btn-secondary { background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; }
  .prompt-wrap { position: relative; }
  .prompt-wrap pre { max-height: 400px; overflow-y: auto; }
  .copy-btn { position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.35rem 0.75rem; border: 1px solid #475569; border-radius: 6px; background: #334155; color: #e2e8f0; font-size: 0.78rem; cursor: pointer; }
  .copy-btn:hover { background: #475569; }
  .pkg-header { margin-bottom: 2rem; }
  .pkg-header h2 { margin-bottom: 0.25rem; }
  .pkg-meta { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-top: 0.5rem; }
`;

function layout(title, activePage, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — specdir.com</title>
  <style>${css}</style>
</head>
<body>
  <header>
    <h1><a href="/" style="color:inherit;text-decoration:none">spec<span>dir</span>.com</a></h1>
    <p>The home of the Spectral Protocol and open directory of domain specifications.</p>
    <nav>
      <a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a>
      <a href="/directory" class="${activePage === 'directory' ? 'active' : ''}">Directory</a>
      <a href="/spec" class="${activePage === 'spec' ? 'active' : ''}">Protocol Spec</a>
      <a href="${REPO_URL}">GitHub</a>
      <a href="/registry.json">registry.json</a>
    </nav>
  </header>
  <main>
    ${content}
  </main>
</body>
</html>`;
}

// HOME PAGE
const homePage = layout('Home', 'home', `
  <div class="hero">
    <h2>What is Spectral?</h2>
    <p>Spectral is an open protocol for describing application domains in a format that is both human-readable and AI-consumable. One spec. Any stack. Any AI agent.</p>
    <div class="nodes">
      <div class="node"><strong>domain.model</strong><span>Fields, types, constraints, relations</span></div>
      <div class="node"><strong>domain.views</strong><span>Presentation intent for any renderer</span></div>
      <div class="node"><strong>domain.interactions</strong><span>Actions, permissions, events</span></div>
      <div class="node"><strong>domain.interfaces</strong><span>REST and MCP exposure contracts</span></div>
    </div>
    <div class="actions">
      <a href="/spec" class="btn btn-primary">Read the Protocol Spec</a>
      <a href="/directory" class="btn btn-secondary">Browse Packages</a>
      <a href="${REPO_URL}/blob/main/CONTRIBUTING.md" class="btn btn-secondary">Publish a Package</a>
    </div>
  </div>

  <h2>Using a Package</h2>
  <p>Reference any Spectral package by URL in your <code>.spectral</code> file:</p>
  <pre><code>dependencies:
  - https://specdir.com/packages/juice.users/index.spectral</code></pre>
  <p>Then tell your AI agent: <em>"Integrate the juice.users package from the dependency URL into this application."</em> The agent fetches the spec, reads the nodes, and implements it against your stack.</p>

  <h2>Implementing with AI</h2>
  <p>Every package page includes a ready-to-use prompt. Copy it into any AI coding tool to generate a full-stack implementation from the spec.</p>
  <p><a href="/packages/juice.users/">Try it with juice.users &rarr;</a></p>

  <h2>For AI Agents</h2>
  <p>Fetch the full registry programmatically:</p>
  <pre><code>GET https://specdir.com/registry.yaml
GET https://specdir.com/registry.json</code></pre>
`);

// DIRECTORY PAGE
const rows = packages.map(pkg => `
  <tr>
    <td><a href="/packages/${pkg.name}/">${pkg.name}</a></td>
    <td>${pkg.description}</td>
    <td>${pkg.author}</td>
    <td>${(pkg.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ')}</td>
    <td><span class="badge" style="${maturityStyle[pkg.maturity] || ''}">${pkg.maturity}</span></td>
  </tr>`).join('');

const directoryPage = layout('Directory', 'directory', `
  <h2>Package Directory</h2>
  <p style="margin-bottom:1.5rem">
    ${packages.length} package(s) listed. Packages are hosted by their authors on their own domains.
    Trust comes from the provider's domain — not from us.
    <a href="${REPO_URL}/blob/main/CONTRIBUTING.md">Submit a package →</a>
  </p>
  <div class="search">
    <input type="text" id="search" placeholder="Search packages by name, tag, or description..." oninput="filterTable()">
  </div>
  <table id="registry">
    <thead>
      <tr>
        <th>Package</th>
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
`);

// SPEC PAGE
const specContent = fs.existsSync('./spec/README.md')
  ? fs.readFileSync('./spec/README.md', 'utf8')
  : '';

// Simple markdown-ish rendering for the spec page
function renderSpec(md) {
  return md
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:2rem 0">')
    .replace(/```(\w*)\n([\s\S]*?)```/gm, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line.split('|').filter(c => c.trim() && !c.match(/^[-\s]+$/));
      if (!cells.length) return '';
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, m => `<table>${m}</table>`)
    .replace(/^\→ \[(.+)\]\((.+)\)$/gm, '<p><a href="$2">→ $1</a></p>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^(?!<[h|p|t|u|o|l|d|b|i|c|h|p|s]).+/gm, line => line.trim() ? `<p>${line}</p>` : '')
    .replace(/<p><\/p>/g, '');
}

const specPage = layout('Protocol Spec', 'spec', `
  <div style="background:#fff;border-radius:12px;padding:2rem;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
    ${renderSpec(specContent)}
  </div>
`);

// PACKAGE PAGES
function generatePackagePage(pkg) {
  const baseUrl = pkg.url.replace(/\/[^/]+$/, '');
  const nodeFiles = ['model.spectral', 'views.spectral', 'interactions.spectral', 'interfaces.spectral'];
  const nodesRows = nodeFiles.map(f =>
    `<tr><td><a href="${baseUrl}/${f}" target="_blank">${f}</a></td></tr>`
  ).join('');

  const prompt = promptTemplate
    ? escapeHtml(promptTemplate.replace(/\{\{PACKAGE_URL\}\}/g, pkg.url))
    : '';

  const promptSection = prompt ? `
    <h2>Implement with AI</h2>
    <p>Copy this prompt into any AI coding tool (Claude Code, Codex, Cursor) to generate a full-stack implementation from this spec.</p>
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
  ` : '';

  return layout(pkg.name, 'directory', `
    <div class="pkg-header">
      <h2>${escapeHtml(pkg.name)}</h2>
      <p>${escapeHtml(pkg.description)}</p>
      <div class="pkg-meta">
        <span>by <strong>${escapeHtml(pkg.author)}</strong></span>
        <span class="badge" style="${maturityStyle[pkg.maturity] || ''}">${pkg.maturity}</span>
        ${(pkg.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ')}
      </div>
    </div>

    <h2>Nodes</h2>
    <table>
      <thead><tr><th>File</th></tr></thead>
      <tbody>
        <tr><td><a href="${pkg.url}" target="_blank">index.spectral</a></td></tr>
        ${nodesRows}
      </tbody>
    </table>

    <h2>Usage</h2>
    <p>Add to your <code>.spectral</code> file dependencies:</p>
    <pre><code>dependencies:
  - ${pkg.url}</code></pre>

    ${promptSection}
  `);
}

// Write files
fs.mkdirSync('./dist', { recursive: true });
fs.mkdirSync('./dist/directory', { recursive: true });
fs.mkdirSync('./dist/spec', { recursive: true });

fs.writeFileSync('./dist/index.html', homePage);
fs.writeFileSync('./dist/directory/index.html', directoryPage);
fs.writeFileSync('./dist/spec/index.html', specPage);

for (const pkg of packages) {
  const pkgDir = `./dist/packages/${pkg.name}`;
  fs.mkdirSync(pkgDir, { recursive: true });
  copyLocalPackageFiles(pkg.name, pkgDir);
  fs.writeFileSync(`${pkgDir}/index.html`, generatePackagePage(pkg));
}

if (fs.existsSync('./CNAME')) {
  fs.copyFileSync('./CNAME', './dist/CNAME');
}

console.log(`Generated site: home + directory (${packages.length} packages) + spec + ${packages.length} package page(s)`);
