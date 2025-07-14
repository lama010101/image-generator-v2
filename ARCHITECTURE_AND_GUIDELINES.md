# Historify Image Generator

## Architecture & Code Guidelines (Detailed)

> Last updated: 2025-07-14

---

## Table of Contents
1. Purpose & Scope
2. High-Level Architecture
3. Folder Structure & File Map
4. Main Features & Logic Flow
5. Feature-to-File Mapping (How to Modify/Add)
6. Environment Configuration
7. Code Style & Conventions
8. Testing & Quality Assurance
9. Continuous Integration / Deployment
10. Contributing Workflow
11. Future Work & Open Questions

---

## 1. Purpose & Scope
This document **complements** `DOCUMENTATION.md` by providing:
* A detailed, actionable map of the codebase
* Logic flows for each main feature
* File-level guidance for modifying or adding features
* Coding standards, best practices, and project conventions
* On-boarding guidance for new contributors

**If you are new:** Start here! This file tells you where to look and what to change for any feature.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Browser (Client)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React + Vite + TypeScript                         │  │
│  │  │                                                 │  │
│  │  ├── UI Components (shadcn-ui + Tailwind CSS)      │  │
│  │  ├── Pages (React Router)                          │  │
│  │  ├── Hooks (data + UI logic)                       │  │
│  │  ├── Services (API clients)                        │  │
│  │  └── Stores (Zustand global state)                 │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
            ▲                         ▲
            │ HTTP / WebSocket        │ REST RPC
            ▼                         ▼
┌──────────────────────┐   ┌───────────────────────────────┐
│   Runware AI API     │   │      Supabase Platform        │
│  (image generation)  │   │  • Postgres DB (Row-level ACL) │
│                      │   │  • Storage (image files)       │
└──────────────────────┘   │  • Edge Functions (future)     │
                           └───────────────────────────────┘
```

---

## 3. Folder Structure & File Map

| Path | Purpose |
|------|---------|
| `src/components/` | Reusable UI components (buttons, dialogs, cards, etc.) |
| `src/components/filters/FiltersPanel.tsx` | Filtering UI for images/prompts |
| `src/components/generate/` | Components for image generation UI |
| `src/components/ui/` | shadcn-ui primitives (Button, Card, Dialog, etc.) |
| `src/pages/` | Route-level components: Gallery, Prompts, Tasks, etc. |
| `src/pages/Gallery.tsx` | Image gallery page (main display for generated images) |
| `src/pages/Prompts.tsx` | Prompt list page (choose prompt, trigger generation) |
| `src/pages/Tasks.tsx` | Project management/status page |
| `src/pages/Index.tsx` | Home route (renders Prompts) |
| `src/pages/NotFound.tsx` | 404 handler |
| `src/hooks/useProjectTasks.ts` | Fetches project tasks from Supabase |
| `src/services/imageGeneration.ts` | Main logic for generating images |
| `src/services/runwareService.ts` | Handles Runware API calls |
| `src/services/firebaseImageUploader.ts` | Handles uploads to Firebase (if used) |
| `src/lib/settings.ts` | Loads and validates env variables |
| `src/stores/queueStore.ts` | Zustand store for upload queue (if used) |
| `src/types/database.ts` | TypeScript types for DB tables |
| `src/utils/` | Utility functions (image size, formatting, etc.) |

---

## 4. Main Features & Logic Flow

### 4.1. Image Generation
**Goal:** User selects a prompt and generates a new image using AI.

**Logic Flow:**
1. **User Action:** Clicks "Generate" on a prompt (in `Prompts.tsx`).
2. **UI State:** Button triggers `generateImage` from `src/services/imageGeneration.ts`.
3. **Prompt Fetch:** Service fetches prompt data from Supabase (`prompts` table).
4. **Image Record:** Creates a new image record in Supabase (`images` table) with status `pending`.
5. **API Call:** If API key is present, calls Runware via `runwareService.ts` to generate the image.
6. **Image Upload:** (If needed) Uploads image to storage using `firebaseImageUploader.ts` or Supabase storage.
7. **DB Update:** Updates image record with final URL and marks as `ready`.
8. **UI Refresh:** React Query updates cache; Gallery page (`Gallery.tsx`) re-renders with new image.

**To modify logic:**
- Change API integration: edit `runwareService.ts`
- Change DB schema: update `imageGeneration.ts` and types in `types/database.ts`
- Change UI: edit `Prompts.tsx` or `Gallery.tsx`

---

### 4.2. Prompt Management
**Goal:** Display and filter prompts for users to select.

**Logic Flow:**
1. **Fetch Prompts:** `Prompts.tsx` uses React Query to fetch from Supabase `prompts` table.
2. **Filter/Search:** UI filters via `FiltersPanel.tsx`.
3. **Display:** Each prompt is rendered with title, description, and a "Generate" button.

**To add prompt fields:**
- Update Supabase `prompts` table
- Update Prompt interface in `Prompts.tsx`
- Update prompt fetch logic in `Prompts.tsx`

---

### 4.3. Gallery Display
**Goal:** Show all generated images with filtering and details.

**Logic Flow:**
1. **Fetch Images:** `Gallery.tsx` uses React Query to fetch from Supabase `images` table.
2. **Filter/Sort:** UI filters via `FiltersPanel.tsx`.
3. **Display:** Each image is rendered in a card with details (title, year, country, etc.).
4. **Image Size:** Uses `getImageSize` from `utils/imageUtils.ts` to show file sizes.

**To change gallery layout or add details:**
- Edit `Gallery.tsx` (main logic and rendering)
- Edit `components/ui/card.tsx` for card appearance

---

### 4.4. Project Tasks & Health
**Goal:** Track project tasks and environment health.

**Logic Flow:**
1. **Fetch Tasks:** `useProjectTasks.ts` fetches from Supabase `project_tasks` table.
2. **Display:** `Tasks.tsx` renders a table of tasks, statuses, and owners.
3. **Env Status:** Shows if required env vars are present (using `import.meta.env`).

**To add new tasks or columns:**
- Update Supabase `project_tasks` table
- Update `ProjectTask` type in `useProjectTasks.ts`
- Edit `Tasks.tsx` for new columns/UI

---

## 5. Feature-to-File Mapping (How to Modify/Add)

| Feature | Main Files to Edit | Notes |
|---------|-------------------|-------|
| Image Generation | `imageGeneration.ts`, `runwareService.ts`, `firebaseImageUploader.ts`, `Prompts.tsx` | Logic, API, upload, UI |
| Prompt List/Filter | `Prompts.tsx`, `FiltersPanel.tsx` | UI, fetch, filter |
| Gallery | `Gallery.tsx`, `FiltersPanel.tsx`, `utils/imageUtils.ts` | UI, fetch, filter, utils |
| Project Tasks | `Tasks.tsx`, `useProjectTasks.ts` | UI, fetch |
| Env Config | `settings.ts`, `.env.local` | Add/validate keys |
| DB Types | `types/database.ts` | Add new columns/types |
| UI Components | `components/ui/` | Add/modify UI primitives |
| Upload Queue | `queueStore.ts`, `firebaseImageUploader.ts` | Zustand store, upload logic |

**General Steps to Add a Feature:**
1. Decide: Is it a UI, logic, or backend feature?
2. For UI: Create/edit a component in `components/` or a page in `pages/`.
3. For logic/API: Add to `services/` or `hooks/`.
4. For DB: Update Supabase, then update types in `types/database.ts`.
5. Wire up with React Query or Zustand as needed.
6. Add/modify tests (if present).

---

## 6. Environment Configuration
Environment variables live in `.env.local` **ONLY** (never commit secrets). Validation occurs in `src/lib/settings.ts` via **Zod**.

Required keys:
```bash
# Runware
VITE_RUNWARE_API_KEY=

# Supabase
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional keys should be documented inline in `settings.ts`.

---

## 7. Code Style & Conventions
* **TypeScript** strict mode ON (`tsconfig.json`). Avoid `any`; use generics or utility types.
* **Imports**: use absolute alias `@/` (configured in `tsconfig.app.json`).
* **File Names**:
  * UI components: `Button.tsx`, `ImageCard.tsx`
  * Hooks: `useProjectTasks.ts`
  * Services: `imageGenerationService.ts`
* **Naming**:
  * Variables & functions: `camelCase`
  * Types & interfaces: `PascalCase`
  * Constants: `UPPER_SNAKE_CASE`
* **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add image zoom`).
* **Linting & Formatting**:
  * Run `pnpm lint` before pushing.
  * Use your editor’s ESLint & Prettier integration (defaults in repo).
* **Comments**:
  * Prefer self-documenting code.
  * Use JSDoc for exported functions when behaviour isn’t obvious.
* **Error Messages** must be actionable (include expected vs actual where relevant).

---

## 8. Testing & Quality Assurance
* Unit tests (Vitest) live alongside source files: `ComponentName.test.tsx`.
* Integration tests (Playwright) live in `tests/` (future work).
* Critical paths (image generation) should have at least happy-path + failure tests.

---

## 9. Continuous Integration / Deployment
1. **GitHub Actions** (future): run `pnpm lint && pnpm build && pnpm test` on PRs.
2. Deploy static build to **Netlify** (or Vercel) with environment secrets.
3. Edge Functions (Supabase) deployed via `supabase functions deploy`.

---

## 10. Contributing Workflow
1. Fork & clone repo → `pnpm i`.
2. Create branch `feat/<ticket-id>-<slug>`.
3. Make code changes following this doc.
4. Run `pnpm lint && pnpm test`.
5. Open PR → ensure checks pass → request review.
6. Squash-merge using Conventional Commit summary.

---

## 11. Future Work & Open Questions
* Adopt generated Supabase types for end-to-end type safety.
* Migrate placeholder images to a public CDN.
* Add service worker for offline gallery.
* Investigate React Server Components (once Vite supports).

---

### License
This project is licensed under the MIT License unless stated otherwise in `LICENSE`.

---

Happy hacking! 🎉
