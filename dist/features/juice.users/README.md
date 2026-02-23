# juice.users

> ACL Feature for user identity, authentication, roles, and lifecycle management.

## Context Files

| File | Context |
|---|---|
| [users.schema.acl](./users.schema.acl) | Data model, constraints, and relationships |
| [users.flow.acl](./users.flow.acl) | Internal triggers, automation, and state transitions |
| [users.contract.acl](./users.contract.acl) | Public business capabilities and interfaces |
| [users.persona.acl](./users.persona.acl) | UI intent and action mappings to contracts |

## Usage

Import from another feature contract:

```acl
:::ACL_METADATA
DOMAIN: acme.billing
CONTEXT: Contract
VERSION: 1.2.0
IMPORT:
  - juice.users.Contract AS Users
:::
```
