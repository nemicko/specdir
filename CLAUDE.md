# Spectral Protocol — Project Context for Claude Code

This file contains the full context of the Spectral Protocol project, designed to bring
any AI agent up to speed instantly on what this is, why it exists, and where it is going.

---

## Origin — The Problem We Are Solving

AI coding tools have a fundamental flaw: they generate coherent code locally but are globally
unaware. Every modification is a patch without full system understanding. Over iterations,
codebases accumulate contradictions — naming inconsistencies, duplicate logic, broken relations.
Better prompting doesn't fix this. It's a context and coherence problem.

The solution is not better prompts. It is a specification layer that sits between human intent
and generated code — deterministic enough that any capable model produces a structurally
equivalent output, human-readable enough that a software architect can write and review it
without tooling.

---

## What Spectral Is

Spectral is an open protocol for describing application domains in a format that is both
human-readable and AI-consumable.

A Spectral spec describes WHAT a domain is — not HOW it is implemented. The same spec can
generate an Angular frontend, a Node.js backend, a REST API, or a GraphQL schema. It can also
travel with data at runtime via MCP, telling consuming AI agents how to present and interact
with that data without additional configuration.

**Code is generated output. The spec is the truth.**

This is different from everything else in the Spec-Driven Development (SDD) space:
- GitHub Spec Kit — markdown files, no protocol, no addressing system
- AWS Kiro — user stories fed to AI, structured prompting with extra steps
- Tessl — spec registry exists but contains library usage docs, not domain modules
- OpenSpec — lightweight workflow tool, not a protocol

None of them have namespaced domain addressing. None have runtime MCP duality.
None have a composable domain registry with trust anchored to provider domains.

---

## The Four Node Types

Every Spectral domain is described across four node types, each a separate .spectral file:

**domain.model**
The data definition. Fields, types, constraints, immutability rules, relations to other nodes.
This is the ground truth of what data exists and what rules govern it.

**domain.views**
Presentation intent. Table columns, detail layouts, form variants, card definitions.
Describes HOW data should be presented — not in which framework. A renderer (Angular, React,
a native app, an AI agent) reads the views spec and knows what to show and how.

**domain.interactions**
Behavior. User-triggered and system-triggered actions, their preconditions, permission
requirements, outcomes, emitted events. Every action declares what it emits — enabling
other domains to subscribe declaratively.

**domain.interfaces**
Boundaries. How the domain exposes data (REST endpoints, MCP) and what it consumes from
other domains. The MCP block is the most novel part — it explicitly declares that a consuming
AI agent receives both data AND spec nodes simultaneously.

---

## The Addressing System — The Core Invention

Spectral uses dot-notation namespacing to address every node and field uniquely:

spectral.users.model          → the users model node
spectral.users.views.table    → the table view within users views
spectral.users.model.email    → a specific field

Reference syntax uses @ prefix:

@users.model.id               → reference to a specific field
@users.model                  → reference to an entire node
@users.views.form.create      → reference to a nested variant
https://domain.com/spectral/  → reference to a registry package (external)

This is what makes Spectral a PROTOCOL rather than a convention. Every node is independently
addressable, versionable, resolvable, and composable. No existing SDD tool has this.

---

## The Registry — specdir.com

specdir.com is the open directory of Spectral packages. It is NOT a package host.
It is a directory — a searchable index of URLs. Packages live on provider domains.

Key insight: TRUST COMES FROM THE PROVIDER'S DOMAIN, NOT FROM US.

When an AI agent pulls https://mcp.stripe.com/spectral/charges@2.0.0 it knows
cryptographically who published that spec. No one can publish a malicious spectral-stripe
because the real one lives at stripe.com and dependency URLs point there directly.

This eliminates the supply chain attack problem that plagues npm and PyPI.

The directory entry format (registry.yaml):

- name: juice.users
  description: "User identity, authentication, roles and lifecycle management."
  author: juice
  domain: specdir.com
  url: https://raw.githubusercontent.com/spectral-protocol/specdir/main/packages/juice.users/index.spectral
  tags: [identity, auth, core]
  maturity: draft
  submitted: "2026-02-20"

Providers submit a PR adding their entry. GitHub Actions validates automatically on every PR:
1. validate-registry.js — field rules, naming, domain/URL matching, uniqueness
2. check-urls.js — confirms all URLs are reachable
3. validate-spectral.js — confirms the URL returns valid Spectral format

On merge to main, generate-site.js builds three pages and deploys to GitHub Pages:
- specdir.com/           → home, what is Spectral, quick start
- specdir.com/directory  → searchable package browser
- specdir.com/spec       → formal protocol documentation

---

## The MCP Runtime Dimension

This is where Spectral goes beyond any existing SDD tool.

A domain that declares an interfaces.mcp block exposes its Spectral spec nodes alongside
its data at runtime. A consuming AI agent receives:

1. The data
2. @domain.model — field semantics and types
3. @domain.views — intended presentation contract
4. @domain.interactions — available actions and permissions

The agent can render and interact with the domain correctly without additional configuration.
The spec IS the integration contract — not just at build time, but at runtime.

This means:
- A third-party AI assistant can query your app via MCP and render your data correctly
  because the presentation spec travels with the response
- A developer integrating your service doesn't read documentation — they declare a dependency
  URL and their AI agent reads the spec directly
- When Stripe publishes spectral-stripe, you don't integrate against their API —
  you compose stripe.* nodes into your domain graph

---

## The Metamorphosis Vision (Future)

Beyond static specs, Spectral enables runtime-adaptive applications:

A living spec that evolves as the application is used. User behavior becomes signal.
The spec node for a view adapts. Not the data — the intent layer adapts.

Or the user triggers a metamorphosis: "I want to see suppliers alongside orders."
The runtime spec negotiates a new composite view, generates it on demand, and that
becomes a persistent node in the spec graph. The app has genuinely evolved.

Node hierarchy for adaptive specs:
- Core nodes — immutable, architect-defined, the foundation
- Adaptive nodes — runtime-mutable within constraints set by core
- Ephemeral nodes — generated on demand, possibly not persisted

This is no longer a development tool. This is a new computing paradigm.
The application as a static artifact stops making sense. What exists instead is a domain,
described in Spectral, rendered on demand, evolving with use.

---

## Repo Structure

This is a monorepo. One repo, one domain, everything in one place.

specdir/
spec/                        ← formal protocol documentation
README.md                  ← type system, node anatomy, reference syntax, versioning
packages/                    ← community Spectral domain packages
juice.users/
README.md
index.spectral           ← package entry point and metadata
model.spectral           ← user fields, types, constraints, relations
views.spectral           ← table, detail, form, card definitions
interactions.spectral    ← create, invite, suspend, delete, edit, change_role
interfaces.spectral      ← REST endpoints and MCP exposure
registry.yaml                ← the directory of all listed packages
CONTRIBUTING.md              ← how to submit a package via PR
README.md                    ← repo homepage
CLAUDE.md                    ← this file
CNAME                        ← specdir.com
.gitignore
package.json
.github/
scripts/
validate-registry.js     ← enforces registry field rules
check-urls.js            ← confirms all listed URLs are reachable
validate-spectral.js     ← validates listed URLs return valid Spectral format
generate-json.js         ← converts registry.yaml to registry.json
generate-site.js         ← builds 3-page static site for GitHub Pages
workflows/
validate.yml             ← runs all validation on every PR to registry.yaml
deploy.yml               ← builds and deploys site on every merge to main
ISSUE_TEMPLATE/
submit-package.yml       ← structured form for package submissions

---

## Type System

### Primitive types
string, number, boolean, date, datetime

### Semantic types
email, uuid, url, currency, phone, locale, richtext, markdown

### Composite types
enum — requires a values list
array — requires an items type
object — requires a fields block

### Field modifiers
required, unique, immutable, generated, default, min, max, pattern

---

## Deployment

GitHub Pages serves specdir.com.
GitHub Actions handles everything automatically.

To deploy:
1. Push to main
2. Actions → General → Read and write permissions (enable once)
3. Actions → Build and Deploy Site → Run workflow (first time, creates gh-pages branch)
4. Settings → Pages → source: gh-pages branch
5. Settings → Pages → custom domain: specdir.com
6. DNS: CNAME specdir.com → spectral-protocol.github.io

---

## What Still Needs Building

### Immediate
- spectral.roles package (@roles.model referenced by juice.users)
- spectral.auth package (@auth.interfaces referenced by juice.users)
- spectral.profile package (@profile.model referenced by juice.users)

### Protocol
- Formal versioning specification
- Conflict resolution rules for cross-node references
- Validation rules for circular dependencies
- spec/types.md — full type system documentation
- spec/versioning.md — semver rules for Spectral packages

### Tooling
- CLI: spectral validate [file] — validate a local .spectral file
- CLI: spectral fetch [url] — fetch and display a remote package
- CLI: spectral init — scaffold a new package
- VS Code extension — .spectral syntax highlighting and node resolution
- AI agent prompt templates for consuming Spectral packages

### Registry
- GitHub Actions: auto-generate package detail pages at specdir.com/packages/[name]
- Search index for specdir.com/directory
- Badge system: maturity badges embeddable in package READMEs

### Vision
- MCP server for specdir itself — AI agents can query the directory via MCP
- Runtime adaptive spec layer — ephemeral and adaptive node types
- Spectral-native application renderer — UI generated entirely from spec at runtime

---

## Key Design Decisions Made

- Format: YAML (human readable, AI parseable, less noisy than JSON)
- Granularity: one file per node (independently versionable, registry-resolvable)
- References: @ prefix shorthand (visually distinct, readable, unambiguous)
- Types: primitive + semantic (carries intent, not just structure)
- Registry: directory of URLs, not a package host (trust from provider domain)
- Hosting: GitHub Pages + GitHub Actions (zero infrastructure cost)
- Governance: PR-based submissions, community merge rights, open source

---

## Commands

npm run validate          ← validate registry.yaml structure and rules
npm run check-urls        ← confirm all listed URLs are reachable
npm run validate-spectral ← validate listed URLs return valid Spectral format
npm run build             ← generate registry.json and static site
npm run validate:all      ← run all validation then build
