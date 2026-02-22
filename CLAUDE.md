# Application Context Script (ACS) — Project Context

Source of truth:
- `spec/README.md` defines ACS semantics.
- `features/*/*.acs` defines Features.
- `registry.yaml` lists discoverable Features.

Each Feature uses four context files:
- `[feature].schema.acs`
- `[feature].flow.acs`
- `[feature].contract.acs`
- `[feature].persona.acs`

Each file includes:

```acs
:::ACS_METADATA
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
- `npm run validate-acs`
- `npm run build`

Generated output:
- `/`
- `/directory`
- `/spec`
- `/features/[name]/`

Working rule:
Persona actions map to Contracts, and Contracts map to Flow or Schema effects.
