# REVE Image Generator

## Overview

This project now focuses on a standalone REVE generator experience. The `/` route renders `ReveGeneratorPage`, a full-screen layout for crafting prompts, submitting generation requests to the REVE API, and reviewing responses with rich metadata.

## Key Features

- **Direct REVE integration** via `generateImage()` in `src/services/reveClient.ts`.
- **Local development history** stored in `localStorage` (dev mode only) through `useReveGenerator()`.
- **Configurable request form** with preset aspect ratios and REVE model versions.
- **Detailed response viewer** including headers, payload snapshot, and download/copy helpers.

## Environment Setup

Create `.env.local` with the following variables:

```bash
VITE_REVE_API_KEY=your_reve_api_key
VITE_REVE_API_BASE=https://api.reve.com
VITE_REVE_ENDPOINT_PATH=/v1/image/create
VITE_REVE_ACCEPT=application/json
```

`VITE_REVE_API_BASE`, `VITE_REVE_ENDPOINT_PATH`, and `VITE_REVE_ACCEPT` have sensible defaults (`https://api.reve.com`, `/v1/image/create`, `application/json` respectively). Override them for non-standard deployments.

## Running the App

```bash
npm install
npm run dev
```

Navigate to `http://localhost:5173/` to access the generator UI. Generation history persists only when `import.meta.env.DEV` is true so production builds do not store sensitive data locally.

## Testing

Unit tests cover the REVE client behaviour. Run:

```bash
npm test
```

The test suite validates JSON handling, binary fallback for non-JSON responses, and error propagation.

## File Structure Highlights

- `src/types/reve.ts` – shared types for payloads and responses.
- `src/lib/settings.ts` – runtime-safe REVE configuration (`getReveConfig()`), while preserving legacy settings export.
- `src/services/reveClient.ts` – low-level fetch wrapper for the REVE API.
- `src/hooks/useReveGenerator.ts` – stateful hook encapsulating form management, history persistence, and derived values.
- `src/pages/ReveGenerator.tsx` – top-level page implementation.
- `src/pages/ReveGenerator.css` & `src/App.css` – styling for the generator and layout shell.

## Development Notes

- History is capped at 10 entries and stored under the `reve-image-history` key.
- Copy-to-clipboard uses the Clipboard API; a message is surfaced when unavailable.
- `getReveConfig()` logs validation failures in dev and throws in production to avoid silent misconfiguration.
