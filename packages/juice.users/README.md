# juice.users

> Spectral domain spec for user identity, authentication, roles and lifecycle management.

Part of the [Spectral Protocol](https://specdir.com) — hosted in the [specdir](https://github.com/spectral-protocol/specdir) monorepo.

## Nodes

| Node | Description |
|---|---|
| [model.spectral](./model.spectral) | User entity — fields, types, constraints, relations |
| [views.spectral](./views.spectral) | Table, detail, form, and card presentation definitions |
| [interactions.spectral](./interactions.spectral) | Create, invite, suspend, reactivate, delete, edit, change_role actions and events |
| [interfaces.spectral](./interfaces.spectral) | REST endpoints and MCP exposure contract |
| [index.spectral](./index.spectral) | Package entry point |

## Usage

Add to your `.spectral` file dependencies:

```yaml
dependencies:
  - https://raw.githubusercontent.com/spectral-protocol/specdir/main/packages/juice.users/index.spectral
```

Then tell your AI agent:

> "Integrate the juice.users package from the dependency URL into this application."

## Maturity

`draft` — work in progress, breaking changes possible.

## Relations

This package references but does not include:
- `@profile.model` — extended user profile
- `@roles.model` — fine-grained role assignments
- `@auth.interfaces` — token validation
- `@storage.interfaces` — avatar uploads

## Implement with AI

Copy the implementation prompt from the [package page](https://specdir.com/packages/juice.users/)
into any AI coding tool to generate a full-stack implementation.
