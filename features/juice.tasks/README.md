# juice.tasks

> ACL Feature for basic task management with priorities, assignments, and lifecycle tracking.

## Context Files

| File | Context |
|---|---|
| [tasks.schema.acl](./tasks.schema.acl) | Data model, constraints, and relationships |
| [tasks.flow.acl](./tasks.flow.acl) | Internal triggers, automation, and state transitions |
| [tasks.contract.acl](./tasks.contract.acl) | Public business capabilities and interfaces |
| [tasks.persona.acl](./tasks.persona.acl) | UI intent and action mappings to contracts |

## Usage

Import from another feature contract:

```acl
:::ACL_METADATA
DOMAIN: acme.projects
CONTEXT: Contract
VERSION: 1.0.0
IMPORT:
  - juice.tasks.Contract AS Tasks
:::
```
