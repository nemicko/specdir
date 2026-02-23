# Application Context Language (ACL) v1.2

Software products are defined in many places — database schemas, API routes, UI mockups, user stories, acceptance criteria — each owned by a different team, expressed in a different format, and revised on a different cadence. The result is a fragmented source of truth. When a product manager describes a feature, the description is re-interpreted by backend engineers, frontend engineers, designers, and QA, each translating the same intent into their own medium. Drift is inevitable. Details are lost, duplicated, or contradicted.

ACL addresses this by providing a single, declarative format for defining what a feature *is* — its data, its behavior, its rules, and its user experience — independent of any programming language, framework, or runtime. An ACL definition is precise enough for machines to consume and generate code from, yet readable enough for a product team to review and approve. It is not pseudocode, and it is not documentation. It is a structured specification that sits upstream of both.

The scope of ACL is the *product layer*: the features a system offers and the rules that govern them. It intentionally says nothing about infrastructure, deployment topology, or performance tuning. Those concerns belong downstream, informed by — but not defined in — an ACL feature set.

Write it once. Build it anywhere.

---

## 1. The Feature

The primary unit of organization in ACL is the **Feature**. A Feature represents a self-contained slice of product functionality that owns its data shape, its internal processes, its external promises, and its user-facing surfaces. It is analogous to a bounded context in domain-driven design: everything inside a Feature is cohesive, and everything outside is accessed through explicit, controlled interfaces.

Every Feature is identified by a two-part namespace following the pattern `company.subsystem` — for example, `juice.users` or `juice.billing`. This naming convention prevents collisions when multiple teams or products contribute features to the same system, and it makes every reference unambiguous regardless of where it appears.

A Feature is always expressed as exactly four files, each responsible for one *context* of the feature's definition. This separation is enforced, not suggested — it ensures that data concerns never bleed into UI definitions, and that business logic never hides inside rendering instructions.

```text
/features/juice.users/
  ├── users.schema.acl
  ├── users.flow.acl
  ├── users.contract.acl
  └── users.persona.acl
```

The four contexts — Schema, Flow, Contract, and Persona — are described in detail below.

---

## 2. The Four Contexts

Every feature is decomposed into four complementary perspectives. Together they answer four questions: *What does the data look like? What happens internally? What does the system promise externally? What does the user see and do?* No single context answers all four questions, and no question is answered by more than one context. This orthogonality is the foundation of ACL's design.

### 2.1 Schema — The Data Context

A Schema defines what a feature's data looks like at rest. It describes entities, their attributes, data types, relationships, and integrity constraints — the static ground truth that every other context builds upon. A Schema is declarative: it states *what exists*, not how it got there or who is allowed to change it.

**Properties:**

- `SCHEMA` — declares a named entity
- `DESCRIPTION` — *(optional)* a natural-language summary of the entity's purpose. May also appear on individual attributes to describe their meaning or intent.
- `ATTRIBUTES` — lists the entity's fields, each with a type and optional modifiers (`required`, `optional`, `unique`, `generated`, `immutable`, `default(...)`, `min(...)`, `max(...)`, `pattern(...)`, `enum(...)`)
- `RELATIONSHIPS` — describes associations between entities (`hasOne`, `hasMany`, with cardinality and loading hints)
- `CONSTRAINTS` — natural-language business rules that constrain data integrity
- `IMMUTABLE` — explicitly lists fields that may never change after creation

**Example** (from `juice.users`):

```acl
SCHEMA User {
  DESCRIPTION: "Core identity record representing a platform user account."

  ATTRIBUTES:
    id: uuid required generated immutable
      DESCRIPTION: "Globally unique identifier assigned at creation."
    email: email required unique immutable
      DESCRIPTION: "Primary login credential and notification address."
    username: string unique min(3) max(32) pattern("^[a-zA-Z0-9_]+$")
    displayName: string required min(1) max(64)
    avatarUrl: url optional
    role: enum(admin, member, guest) required default(member)
      DESCRIPTION: "Determines authorization scope across the platform."
    status: enum(active, suspended, pending, deleted) required default(active)
      DESCRIPTION: "Lifecycle state governing account access and visibility."
    locale: locale optional default("en")
    createdAt: datetime required generated immutable
    updatedAt: datetime required generated

  RELATIONSHIPS:
    profile: hasOne LocalProfile optional lazy
    roles: hasMany LocalRoleAssignment

  CONSTRAINTS:
    - A user with status=deleted is not resolvable by public contracts.
    - Email must be verified before transition pending -> active.
    - Only admin role may mutate role.

  IMMUTABLE:
    - id
    - email
    - createdAt
}
```

**Boundary:** A Schema never describes *how* data changes — that belongs to Flow. It never describes *who* may change it or under what authority — that belongs to Contract.

---

### 2.2 Flow — The Mechanism Context

A Flow defines what a feature does behind the scenes. Flows are internal procedures — background tasks, automatic state transitions, validation pipelines — that are triggered by events but never invoked directly by a user or an external system. They represent the machinery that keeps the feature's data consistent and its domain events propagated.

Each Flow declares a `TRIGGER` (the event that starts it), optional preconditions via `REQUIRES`, and an ordered list of `STEPS`. Steps may mutate schema state, revoke sessions, or emit domain events to signal downstream consumers. A Flow is always private to its feature; no other feature may call it directly.

**Properties:**

- `FLOW` — declares a named internal procedure
- `DESCRIPTION` — *(optional)* a natural-language summary of what this flow accomplishes and when it runs
- `TRIGGER` — the event or contract invocation that activates this flow (e.g., `Contract.RegisterUser`, `Internal.IdentityVerified`, `Schema.User.updated`)
- `REQUIRES` — preconditions that must hold before execution
- `STEPS` — ordered operations, which may include state changes and `Emit DomainEvent` statements

**Example** (from `juice.users`):

```acl
FLOW PrepareNewUser {
  DESCRIPTION: "Normalizes input and applies initial state for newly created user accounts."
  TRIGGER: Contract.RegisterUser | Contract.InviteUser
  STEPS:
    1. Normalize email and username.
    2. Enforce Schema.User uniqueness constraints.
    3. Set status=pending when identity verification is incomplete.
    4. Stamp createdAt/updatedAt.
}

FLOW SuspendAccess {
  DESCRIPTION: "Deactivates a user account and revokes all active sessions."
  TRIGGER: Contract.SuspendUser
  REQUIRES:
    - Schema.User.status == active
  STEPS:
    1. Set status=suspended.
    2. Revoke active sessions.
    3. Emit DomainEvent user.suspended.
}
```

**Boundary:** Flows are strictly internal. Any action initiated by an external caller — whether a user, an API client, or another feature — must go through a Contract, which may in turn trigger a Flow.

---

### 2.3 Contract — The Business Logic and Interface Context

A Contract defines what the system promises to do when asked, and under what conditions. It is the public surface of a feature: the set of operations that external callers — users, other features, API consumers — are permitted to invoke. Each Contract specifies its inputs, its authorization requirements, the logic it executes, and the interfaces through which it is accessible.

Contracts are the *only* cross-feature boundary. When one feature needs to interact with another, it imports and calls a Contract — never a Schema or Flow directly. This encapsulation ensures that a feature's internal data model and processes can evolve without breaking consumers.

**Properties:**

- `CONTRACT` — declares a named external operation
- `DESCRIPTION` — *(optional)* a natural-language summary of the operation's purpose and behavior
- `INPUT` — the data required to invoke this operation
- `AUTHZ` — authorization rules (e.g., `admin`, `member:self`, `admin:any`)
- `LOGIC` — ordered steps describing what happens on invocation; uses keywords:
  - `EXECUTE` — invoke a Flow
  - `PERSIST` — write to a Schema entity
  - `CALL` — invoke another feature's Contract (via import)
  - `EMIT` — publish a domain event
  - `SET` — mutate a specific schema field
  - `REQUIRES` — assert a precondition
  - `UPDATE` — modify mutable fields
- `INTERFACE` — the protocol endpoints that expose this operation (e.g., `REST: POST /users`, `MCP: serves {...}`)

**Example** (from `juice.users`):

```acl
CONTRACT RegisterUser {
  DESCRIPTION: "Creates a new user account with pending verification status."
  INPUT:
    - email
    - displayName
    - username
    - role
    - locale
  LOGIC: |
    1. EXECUTE Flow.PrepareNewUser
    2. PERSIST Schema.User
    3. EMIT user.created
  INTERFACE:
    - REST: POST /users
}

CONTRACT EditUser {
  DESCRIPTION: "Updates mutable profile fields for an existing user."
  INPUT:
    - displayName
    - username
    - avatarUrl
    - locale
  AUTHZ:
    - admin:any
    - member:self
  LOGIC: |
    1. UPDATE mutable Schema.User fields only
    2. CALL Storage.ResolveAvatarUrl when avatar changes
    3. EMIT user.updated
  INTERFACE:
    - REST: PATCH /users/{id}
}

CONTRACT ChangeUserRole {
  DESCRIPTION: "Reassigns a user's platform role. Admin-only operation."
  INPUT:
    - role
  AUTHZ: admin
  LOGIC: |
    1. SET Schema.User.role
    2. EMIT user.role_changed
  INTERFACE:
    - REST: POST /users/{id}/role
}
```

Notice that `EditUser` uses `CALL Storage.ResolveAvatarUrl` — this references a Contract imported from the `juice.storage` feature. The import is declared in the file's metadata header (see [Section 4: Metadata](#4-metadata)) as `juice.storage.Contract AS Storage`, which allows the shorthand `Storage.ResolveAvatarUrl` within the logic block.

**Boundary:** A Contract never defines UI layout, display formatting, or user-facing labels. That responsibility belongs to the Persona.

---

### 2.4 Persona — The View and Experience Context

A Persona defines what a feature looks like and feels like to each type of user. It is the human interface layer — not a pixel-perfect design, but a declaration of *what information* each user role sees, *what actions* are available to them, and *what form* data entry takes. Personas are intentionally abstract: they specify that a field appears "as a badge" or "sortable," not that it renders as a 12px teal pill in the top-right corner. Implementation teams choose the visual treatment; the Persona defines the intent.

Each Persona is scoped to a user role (e.g., `Admin`, `Member`) and contains one or more Views. A View declares `DISPLAY` items with optional modifiers and `ACTIONS` that map directly to Contracts.

**Properties:**

- `PERSONA` — declares a named user role
- `DESCRIPTION` — *(optional)* a natural-language summary of this persona's role and responsibilities. May also appear on individual `VIEW` blocks to describe their purpose.
- `VIEW` — declares a named screen or interface within that role's experience
- `DISPLAY` — lists the data fields shown, with optional modifiers:
  - `as [label]` — presentation hint (e.g., `as badge`, `as avatar`, `as primary`, `as relative-date`)
  - `sortable` — the field supports sorting
  - `filterable` — the field supports filtering
- `ACTIONS` — user-initiated operations, each mapping to a Contract (e.g., `"Suspend" -> Contract.SuspendUser`)
- `form.create` / `form.edit` — declares the fields included in creation and editing forms

**Example** (from `juice.users`):

```acl
PERSONA Admin {
  DESCRIPTION: "Back-office operator who manages user accounts and platform settings."

  VIEW Directory {
    DESCRIPTION: "Paginated list of all users with filtering, sorting, and bulk actions."
    DISPLAY:
      - avatarUrl as avatar
      - displayName as primary sortable
      - email sortable
      - role as badge filterable
      - status as badge filterable
      - createdAt as relative-date sortable
    ACTIONS:
      - "Open User" -> Contract.UsersAPI(detail)
      - "Suspend" -> Contract.SuspendUser
      - "Reactivate" -> Contract.ReactivateUser
      - "Delete" -> Contract.DeleteUser
  }

  VIEW UserEditor {
    DESCRIPTION: "Form views for creating new users and editing existing user profiles."
    DISPLAY:
      - form.create: [email, displayName, username, role, locale]
      - form.edit: [displayName, username, avatarUrl, locale]
    ACTIONS:
      - "Create User" -> Contract.RegisterUser
      - "Save Changes" -> Contract.EditUser
      - "Change Role" -> Contract.ChangeUserRole
  }
}

PERSONA Member {
  DESCRIPTION: "Authenticated end-user who manages their own profile."

  VIEW SelfProfile {
    DESCRIPTION: "Read-only profile summary with an edit action."
    DISPLAY:
      - avatarUrl
      - displayName
      - email
      - locale
      - updatedAt
    ACTIONS:
      - "Edit Profile" -> Contract.EditUser
  }
}
```

**Boundary:** A Persona never contains business logic, authorization rules, or data validation. Those responsibilities belong to the Contract. If a Persona declares an action, the Contract it points to is the sole authority on whether that action is permitted and what happens when it executes.

---

## 3. The Binding Rule

The four contexts are not independent documents that happen to sit in the same folder. They are bound together by a single traceability rule that is the backbone of ACL's integrity:

> Every user-visible action maps to a Contract, and every Contract maps to at least one Flow or Schema effect.

This rule creates an unbroken chain from what the user sees to what the system does:

```
Persona  →  Contract  →  Flow / Schema
```

The chain is concrete and verifiable. Consider the "Suspend" action visible to an Admin in the `juice.users` feature:

1. **Persona:** `Admin.Directory` declares `"Suspend" -> Contract.SuspendUser`
2. **Contract:** `SuspendUser` requires `AUTHZ: admin`, checks that `Schema.User.status == active`, and executes `Flow.SuspendAccess`
3. **Flow:** `SuspendAccess` sets `status=suspended`, revokes active sessions, and emits `DomainEvent user.suspended`
4. **Schema:** `User.status` is defined as `enum(active, suspended, pending, deleted)`

Every link in this chain is explicit and traceable. If a Persona action does not point to a Contract, or a Contract does not reference a Flow or Schema, the specification is incomplete. Tooling can — and should — verify this automatically.

---

## 4. Metadata

Every `.acl` file begins with a metadata header enclosed in `:::ACL_METADATA` delimiters. This header makes each file self-describing and machine-parseable: it identifies which feature the file belongs to, which context it defines, what version of the definition it represents, and what external dependencies it declares.

```acl
:::ACL_METADATA
DOMAIN: juice.users
CONTEXT: Contract
VERSION: 1.2.0
IMPORT:
  - juice.auth.Contract AS Auth
  - juice.storage.Contract AS Storage
:::
```

| Field | Required | Purpose |
|-------|----------|---------|
| `DOMAIN` | Yes | Feature namespace (`company.subsystem`) — identifies which feature this file belongs to |
| `CONTEXT` | Yes | Which of the four contexts this file defines (`Schema`, `Flow`, `Contract`, or `Persona`) |
| `VERSION` | Yes | SemVer version of this feature definition, enabling change tracking and compatibility checks |
| `IMPORT` | No | Dependencies on other features' Contracts, declared with an alias for use in the file body |

The `IMPORT` field is the mechanism by which features declare their external dependencies. Only Contracts may be imported — never Schemas or Flows. Each import uses the `AS` keyword to assign a local alias, which keeps references short and avoids naming collisions when multiple features are imported.

---

## 5. Cross-Feature References

Encapsulation is a first-class concern in ACL. A feature's Schema and Flow are private — they define internal structure and behavior that may change at any time without notice. No other feature is permitted to reference them directly. This rule prevents tight coupling: if `juice.billing` could read `juice.users`'s Schema directly, any change to the User entity's field names or types could silently break the billing feature.

The only cross-feature surface is the **Contract**. When one feature needs data or behavior from another, it imports that feature's Contract and calls its operations. The Contract acts as a stable interface that the owning feature is responsible for maintaining.

In practice, this looks like the following. The `juice.users` Contract file declares its imports in the metadata header:

```acl
IMPORT:
  - juice.auth.Contract AS Auth
  - juice.storage.Contract AS Storage
```

Within the Contract body, these imports are referenced by their alias:

```acl
LOGIC: |
  1. CALL Storage.ResolveAvatarUrl when avatar changes
```

```acl
LOGIC: |
  1. All endpoints REQUIRE Auth.ValidateSession.
```

The `AS` keyword assigns a readable shorthand (`Auth`, `Storage`) that avoids repeating the full `juice.auth.Contract` path and prevents collisions if two imported features happen to expose operations with the same name.

---

## 6. AI Execution Model

ACL files are designed to be consumed programmatically — by AI agents, code generators, or implementation tools that translate the specification into working software. The execution model describes the expected sequence of operations when an AI system processes an ACL feature set.

### 6.1 Parse and Map

The agent reads all `.acl` files in the feature directory, parses their metadata headers, and resolves `IMPORT` declarations to build a dependency graph. At the end of this step, the agent has a complete picture of every feature, every context, and every cross-feature relationship in the system.

### 6.2 Detect Environment

The agent determines the target environment — programming language, framework, database, authentication provider — either from explicit configuration or by inspecting the existing project. This step is what makes ACL language-agnostic: the same feature definition produces a Rails migration, a Django model, or a Prisma schema depending on the detected environment.

### 6.3 Synthesize

For a new (greenfield) project, the agent generates all implementation artifacts from scratch: data models from Schemas, service layers from Flows and Contracts, API routes from Contract interfaces, and UI components from Personas. For an existing (brownfield) project, the agent generates adapter layers that map ACL definitions onto the project's existing code, data, and conventions — preserving what already works while filling in what the specification requires.

### 6.4 Verify Integrity

The agent checks that the Binding Rule holds end-to-end: every Persona action maps to a Contract, every Contract references at least one Flow or Schema effect, and every imported Contract resolves to a real feature. This verification step catches specification gaps before they become implementation bugs.
