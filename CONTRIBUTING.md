# Contributing to specdir

## Submitting a New ACS Feature

1. **Fork this repository**

2. **Add your entry to `registry.yaml`**

   ```yaml
   - name: publisher.feature
     description: "One sentence describing what product slice this covers."
     author: Your Name or Org
     domain: yourdomain.com
     url: https://yourdomain.com/features/publisher.feature/feature.contract.acs
     tags: [tag1, tag2]
     maturity: draft | beta | stable
     submitted: YYYY-MM-DD
   ```

3. **Requirements before submitting:**
   - URL must be publicly reachable
   - URL must return a valid ACS file with `:::ACS_METADATA`
   - `domain` field must match the URL hostname
   - Feature name must be unique in the registry
   - Feature name must match: `publisher.feature` (lowercase alphanumeric with dot separator)

4. **Open a Pull Request**
   - Title: `Add: publisher.feature`
   - Include a short feature summary
   - CI validates registry fields, URL reachability, and ACS metadata format

---

## Updating an Existing Feature

Open a PR with updates to the existing entry in `registry.yaml`.

---

## Removing a Feature

Open an issue titled `Remove: publisher.feature` with reason.

Features are not hard-deleted. They should be marked `deprecated` and include `replacement` where possible.

---

## Validation Rules (CI)

- `name` — required, unique, matches `publisher.feature`
- `description` — required, max 120 chars
- `author` — required
- `domain` — required, must match URL hostname
- `url` — required, reachable, and must return valid ACS metadata
- `tags` — required non-empty array
- `maturity` — one of: draft, beta, stable, deprecated
- `submitted` — required ISO date (`YYYY-MM-DD`)
