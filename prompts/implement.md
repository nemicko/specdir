# Implement an ACL Feature

You are implementing an Application Context Language (ACL) Feature as either a new application module or a component integrated into an existing codebase.

An ACL Feature defines a complete slice of the product: what it is, how it behaves, and how it's experienced.

## Step 1: Read the Protocol

Read the protocol spec:

```
https://specdir.com/spec
```

## Step 2: Fetch Feature Files

Fetch the target feature folder and read all four files completely:

- `[feature].schema.acl`
- `[feature].flow.acl`
- `[feature].contract.acl`
- `[feature].persona.acl`

Do not generate code until all four files are parsed.

## Step 3: Confirm Host Stack

Ask the user for:

1. Language
2. Backend framework
3. Frontend framework
4. ORM/database layer
5. UI component library/design system

## Step 4: Generate by Context

### Schema -> Data Layer

Generate model/entity types, DB schema/migrations, validation constraints, and relations.

### Flow -> Internal Mechanisms

Generate private services/jobs, event listeners, and internal state transitions.

### Contract -> Public Exchange Layer

Generate API routes/controllers, guards, I/O contracts, and external adapters.

### Persona -> UX Layer

Generate screens/components, view models/layout contracts, and UI action bindings to Contract capabilities.

## Required Enforcement

1. Persona actions cannot bypass Contracts.
2. Contracts cannot exist without Flow or Schema backing.
3. Cross-feature calls must go through imported Contracts.
4. Respect `DOMAIN`, `CONTEXT`, `VERSION`, and `IMPORT` metadata.

## Legacy Codebase Mode

If integrating into an existing project:

1. Keep existing architecture conventions.
2. Generate adapter layers from ACL Contracts/Personas to existing code paths.
3. Avoid broad rewrites unless requested.

## If URL Fetch Is Unavailable

Ask the user to paste:
1. Protocol spec (`spec/README.md`)
2. `[feature].schema.acl`
3. `[feature].flow.acl`
4. `[feature].contract.acl`
5. `[feature].persona.acl`
