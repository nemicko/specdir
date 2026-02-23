# Application Context Language (ACL) — Project Context

Source of truth:
- `spec/README.md` defines ACL semantics.
- `features/*/*.acl` defines Features.
- `registry.yaml` lists discoverable Features.

Each Feature uses four context files:
- `[feature].schema.acl`
- `[feature].flow.acl`
- `[feature].contract.acl`
- `[feature].persona.acl`

Each file includes:

```acl
:::ACL_METADATA
DOMAIN: company.subsystem
CONTEXT: Schema | Flow | Contract | Persona
VERSION: x.y.z
IMPORT:
  - optional.feature.Contract AS Alias
:::
```

Commands:
- `npm run validate`
- `npm run check-urls`
- `npm run validate-acl`
- `npm run build`

Generated output:
- `/`
- `/directory`
- `/spec`
- `/features/[name]/`

Working rule:
Persona actions map to Contracts, and Contracts map to Flow or Schema effects.
