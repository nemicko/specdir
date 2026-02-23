# Application Context Language (ACL) v1.2

ACL is a declarative, language-agnostic protocol for software requirements. It shifts development from imperative coding (how) to feature definition (what).

An ACL Feature defines a complete slice of your product — what it is, how it behaves, and how it's experienced.
Write it once. Build it anywhere.

## 1. Structural Unit: Feature

The primary unit is a **Feature** (bounded context), named:

- `company.subsystem` (example: `xyz.users`)

Physical layout:

```text
/features/[feature.name]/
  ├── [feature].schema.acl
  ├── [feature].flow.acl
  ├── [feature].contract.acl
  └── [feature].persona.acl
```

## 2. The Four Contexts

### Schema (Data Context)

Defines static ground truth:
- entities
- attributes
- data types
- relationships

### Flow (Mechanism Context)

Defines internal engine behavior:
- private procedures
- background tasks
- auto-triggers
- internal state changes

### Contract (Business Logic + Interface Context)

Defines exchange layer:
- public business rules
- machine interfaces

### Persona (View + Experience Context)

Defines human interface:
- user-specific views
- intent-driven UI requirements
- frontend interaction logic

## 3. Required Metadata Header

Every `.acl` file starts with:

```acl
:::ACL_METADATA
DOMAIN: [namespace.name]
CONTEXT: [Schema | Flow | Contract | Persona]
VERSION: [SemVer]
IMPORT: [Optional list of external Contracts or Schemas]
:::
```

## 4. Cross-Feature Reference Rules

1. **Encapsulation:** A feature may not access another feature's Schema or Flow.
2. **Exchange:** Inter-feature communication happens through Contracts.
3. **Import syntax:**

```acl
IMPORT other.feature.Contract AS Alias
```

## 5. AI Handshake (Execution Priority)

1. **Context Mapping:** parse all `.acl` files and build dependency graph.
2. **Environment Detection:** infer target language/framework/database.
3. **Synthesis:**
   - new project: generate from scratch
   - legacy project: generate adapter layers to map ACL to existing code/data
4. **Consistency Check:**
   - every Persona action maps to a Contract
   - every Contract is backed by Flow or Schema behavior

## 6. Rule of Thumb

Every user-visible action maps to a Contract, and every Contract maps to at least one Flow or Schema effect.

## 7. Example (`xyz.billing`)

```acl
:::ACL_METADATA
DOMAIN: xyz.billing
CONTEXT: Contract
VERSION: 1.0.0
IMPORT:
  - xyz.users.Contract AS Users
:::

CONTRACT FinalizeInvoice {
  LOGIC: |
    1. CALL Users.VerifyIdentity(user_id)
    2. IF valid, EXECUTE Flow.CalculateTotal
    3. PERSIST Schema.Invoice

  INTERFACE:
    - REST: POST /billing/finalize
}
```

```acl
:::ACL_METADATA
DOMAIN: xyz.billing
CONTEXT: Persona
VERSION: 1.0.0
:::

PERSONA Customer {
  VIEW Receipt {
    DISPLAY: Schema.Invoice(amount, date)
    ACTION: "Print" -> System.LocalPrint
  }
}
```
