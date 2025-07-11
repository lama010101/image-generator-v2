# Image Generator v2 – Product Requirements Document (Scratch Build)

> **Vision:** Deliver the smallest‑possible app that turns a prompt into an image stored in Firebase + Supabase, then iteratively grow into a full production tool.

---

## 📚 Table of Contents

1. MVP Charter (What ships first?)
2. Existing Core Tables
3. MVP Functional Requirements
4. Non‑Functional Requirements
5. Technical Architecture
6. Atomic Tasks (MVP)
7. Full‑Production Backlog
8. Glossary

---

\## 1 · MVP Charter · MVP Charter
**Must do only four things:**

1. Display a list of prompts (first 100 rows of `public.prompts`)
2. Generate one image with **RunDiffusion 130** when the user clicks **Generate**
3. Optimise to WebP (1024 px) with **Sharp**, upload to `/original/{uuid}.webp` in **Firebase Storage**
4. Copy all fields from the prompt row → insert a new row in `public.images` (plus image‑specific metadata) and show it in a simple Gallery

> **Out of scope for MVP:** Admin keys UI (use `.env.local`), batch generation, variants, advanced filters, task runner, realtime logs, FAL fallback.

Success = A non‑technical user can pick a prompt, press **Generate**, and see the resulting image.

---

\## 2 · Existing Core Tables

### 2.1 `public.prompts`  *(already exists – see full DDL in Knowledge folder knowledge\prompts and images tables schema.md)*

Stores every prompt and its rich metadata (hint fields, GPS, etc.).

### 2.2 `public.images`  *(already exists – see full DDL in Knowledge folder knowledge\prompts and images tables schema.md)*

Stores generated (or real) images; must mirror metadata fields from `prompts`.

> **Rule:** When inserting into `images`, copy every column name that also exists in `prompts`; leave extra `images`‑only columns (`image_url`, `model`, etc.) for the pipeline to fill.

### 2.3 `public.settings`  *(global key‑value json)*

Not needed for MVP because secrets live in `.env.local`.  We **read from `settings` first**, then fall back to `.env.local` when undefined (implemented in `settings.ts`).

---

\## 3 · MVP Functional Requirements

| ID        | Requirement                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP‑0** | **Project Management Page** – read‑only table (`project_tasks`) showing task ID, title, status. Lets user monitor progress from day 1. |
| MVP‑1     | **Prompt List Page** – table with first 100 prompts (title + description). Client‑side search only.                                    |
| MVP‑2     | **Generate Button** – one prompt at a time. Calls `/api/generate?promptId=`.                                                           |
| MVP‑3     | **Generation Pipeline** – RunDiffusion 130 → Sharp WebP 1024 px → Firebase upload → Supabase insert.                                   |
| MVP‑4     | **Gallery Page** – simple grid (25/page) listing images sorted by `created_at DESC`. Click shows full metadata + image.                |
| MVP‑5     | **Log Panel** – fixed right panel appending server logs (in‑memory).                                                                   |
| MVP‑6     | **Secrets Loading** – `settings` table first → fallback to `.env.local`.                                                               |

\## 4 · Non‑Functional Requirements

* P95 end‑to‑end generation ≤ 15 s
* Works on desktop & mobile (basic Tailwind stacks)
* WCAG 2.1 AA colours & alt text
* Unit tests ≥ 80 % for pipeline libs
* CI must pass lint + test before merge

---

\## 5 · Technical Architecture

### 5.1 Frontend

* **Next.js 14 App Router** (TypeScript, RSC)
* Tailwind CSS + shadcn/ui
* Zustand (UI state), React Query (server data)
* Pages: `/` Prompt List, `/gallery`, `/logs` (optional tab)

### 5.2 Backend (API routes)

| File                 | Responsibility                                 |
| -------------------- | ---------------------------------------------- |
| `providerService.ts` | Call RunDiffusion 130 with prompt + key        |
| `imageOptimizer.ts`  | Sharp → WebP 1024 px                           |
| `firebaseStorage.ts` | Upload WebP to bucket → return URL             |
| `metadataMapper.ts`  | Merge prompt row + generation data             |
| `supabaseService.ts` | Read secrets (settings → env), insert `images` |
| `api/generate.ts`    | Orchestrator calling the above                 |

### 5.3 Secrets Flow

```ts
// settings.ts
export const getSecret = async (key: string) =>
  (await db.settings.find(key)) ?? process.env[key];
```

Keys needed: `RUND_DIFFUSION_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

### 5.4 Storage

`gs://historify-ai.appspot.com/original/{uuid}.webp`

### 5.5 CI/CD

GitHub Actions → Vercel (preview & prod).  No Cloudflare until Phase II.

---

\## 6 · Atomic Tasks (MVP)

| ID             | Title                                                                          | Depends   | Owner  |
| -------------- | ------------------------------------------------------------------------------ | --------- | ------ |
| **BOOT‑01**    | Scaffold Next.js 14 + Tailwind project                                         | –         | Dev    |
| **PM‑01**      | Read‑only Project Management Page (`/tasks`)                                   | BOOT‑01   | FE Dev |
| \*\***CFG‑01** | Verify `.env.local` is present & implement settings loader (DB → env fallback) | BOOT‑01   | Dev    |
| **API‑01**     | Implement `providerService.ts` (RunDiffusion)                                  | BOOT‑01   | BE Dev |
| **API‑02**     | Implement `imageOptimizer.ts`                                                  | BOOT‑01   | BE Dev |
| **API‑03**     | Implement `firebaseStorage.ts`                                                 | BOOT‑01   | BE Dev |
| **API‑04**     | Implement `metadataMapper.ts`                                                  | CFG‑01    | BE Dev |
| **API‑05**     | Implement `supabaseService.ts`                                                 | CFG‑01    | BE Dev |
| **API‑06**     | Orchestrator `/api/generate`                                                   | API‑01…05 | BE Dev |
| **UI‑01**      | Prompt List Page with Generate button                                          | API‑06    | FE Dev |
| **UI‑02**      | Gallery Page (grid)                                                            | API‑06    | FE Dev |
| **UI‑03**      | Log Panel                                                                      | API‑06    | FE Dev |
| **TEST‑01**    | Unit tests for libs                                                            | API‑02…05 | QA     |
| **E2E‑01**     | Cypress: prompt → generate → gallery shows image                               | UI‑02     | QA     |

> PR titles must include task ID.  Subsequent Part II tasks will be appended to `project_tasks`.

\## 7 · Full‑Production Backlog (Phase II+)

| Phase | Feature Set                                                                                                              | Milestone                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| 8     | **Batch Generation & Variants** – multi‑select queue, detailed progress cards, desktop/mobile/thumbnail variants         | Batch flow validated                |
| 9     | **Advanced Prompt & Gallery Management** – server‑side filters, Ready toggle, delete, list view                          | Rich management tools live          |
| 10    | **Enhanced Log & PM** – resizable/copy log panel, inline task editing, realtime sync, automated runner                   | Live collaborative PM & debugging   |
| 11    | **Provider Fallback & Extras** – FAL/Imagen 4 integration, Admin keys UI, AIR entry, UI animations, accessibility polish | Secondary provider live & UX polish |
