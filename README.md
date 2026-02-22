# specdir.com

> The home of the Application Context Script (ACS) — and the open directory of ACS Features.

---

The way we build software has always evolved through abstraction leaps. Assembly to code. Code to frameworks. Frameworks to AI.

But AI needs something frameworks never had — a clear definition of what a product actually is.

ACS is that definition layer. Above code. Above frameworks. Above stack choices.

Define what your product is. Let AI handle how it's built.

---

## What is ACS?

ACS is an open standard for defining complete product features in a format both humans and AI can execute.

An ACS Feature defines a complete slice of your product — what it is, how it behaves, and how it's experienced.
Write it once. Build it anywhere.

An ACS Feature describes that slice in four files:

- **Schema** — entities, attributes, types, and relationships
- **Flow** — internal mechanisms, triggers, background tasks, and private state changes
- **Contract** — public business rules and machine interfaces (REST, GraphQL, gRPC, MCP bridge)
- **Persona** — user-facing views, intent, and UI actions mapped to contracts

-> [Read the full ACS specification](./spec/README.md)

---

## Feature Directory

| Feature | Description | Author | Maturity |
|---|---|---|---|
| [juice.users](./features/juice.users) | User identity, authentication, roles and lifecycle management. | juice | draft |

-> [Browse all features](https://specdir.com/directory)

---

## Using a Feature

In any `.acs` file, import a Feature Contract:

```acs
:::ACS_METADATA
FEATURE: acme.billing
CONTEXT: Contract
VERSION: 1.2.0
IMPORT:
  - juice.users.Contract AS Users
:::
```

Tell your AI agent to integrate it:

> "Integrate the `juice.users` ACS Feature into this application and preserve ACS boundaries."

The agent parses the feature graph and generates or adapts implementation against your stack.

---

## Implementing with AI

Every feature page on specdir.com includes a ready-to-use AI prompt.
Copy it into any AI coding tool (Claude Code, Codex, Cursor) to generate a full implementation:

> [Implement juice.users](https://specdir.com/features/juice.users/)

Or use the universal template from [prompts/implement.md](./prompts/implement.md).

---

## Publishing a Feature

Anyone can list an ACS Feature in this directory.

**Requirements:**
1. Your feature files must live at stable public URLs on your own domain
2. Files must include valid ACS metadata headers
3. The `feature` field in the registry must match your URL hostname

-> [Read the contribution guide](./CONTRIBUTING.md)
-> [Submit via Pull Request](https://github.com/nemicko/specdir/pulls)

---

## For AI Agents

Fetch the full registry programmatically:

```
GET https://specdir.com/registry.yaml
GET https://specdir.com/registry.json
```

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).