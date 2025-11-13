# Image Trimmer (Internal Helper Tool)

Bulk desktop helper to trim transparent/solid borders from batches of images using [sharp]. Built with Electron + Vite + Vue 3.

> Internal distribution only (single company). App is intentionally **NOT code signed**. Users will need to bypass OS security prompts on first launch.

## Features
- Batch trim PNG / JPEG / WebP / AVIF / TIFF / BMP / GIF
- Overwrite in-place or output to timestamped subfolder
- Configurable concurrency + trim threshold
- Progress feedback with per-file status

## Tech Stack
- Electron + Electron Forge (Vite plugin)
- Vue 3 + Tailwind CSS
- sharp (native image processing)

## Development
```bash
npm install
npm run dev    # launches forge (main) + vite (renderer)
```

If something fails with native sharp after dependency changes:
```bash
npx electron-rebuild
```

## Building Locally (Unsigned)
```bash
npm run make
```
Artifacts appear in `make/` per platform:
- macOS: `.dmg` + `.zip`
- Windows: `.exe` (NSIS installer) + `.zip`
- Linux: `.deb` + `.zip`

(Note: AppImage / RPM were disabled due to missing maker packages in this environment. To re-enable, install `@electron-forge/maker-appimage` and/or `@electron-forge/maker-rpm` and add them back in `forge.config.js`.)

### Unsigned macOS App
First launch: Right‑click the app > Open (or System Settings > Privacy & Security > Allow Anyway).

### Unsigned Windows Installer
User may see SmartScreen. Choose "More info" > "Run anyway".

### Unsigned Linux Package (DEB)
Install via apt-compatible tools or extract the ZIP directly.

## Release / Versioning
Conventional Commits + `standard-version`.

Release flow:
```bash
# commit changes using feat:/fix:/chore:/perf: etc.
npm run release   # bumps version, updates CHANGELOG, creates tag
git push --follow-tags origin main
```
Tags `vX.Y.Z` trigger GitHub Actions release build and publish (ZIP/DMG/NSIS/DEB).

## Conventional Commit Examples
- feat: add adjustable trim threshold
- fix: handle corrupted image files gracefully
- chore: update dependencies
- perf: reduce memory usage

## Environment Variables
None required for local dev. CI uses `GITHUB_TOKEN` automatically.

## Security / Internal Use Notice
Unsigned artifacts; distribute only to trusted internal users.

## Troubleshooting
| Issue | Fix |
|-------|-----|
| Sharp fails to load | `rm -rf node_modules && npm ci` or `npx electron-rebuild` |
| Blank window | Ensure dev server started (`npm run dev`) |
| macOS cannot open app | Right-click > Open first time |
| SmartScreen warning | More info > Run anyway |

## License
UNLICENSED – Internal use only.

---
Made with Electron Forge.
