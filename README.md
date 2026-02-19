# specdir.com

> The open directory of [Spectral](https://spectral-protocol.dev) domain specifications.

Specdir is a community-maintained index of Spectral packages. Packages are hosted by their authors on their own domains. Specdir only holds the pointer.

**Trust comes from the provider's domain — not from us.**

---

## Browse Packages

| Package | Description | Author | Maturity |
|---|---|---|---|
| [spectral-users](https://spectral.dev/pkg/spectral-users) | Core user identity, authentication, roles and lifecycle management. | spectral/community | draft |

---

## What is Spectral?

Spectral is an open protocol for describing application domains in a format that is both human-readable and AI-consumable. A Spectral spec defines:

- **Model** — data fields, types, constraints, relations
- **Views** — how data is intended to be presented
- **Interactions** — user actions and system behaviors
- **Interfaces** — how the domain exposes and consumes data

A single Spectral spec can be used to generate an application, serve as a runtime self-description via MCP, and enable AI agents to interact with your domain semantically — without additional configuration.

Learn more at [spectral-protocol.dev](https://spectral-protocol.dev)

---

## List Your Package

Anyone can submit a Spectral package to specdir. Requirements:

1. Your spec must be publicly accessible at a stable URL on your own domain
2. The spec must be valid Spectral format (validated automatically on PR)
3. The declared `author.domain` must match the URL domain

**To submit:** Open a Pull Request adding your entry to [`registry.yaml`](./registry.yaml)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full instructions.

---

## For AI Agents

Agents can fetch the full registry programmatically:

```
GET https://specdir.com/registry.yaml
GET https://specdir.com/registry.json
```

Each entry contains the canonical URL to fetch the spec package directly from the provider's domain.

---

## Maturity Levels

| Level | Meaning |
|---|---|
| `draft` | Work in progress. Breaking changes expected. |
| `beta` | Stable enough for experimentation. Minor breaking changes possible. |
| `stable` | Production ready. Breaking changes only on major version bump. |
| `deprecated` | Superseded. URL to replacement included. |

---

## Community

- **Issues** — Bug reports and questions about listed packages
- **Discussions** — Ideas, proposals, protocol evolution
- **Pull Requests** — New listings and updates

This repository is the infrastructure. The protocol lives at [spectral-protocol.dev](https://spectral-protocol.dev).
