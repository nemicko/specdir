# juice.users

> ACS Feature for user identity, authentication, roles, and lifecycle management.

## Context Files

| File | Context |
|---|---|
| [users.schema.acs](./users.schema.acs) | Data model, constraints, and relationships |
| [users.flow.acs](./users.flow.acs) | Internal triggers, automation, and state transitions |
| [users.contract.acs](./users.contract.acs) | Public business capabilities and interfaces |
| [users.persona.acs](./users.persona.acs) | UI intent and action mappings to contracts |

## Usage

Import from another feature contract:

```acs
:::ACS_METADATA
DOMAIN: acme.billing
CONTEXT: Contract
VERSION: 1.2.0
IMPORT:
  - juice.users.Contract AS Users
:::
```
