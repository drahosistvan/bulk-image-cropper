# Versioning & Release Workflow

This project uses **SemVer** (Semantic Versioning) automated via **Conventional Commits**.

## How to Release

You do **not** need to manually edit `package.json` version numbers.

### 1. Commit your changes
Use [Conventional Commits](https://www.conventionalcommits.org/) messages. This determines the next version number.

- **Patch** (`v1.0.0` -> `v1.0.1`):
  - `fix: correct typo in layout`
  - `style: update colors`
- **Minor** (`v1.0.0` -> `v1.1.0`):
  - `feat: add new trim mode`
- **Major** (`v1.0.0` -> `v2.0.0`):
  - `feat!: remove support for older macOS` (Note the `!`)
  - Or include `BREAKING CHANGE: ...` in the footer.

### 2. Run the release script locally
This calculates the new version, updates `package.json`, generates `CHANGELOG.md`, and creates a local git tag.

```bash
npm run release
```

### 3. Push the new version
Push your commits and the new tag to GitHub.

```bash
git push --follow-tags
```

### 4. GitHub Actions takes over
When GitHub sees the new tag (e.g., `v1.1.0`), it triggers the **Release** workflow:
1. Builds the app for macOS & Windows.
2. Creates a GitHub Release.
3. Attaches the `.dmg`, `.exe`, and `.zip` files.

