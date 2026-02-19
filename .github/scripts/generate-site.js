#!/usr/bin/env node

// Generates the static HTML site from registry.yaml for GitHub Pages

const fs = require('fs');
const yaml = require('js-yaml');

const raw = fs.readFileSync('./registry.yaml', 'utf8');
const registry = yaml.load(raw);
const packages = registry.packages || [];

const maturityBadge = {
  draft:      'background:#6b7280;color:#fff',
  beta:       'background:#d97706;color:#fff',
  stable:     'background:#16a34a;color:#fff',
  deprecated: 'background:#dc2626;color:#fff',
};

const rows = packages.map(pkg => `
  <tr>
    <td><a href="${pkg.url}" target="_blank">${pkg.name}</a></td>
    <td>${pkg.description}</td>
    <td>${pkg.author}</td>
    <td>${pkg.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</td>
    <td><span class="badge" style="${maturityBadge[pkg.maturity] || ''}">${pkg.maturity}</span></td>
  </tr>`).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>specdir — The Spectral Package Directory</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fafafa; }
    header { background: #0f172a; color: #f8fafc; padding: 2rem; }
    header h1 { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }
    header h1 span { color: #38bdf8; }
    header p { margin-top: 0.5rem; color: #94a3b8; font-size: 0.95rem; }
    nav { display: flex; gap: 1.5rem; margin-top: 1rem; }
    nav a { color: #38bdf8; text-decoration: none; font-size: 0.9rem; }
    nav a:hover { text-decoration: underline; }
    main { max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem; }
    .search { margin-bottom: 1.5rem; }
    .search input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; outline: none; }
    .search input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.15); }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    th { background: #f1f5f9; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    td { padding: 0.85rem 1rem; border-top: 1px solid #f1f5f9; font-size: 0.92rem; vertical-align: top; }
    td a { color: #0284c7; text-decoration: none; font-weight: 500; }
    td a:hover { text-decoration: underline; }
    .tag { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; margin-right: 4px; display: inline-block; }
    .badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
    .meta { margin-top: 2rem; color: #94a3b8; font-size: 0.82rem; text-align: center; }
    .meta a { color: #38bdf8; }
    tr:hover td { background: #f8fafc; }
  </style>
</head>
<body>
  <header>
    <h1>spec<span>dir</span></h1>
    <p>The open directory of <a href="https://spectral-protocol.dev" style="color:#38bdf8">Spectral</a> domain specifications.</p>
    <p style="margin-top:0.3rem;font-size:0.82rem;color:#64748b">Trust comes from the provider's domain — not from us.</p>
    <nav>
      <a href="https://github.com/spectral-protocol/specdir">GitHub</a>
      <a href="https://github.com/spectral-protocol/specdir/blob/main/CONTRIBUTING.md">Submit a Package</a>
      <a href="/registry.json">registry.json</a>
      <a href="/registry.yaml">registry.yaml</a>
      <a href="https://spectral-protocol.dev">Spectral Protocol</a>
    </nav>
  </header>

  <main>
    <div class="search">
      <input type="text" id="search" placeholder="Search packages..." oninput="filterTable()">
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
      <tbody>
        ${rows}
      </tbody>
    </table>

    <p class="meta">
      ${packages.length} package(s) listed &middot;
      Updated ${new Date().toISOString().split('T')[0]} &middot;
      <a href="https://github.com/spectral-protocol/specdir">Contribute on GitHub</a>
    </p>
  </main>

  <script>
    function filterTable() {
      const q = document.getElementById('search').value.toLowerCase();
      const rows = document.querySelectorAll('#registry tbody tr');
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/index.html', html);

console.log(`Generated site with ${packages.length} package(s)`);
