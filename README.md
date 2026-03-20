# Wheel of Fortune

An interactive browser-based wheel picker for teams, games, and random choices.

## What it does

- Spins a canvas-based wheel from a list of items entered in the textarea
- Stores the current list in the URL hash, so the wheel can be bookmarked or shared
- Persists wheel state per bookmarked list in local storage
- Avoids repeating the last two winners when possible
- Supports keyboard shortcuts such as `Space` to spin when the textarea is not focused
- Plays packaged click and bell sounds during the spin

## Development

Install dependencies:

```bash
pnpm install
```

Start the app locally:

```bash
pnpm dev
```

Build the production bundle:

```bash
pnpm build
```

Preview the built app:

```bash
pnpm preview
```

## Deploy to GitHub Pages

Run the deploy script:

```bash
pnpm deploy:gh-pages
```

The script builds with a relative Vite base path (`./`) and force-pushes `dist` to the `gh-pages` branch.

Optional environment variables:

- `GH_PAGES_BASE` to override the Vite base path (for example `GH_PAGES_BASE=/wheel-of-fortune/`)
- `GH_PAGES_COMMIT_MESSAGE` to override the deploy commit message

## Quality checks

Run linting:

```bash
pnpm lint
```

Run unit tests:

```bash
pnpm test
```

Run coverage:

```bash
pnpm test:coverage
```

Run end-to-end tests:

```bash
pnpm test:e2e
```
