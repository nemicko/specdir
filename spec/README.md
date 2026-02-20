# The Spectral Protocol

Spectral is an open protocol for describing application domains in a format that is both human-readable and AI-consumable.

## Core Idea

A Spectral spec describes **what a domain is** — not how it is implemented. The same spec can generate an Angular frontend, a Node.js backend, a REST API, or a GraphQL schema. It can also travel with data at runtime via MCP, telling consuming AI agents how to present and interact with that data without additional configuration.

Code is generated output. The spec is the truth.

---

## Node Types

Every Spectral domain is described across four node types. Each node is a separate `.spectral` file.

### `domain.model`
The data definition. Fields, types, constraints, relations, immutability rules.

### `domain.views`
Presentation intent. Table columns, detail layouts, form variants, card definitions. Describes *how* data should be presented — not in which framework.

### `domain.interactions`
Behavior. User-triggered and system-triggered actions, their preconditions, permission requirements, outcomes, and emitted events.

### `domain.interfaces`
Boundaries. How the domain exposes data (REST, MCP) and what it consumes from other domains.

---

## File Structure

```
my-domain/
  index.spectral          ← package entry point and metadata
  model.spectral
  views.spectral
  interactions.spectral
  interfaces.spectral
```

---

## Node Anatomy

Every `.spectral` file shares the same mandatory header:

```yaml
spectral: "1.0"           # protocol version
node: users.model         # dot-notation address
description: "..."        # human readable, max 120 chars
author: your-name
dependencies:             # other nodes this file references
  - "@users.model"
  - https://specdir.com/packages/acme.billing/...
```

---

## Reference Syntax

References to other nodes use `@` prefix:

```yaml
# Reference a specific field
@users.model.id

# Reference an entire node
@users.model

# Reference a nested view variant
@users.views.form.create

# Reference a registry package (external)
https://specdir.com/packages/acme.billing/index.spectral
```

---

## Type System

### Primitive types
`string` `number` `boolean` `date` `datetime`

### Semantic types
`email` `uuid` `url` `currency` `phone` `locale` `richtext` `markdown`

### Composite types
`enum` — requires a `values` list
`array` — requires an `items` type
`object` — requires a `fields` block

---

## Field Modifiers

```yaml
required: true | false
unique: true | false
immutable: true | false
generated: true           # system-assigned, not user-provided
default: value
min: number               # string length or numeric minimum
max: number               # string length or numeric maximum
pattern: "regex"          # string validation pattern
```

---

## Maturity Levels

| Level | Meaning |
|---|---|
| `draft` | Work in progress. Breaking changes expected. |
| `beta` | Stable enough for experimentation. |
| `stable` | Production ready. Breaking changes only on major version bump. |
| `deprecated` | Superseded. Include `replacement` URL. |

---

## MCP Runtime

A domain that declares an `interfaces.mcp` block exposes its Spectral spec nodes alongside its data at runtime. A consuming AI agent receives:

1. The data
2. The `model` node — field semantics and types
3. The `views` node — intended presentation contract
4. The `interactions` node — available actions and permissions

This allows the agent to render and interact with the domain correctly without additional configuration. The spec *is* the integration contract.

---

## Versioning

Spectral packages use semantic versioning. The version is declared in `index.spectral`:

```yaml
version: 1.2.0
```

Consumers pin versions in dependency URLs:

```
https://raw.githubusercontent.com/.../index.spectral@1.2.0
```

Breaking changes (field removal, type changes, node restructuring) require a major version bump.
