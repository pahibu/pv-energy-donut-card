# Development Notes

- Keep source code, config keys, comments, and technical documentation in English.
- Keep visible card and preview UI strings translatable through the shared i18n layer.
- In Home Assistant, use `hass.locale.language` for UI language selection.
- Use `locale` only for number and date formatting overrides.
- Add new languages in the shared translation module before wiring them into the preview switcher.
- Keep connector and hover label text readable in both light and dark Home Assistant themes.
- After changing rendering or theme-sensitive styles, verify hover and active states in both theme modes.
- Run `npm run test:visual` after canvas, layout, label, or theme changes.
- Run `npm test` after changes that affect rendering, formatting, or data handling.
- Rebuild `dist/pv-energy-donut-card.js` before publishing or opening a release PR.

## Run locally

```bash
npm install
npm run build
```

For watch mode during development:

```bash
npm run dev
```

For type-checking:

```bash
npm run lint
```

For tests:

```bash
npm test
```

For visual regression tests:

```bash
npm run test:visual
```

To update the committed golden images after an intentional visual change:

```bash
npm run test:visual:update
```

Visual test assets live under:

```text
tests/visual/
```

Key paths:

- `tests/visual/golden/` contains the committed reference images
- `tests/visual/actual/` contains fresh screenshots from the latest run
- `tests/visual/diff/` contains pixel diffs for failed comparisons

The GitHub Actions workflow in `.github/workflows/visual.yml` runs these checks on `push` and `pull_request` and uploads diff artifacts on failure.

> [!NOTE]
> Visual snapshots can differ slightly between platforms, especially between macOS and Ubuntu-based GitHub runners because of font rendering and browser rasterization differences. Treat the GitHub Actions run on Linux as the authoritative reference for CI, and update committed golden images to match that environment when needed.

The production bundle is generated at:

```text
dist/pv-energy-donut-card.js
```
