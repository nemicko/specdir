# Contributing to specdir

## Submitting a New Package

1. **Fork this repository**

2. **Add your entry to `registry.yaml`**

   ```yaml
   - name: your-package-name
     description: "One sentence describing what domain this covers."
     author: Your Name or Org
     domain: yourdomain.com
     url: https://yourdomain.com/path/to/your/spectral/package
     tags: [tag1, tag2]
     maturity: draft | beta | stable
     submitted: YYYY-MM-DD
   ```

3. **Requirements before submitting:**
   - Your URL must be publicly reachable
   - Your spec must be valid Spectral format (CI will validate automatically)
   - The `domain` field must match the domain in your `url`
   - Package name must be unique in the registry
   - Package name must follow the pattern: `spectral-[domain-name]`

4. **Open a Pull Request**
   - Title: `Add: spectral-yourpackage`
   - Include a brief description of what domain the spec covers
   - CI will automatically validate your spec URL and format

5. **Review and merge**
   - A maintainer will review within 7 days
   - Feedback will be given via PR comments
   - Once approved, your package is live immediately on merge

---

## Updating an Existing Package

Open a PR with the change to your entry in `registry.yaml`.

- URL changes, description updates, maturity bumps — all handled via PR
- You must be the original submitter or provide proof of ownership
- Breaking URL changes require a comment explaining migration path

---

## Removing a Package

Open an issue with title `Remove: spectral-yourpackage` and reason.

Packages are not hard-deleted — they are marked `deprecated` with a forwarding URL where possible, preserving history.

---

## Validation Rules (enforced by CI)

- `name` — required, unique, matches `spectral-[a-z0-9-]+`
- `description` — required, max 120 characters
- `author` — required
- `domain` — required, must match URL domain
- `url` — required, must be reachable, must return valid Spectral format
- `tags` — required, at least one
- `maturity` — required, one of: draft, beta, stable, deprecated
- `submitted` — required, ISO date format

---

## Code of Conduct

This directory is infrastructure. Keep PRs and issues focused on the registry.
Protocol discussions belong in [Discussions](../../discussions).
Be respectful. Maintainers have final say on listings.
