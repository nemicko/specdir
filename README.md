# specdir.com

> The home of the Spectral Protocol — and the open directory of Spectral domain specifications.

---

## What is Spectral?

Spectral is an open protocol for describing application domains in a format that is both human-readable and AI-consumable.

A Spectral spec defines a domain across four nodes:

- **Model** — data fields, types, constraints, relations
- **Views** — how data is intended to be presented
- **Interactions** — user actions, permissions, events
- **Interfaces** — REST and MCP exposure contracts

One spec. Any stack. Any AI agent.

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
  - https://raw.githubusercontent.com/spectral-protocol/specdir/main/packages/juice.users/index.spectral
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
→ [Submit via Pull Request](https://github.com/spectral-protocol/specdir/pulls)

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
