# Development Notes

- Keep source code, config keys, comments, and technical documentation in English.
- Keep visible card and preview UI strings translatable through the shared i18n layer.
- In Home Assistant, use `hass.locale.language` for UI language selection.
- Use `locale` only for number and date formatting overrides.
- Add new languages in the shared translation module before wiring them into the preview switcher.
- Keep connector and hover label text readable in both light and dark Home Assistant themes.
- After changing rendering or theme-sensitive styles, verify hover and active states in both theme modes.
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

The production bundle is generated at:

```text
dist/pv-energy-donut-card.js
```
