# Implement {{FEATURE_NAME}}

## What You Are Building

Application Context Language (ACL) is a declarative specification format for product features. Each feature is defined in four context files — `Schema`, `Flow`, `Contract`, and `Persona` — that together describe its data shape, internal mechanisms, public interface, and user experience. ACL is language-agnostic: the same definition produces working code in any stack.

You are implementing **{{FEATURE_NAME}}**: {{FEATURE_DESCRIPTION}}

Your job is to translate the four `.acl` files for this feature into working code in the user's technology stack. Every declaration in the spec must produce a concrete artifact. The governing rule is the **Binding Rule**: `Persona → Contract → Flow / Schema`. Every user-visible action maps to a Contract, and every Contract maps to at least one Flow or Schema effect.

## Step 1: Read the Specification

Fetch the ACL protocol spec:

```
{{SPEC_URL}}
```

Extract the four context definitions (`Schema`, `Flow`, `Contract`, `Persona`), the Binding Rule, the metadata format (`DOMAIN`, `CONTEXT`, `VERSION`, `IMPORT`, `REQUIRES`), and the cross-feature encapsulation rules. This is the protocol — treat it as authoritative for all terminology and structural requirements.

## Step 2: Fetch and Parse the Feature Definition

Fetch the feature bundle:

```
https://specdir.com/features/{{FEATURE_NAME}}/bundle.txt
```

This single file contains all four context files (Schema, Flow, Contract, Persona) separated by `--- filename ---` markers. Split the bundle on these markers to extract each context file, then for each one:
1. Parse the `:::ACL_METADATA` header — extract `DOMAIN`, `CONTEXT`, `VERSION`, `IMPORT`, and `REQUIRES` declarations.
2. Build the dependency graph from both `IMPORT` and `REQUIRES` lines. `IMPORT` names concrete feature Contracts. `REQUIRES` names abstract capabilities with version ranges and local aliases.
3. Parse the body into structured declarations (`SCHEMA`, `FLOW`, `CONTRACT`, `PERSONA`).

**Do not generate code until all four files are parsed.** The contexts reference each other and incomplete parsing leads to broken output.

Before generating code, load project-local mapping files from `acl/mappings/*.map.acl` and resolve each `REQUIRES` capability to exactly one compatible provider (feature Contract or project adapter). Missing or ambiguous bindings are specification errors.

## Step 3: Confirm the Target Environment

Ask the user for:

1. **Language** — determines type mappings, idioms, and package conventions
2. **Backend framework** — determines routing, middleware, and service patterns
3. **Frontend framework** — determines component model, state management, and rendering
4. **Database / ORM** — determines how Schema constraints become migrations and queries
5. **UI component library** — determines how Persona display modifiers map to components

If the user provides a project directory, inspect it to detect the stack automatically (package.json, Gemfile, requirements.txt, go.mod, etc.). Adapt all generated code to the detected stack's conventions, file structure, and naming patterns.

## Step 4: Generate the Data Layer — from Schema

For each `SCHEMA` entity, produce:

1. **Typed model or class** — map every attribute to the target language's type system. ACL types (`uuid`, `email`, `url`, `datetime`, `locale`, `string`, `enum(...)`) each have a canonical target type.
2. **Database migration** — include column types, `NOT NULL` for `required`, unique indexes for `unique`, enum types or check constraints for `enum(...)`, and `default(...)` values.
3. **Validation module** — enforce every modifier: `min(n)` and `max(n)` as length/range checks, `pattern("...")` as regex validation, `required` as presence checks, `unique` as uniqueness queries, `enum(...)` as inclusion checks.
4. **Immutability guards** — every field listed under `IMMUTABLE` must be write-protected. Use pre-update hooks, readonly annotations, or equivalent mechanisms to prevent mutation after creation.

Map `RELATIONSHIPS` to foreign keys, join tables, or embedded references as appropriate for the ORM. `hasOne` and `hasMany` with cardinality hints (`optional`, `lazy`) should inform loading strategy.

Translate `CONSTRAINTS` into coded invariants — validation rules, database triggers, or application-level checks depending on the stack.

**Rule:** every modifier in the ACL must appear in at least one generated artifact. If a modifier has no representation in the output, the generation is incomplete.

## Step 5: Generate Internal Mechanisms — from Flow

For each `FLOW`, produce:

1. **Service function or handler** — named after the Flow (e.g., `FLOW PrepareNewUser` → `prepareNewUser` function).
2. **Guard clauses** — from `REQUIRES` preconditions. Each `REQUIRES` line becomes an early-return or exception if the condition is not met.
3. **Step implementation** — each numbered step in `STEPS` becomes concrete logic: field mutations, session revocations, timestamp updates, or other operations described.
4. **Domain event types** — for every `Emit DomainEvent` statement, define an event type and publish it through the stack's event system.

Map triggers to invocation patterns:
- `Contract.*` triggers → direct calls from the named contract's handler
- `Internal.*` triggers → event listeners or application-level hooks
- `Schema.*` triggers → database hooks, model callbacks, or change-data-capture listeners

**Rule:** Flows are private to the feature. Never expose a Flow as a public endpoint. Never allow another feature to import or call a Flow directly.

## Step 6: Generate the Public Interface — from Contract

For each `CONTRACT`, produce:

1. **Route or endpoint** — from `INTERFACE` lines. `REST: POST /users` → a POST handler at `/users`. `REST: GET /users/{id}` → a GET handler with a path parameter. `MCP: serves {...}` → the appropriate MCP tool registration.
2. **Input validation** — from `INPUT` fields. Cross-reference Schema to determine types, required/optional status, and constraints for each input field.
3. **Authorization middleware** — from `AUTHZ` rules:
   - `admin` → require admin role
   - `member:self` → require member role AND resource ownership
   - `admin:any` → require admin role, no ownership constraint
   - No `AUTHZ` block → public (or system-default auth)
4. **Handler body** — translate each `LOGIC` line using this keyword-to-code mapping:
   - `EXECUTE Flow.X` → call the corresponding Flow service function
   - `PERSIST Schema.X` → create/save the entity via the ORM
   - `CALL Alias.Operation` → invoke the imported feature's contract through a client interface or adapter
   - `EMIT event.name` → publish a domain event
   - `SET Schema.X.field` → targeted field update on the entity
   - `REQUIRES condition` → precondition guard; reject with appropriate error if unmet
   - `UPDATE mutable Schema.X fields only` → apply input to all mutable fields (exclude `IMMUTABLE` fields)
5. **Dependency adapters** — for each `IMPORT` and resolved `REQUIRES` capability, generate a client interface, adapter, or service stub that the handler can call. This is the cross-feature integration point.

**Rule:** Contracts are the only public surface of a feature. Never expose Schema models or Flow functions directly to external callers or other features.

## Step 7: Generate the User Experience — from Persona

For each `PERSONA` and its `VIEW` blocks, produce:

1. **Page or component** — scoped to the persona's role. An `Admin` persona produces admin-facing views; a `Member` persona produces member-facing views.
2. **Field rendering** — map each `DISPLAY` item's modifiers to UI components:
   - `as avatar` → image/avatar component
   - `as badge` → colored label or chip
   - `as primary` → prominent/headline text treatment
   - `as relative-date` → time-ago or relative date display
   - `sortable` → column sort controls or sort state
   - `filterable` → filter dropdown, search, or facet controls
3. **Forms** — `form.create` and `form.edit` declarations define which fields appear in creation and editing forms. Derive field types, validation rules, and required/optional status from the Schema.
4. **Action bindings** — each `ACTIONS` entry maps a button, menu item, or trigger to a Contract endpoint. `"Suspend" -> Contract.SuspendUser` → a button labeled "Suspend" that calls the SuspendUser API.

**Rule:** Persona components contain no business logic, no authorization checks, and no direct data validation. The Contract decides what is permitted; the Persona displays the result. If an action is unauthorized, the Contract rejects it — the Persona simply shows the outcome.

## Step 8: Verify the Binding Rule

Run three verification passes against your generated output:

1. **Forward trace** — for every action in every Persona, confirm it maps to a Contract. For every Contract, confirm it references at least one Flow (`EXECUTE`) or Schema effect (`PERSIST`, `SET`, `UPDATE`). If a Persona action has no Contract, or a Contract has no backing operation, the chain is broken.

2. **Reverse trace** — for every Schema field referenced in a Contract's `INPUT`, `LOGIC`, or a Persona's `DISPLAY`, confirm the field actually exists in the Schema definition. Flag any reference to a field that is not declared.

3. **Cross-feature trace** — for every `IMPORT` and `REQUIRES` dependency, confirm your generated code includes a corresponding client interface, adapter, or stub. For every `CALL Alias.Operation` in Contract logic, confirm the call is wired to the correct dependency adapter and mapped provider.

If any link is broken, report it as a specification gap and ask the user how to proceed. Do not silently fill gaps with assumptions.

## Step 9: Integrating into an Existing Codebase

When the user has an existing project:

- Preserve existing architecture, naming conventions, and file structure. Do not reorganize the project.
- Generate adapter layers that bridge ACL Contract endpoints to existing code paths.
- Load `acl/mappings/*.map.acl` and honor explicit capability bindings before attempting any auto-resolution.
- When existing models overlap with Schema entities, extend them with missing fields and constraints rather than replacing them.
- Map Contract `INTERFACE` endpoints to the project's existing routing patterns and middleware stack.
- Reuse existing authentication, authorization, and event systems rather than introducing new ones.
- Do not rewrite existing functionality unless explicitly asked.

## Step 10: If URL Fetch Is Unavailable

If you cannot fetch URLs, ask the user to paste the following content in order:

1. The ACL specification (from `spec/README.md`), or confirm proceeding without it
2. The Schema file: `{{SUBSYSTEM}}.schema.acl`
3. The Flow file: `{{SUBSYSTEM}}.flow.acl`
4. The Contract file: `{{SUBSYSTEM}}.contract.acl`
5. The Persona file: `{{SUBSYSTEM}}.persona.acl`

Once all content is provided, proceed from Step 3 (Confirm the Target Environment).
