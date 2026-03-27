# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Architecture

This is a **Next.js 16** app using the **App Router** with **React 19** and **Tailwind CSS 4**.

- `src/app/` — App Router root: `layout.tsx` (root layout with Geist fonts), `page.tsx` (home page), `globals.css` (Tailwind v4 import + CSS custom properties for theming)
- Path alias `@/*` maps to `./src/*`
- Tailwind CSS 4 is configured via PostCSS (`@tailwindcss/postcss`), not a `tailwind.config.*` file — use `@theme` in CSS for customization
- Dark mode is handled via CSS custom properties in `globals.css`, not Tailwind's `dark:` variant

## Docs

Before generating any code, always refer to the relevant docs file in the `/docs` directory first. These documents define the standards that all generated code must follow.

- `/docs/ui.md` — UI component and date formatting standards
- `/docs/data-fetching.md` — Data fetching rules: server components only, Drizzle ORM via `/data` helpers, user-scoped queries
- `/docs/data-mutations.md` — Data mutation rules: Server Actions via colocated `actions.ts`, Zod validation, typed params, no FormData
- `/docs/auth.md` — Authentication standards: Clerk only, how to get the current user, UI components, route protection

## Key differences from standard Next.js

This project uses Next.js 16, which has breaking changes. Read guides in `node_modules/next/dist/docs/` before writing code. Key areas: App Router conventions, Server Components, routing APIs.
