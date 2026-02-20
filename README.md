# specdir.com

> The home of the Spectral Protocol — and the open directory of Spectral context specifications.

---

## What is Spectral?

Spectral is an open protocol for writing down how one part of a product works, in a way both people and AI can use.

A Spectral Domain is a complete application context.

In Spectral, a **domain** means a bounded context of domain knowledge.
Think of it as one business area, like `users`, `billing`, or `orders`.

No-code builders made app creation easier for non-coders. Coders still need a better way to communicate concepts and context across teams, tools, and AI agents.
Spectral fills that gap.

A Spectral spec describes that context in four parts:

- **Model** — data fields, types, constraints, relations
- **Views** — how data is intended to be presented
- **Interactions** — user actions, permissions, events
- **Interfaces** — REST and MCP exposure contracts

Example: a `users` domain says what a user is, how user screens should look, what actions are allowed, and which API routes exist.

You define this once, then implement it in any stack.

That same domain can be served through MCP with visualization intent, so consumers know both:
- what data is coming
- how it should be presented and interacted with

→ [Read the full protocol documentation](./spec/README.md)

---

## Package Directory

| Package | Description | Author | Maturity |
|---|---|---|---|
| [juice.users](./packages/juice.users) | User identity, authentication, roles and lifecycle management. | juice | draft |

→ [Browse all packages](https://specdir.com/directory)

---

## Using a Package

In any `.spectral` file, reference a package by its URL:

```yaml
dependencies:
  - https://specdir.com/packages/juice.users/index.spectral
```

Tell your AI agent to integrate it:

> "Integrate the juice.users package from the dependency URL into this application."

The agent fetches the spec, reads the nodes, understands the domain, and implements it against your stack.

---

## Implementing with AI

Every package page on specdir.com includes a ready-to-use AI prompt.
Copy it into any AI coding tool (Claude Code, Codex, Cursor) to generate a full implementation:

> [Implement juice.users](https://specdir.com/packages/juice.users/)

Or use the universal template from [prompts/implement.md](./prompts/implement.md) — replace `{{PACKAGE_URL}}` with your package URL.

---

## Publishing a Package

Anyone can list a Spectral package in this directory.

**Requirements:**
1. Your spec must live at a stable public URL on your own domain
2. It must be valid Spectral format
3. The `domain` field must match the URL domain

→ [Read the contribution guide](./CONTRIBUTING.md)
→ [Submit via Pull Request](https://github.com/nemicko/specdir/pulls)

---

## For AI Agents

Fetch the full registry programmatically:

```
GET https://specdir.com/registry.yaml
GET https://specdir.com/registry.json
```

---

## Community

- **Issues** — bug reports and questions
- **Discussions** — protocol evolution and ideas
- **Pull Requests** — new packages and updates
