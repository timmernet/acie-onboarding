# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript type-check + production build
npm run preview   # Serve the production build locally
```

No test or lint scripts are configured.

## Architecture

**Dutch Army reservist onboarding SPA** — React 18 + TypeScript + Vite + Tailwind CSS. All data is mock/client-side only (no backend or API).

### State & Auth (`src/context/AuthContext.tsx`)

Central React Context wrapping the entire app. Manages:
- Authentication state persisted to **localStorage** (all users) and **sessionStorage** (current session)
- Three user roles: `reservist`, `commandant`, `beheerder` (admin)
- Login via email + 4-digit PIN, registration, role elevation, task completion tracking

### Routing (`src/App.tsx`, `src/components/ProtectedRoute.tsx`)

React Router v6. `ProtectedRoute` enforces authentication and role-based access:

| Path | Roles |
|---|---|
| `/login`, `/registreer`, `/vergeten` | Public |
| `/dashboard` | reservist |
| `/commandant` | commandant, beheerder |
| `/beheerder` | beheerder only |
| `/contacten` | all authenticated |

### Data (`src/data/dummyData.ts`, `src/types/index.ts`)

All data is static mock data — no API calls. Key types: `User` (with PIN, role, platoon, tasks[]), `Taak` (onboarding task with category), `Contact` (directory entry). Demo users, tasks, contacts, and platoons are all defined in `dummyData.ts`.

### Styling

Custom Tailwind config (`tailwind.config.js`) with military color palette: `army-*` (greens, `army-600` = `#3f7a22`) and `gold-*` accents. Inter font. UI language is Dutch.
