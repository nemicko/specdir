# Implement a Spectral Package

You are implementing a Spectral domain specification — either as a new application or as a module added to an existing one. Spectral is an open protocol that describes application domains in YAML — data models, views, interactions, and interfaces — independent of any framework or language. Your job is to read the spec and generate a complete, working implementation of the domain.

## Step 1: Read the Protocol

Fetch and read the Spectral protocol spec to understand the type system, node anatomy, reference syntax, and field modifiers:

```
https://raw.githubusercontent.com/spectral-protocol/specdir/main/spec/README.md
```

## Step 2: Fetch the Package

Fetch the package entry point:

```
{{PACKAGE_URL}}
```

The entry point lists the node files. Fetch each one from the same directory:

- `model.spectral` — fields, types, constraints, relations
- `views.spectral` — table, detail, form, card presentation definitions
- `interactions.spectral` — actions, preconditions, permissions, events
- `interfaces.spectral` — REST endpoints and MCP exposure

Read all four files completely before generating any code.

## Step 3: Confirm the Stack

Before generating, ask the user:

1. **Language** — TypeScript, Python, Go, etc.
2. **Backend framework** — Express, Fastify, Django, Gin, etc.
3. **Frontend framework** — React, Angular, Vue, Svelte, etc.
4. **ORM / database layer** — Prisma, Drizzle, SQLAlchemy, GORM, etc.
5. **UI component library** — shadcn/ui, Material UI, Tailwind, etc.

Use sensible defaults if the user says "your choice" (e.g. TypeScript, Express, React, Prisma, Tailwind).

## Step 4: Generate

Map each Spectral node to implementation code:

### From `model.spectral`

- **Type/interface definition** — one type per model with all fields
- **Database schema** — ORM model or migration matching fields, types, and constraints
- **Validation schema** — Zod, Yup, or equivalent matching `required`, `min`, `max`, `pattern`, `unique`
- **Relations** — foreign keys or join tables for `hasOne`, `hasMany`, `belongsTo`
- **Semantic types** — map `email` to email validation, `uuid` to UUID generation, `url` to URL validation, `locale` to locale codes, etc.

### From `views.spectral`

- **Table view** — data table component with columns matching the spec: labels, sort, filter, search, pagination, display hints (`avatar`, `badge`, `date-relative`)
- **Detail view** — profile/detail page following the layout, header, and sections from the spec
- **Form variants** — one form per variant (`create`, `edit`); respect `inherits`, `exclude`, `add`, `editable`, `restricted` fields
- **Card view** — compact component with the specified fields and click action

### From `interactions.spectral`

- **One handler per action** — `create`, `invite`, `suspend`, `reactivate`, `delete`, `edit`, `change_role`
- **Input validation** — validate input fields listed in the spec
- **Preconditions** — enforce `requires` rules (e.g. status checks) before executing
- **Permissions** — enforce `restricted` roles; handle `self` access where specified
- **Confirmation** — implement confirmation dialogs where `confirmation: true`
- **Outcomes** — on success: apply state changes, emit events, navigate if specified; on failure: display errors
- **Events** — emit all declared events; create an event bus or hook system

### From `interfaces.spectral`

- **REST routes** — one route per endpoint matching method, path, query params, auth, and role requirements
- **Auth middleware** — enforce `auth: required` and role checks per endpoint
- **Request/response shaping** — respect `include`, `exclude`, `accepts`, `returns` directives
- **MCP stubs** — generate placeholder MCP handler that serves spec nodes alongside data (comment with TODO for full MCP implementation)

## Generation Principles

Follow these rules strictly:

1. **Immutability** — fields marked `immutable: true` must not be editable after creation. Enforce in update handlers and edit forms.
2. **Generated fields** — fields marked `generated: true` must be system-assigned (UUIDs, timestamps). Never accept from user input.
3. **Constraints** — implement every constraint from the `constraints` block as validation logic or middleware.
4. **Default values** — apply `default` values in schema and form initialization.
5. **Events** — every interaction outcome that says `emit:` must fire a named event. Wire up an event system.
6. **Permissions** — `restricted: [admin]` means admin only. `restricted: [admin, self]` means admin or the user themselves. Implement both paths.
7. **View fidelity** — render exactly the columns, sections, and fields the spec declares. Don't add or remove UI elements.
8. **Form inheritance** — when a form variant says `inherits: create`, start from the create variant fields, then apply `exclude` and `add`.
9. **Cross-domain stubs** — for `@profile.model`, `@roles.model`, `@auth.interfaces`, and other unresolved references, generate typed stubs with TODO comments.
10. **Semantic type mapping** — `email` gets email validation, `uuid` gets UUID v4 generation, `url` gets URL validation, `locale` gets locale code validation, `enum` gets the exact `values` list.

## If You Cannot Fetch URLs

If your environment doesn't support fetching URLs, ask the user to paste the contents of:

1. The protocol spec (`spec/README.md`)
2. The package entry point (`index.spectral`)
3. Each node file (`model.spectral`, `views.spectral`, `interactions.spectral`, `interfaces.spectral`)

Then proceed with generation using the pasted content.
