# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Type-check + build for production
npm run preview    # Preview production build
npm run lint       # ESLint (zero warnings allowed)
```

No test suite is configured.

## Environment

Requires a `.env.local` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

Spanish-language shopping list app (lista de compra). Stack: React 18 + TypeScript + Vite, Tailwind CSS, Zustand, Supabase, React Router v6, Radix UI, lucide-react.

### Data flow pattern

`src/lib/supabase.ts` — Supabase client + all shared TypeScript types (`Producto`, `ItemLista`, `Lista`, `TemplateItem`, `HistoricoCompra`, `Sugerencia`, etc.)

`src/services/` — Raw Supabase queries. Each function maps directly to a DB table/view operation:
- `listaService.ts` — CRUD on `lista_pendiente` table; grouping helpers (`getListaPorLugar`, `getListaPorCategoria`)
- `listasService.ts` — CRUD on `listas` table (manages multiple named lists)
- `productosService.ts` — CRUD on `productos` table
- `calculosService.ts` — purchase frequency calculations
- `telegramService.ts` — calls a Supabase Edge Function to send Telegram notifications

`src/hooks/` — Custom hooks that call services and sync results into Zustand store:
- `useListaCompra(listaId?)` — manages current list items (add, mark purchased, delete, filter by state)
- `useListas()` — loads all lists, exposes `listaActiva`
- `useProductos()` — product catalog management
- `useSugerencias()` — auto-generated purchase suggestions based on frequency
- `useTemplates()` — template list management
- `useUserName()` — persists username to localStorage

`src/store/useStore.ts` — Single Zustand store holding: `productos`, `listaCompra`, `sugerencias`, `isLoading`, `error`, `filtroLugar`, `filtroCategoria`, `usuarioActual`.

`src/pages/` — Page-level components wired to hooks. `Home` renders `ListaCompra` for the active list.

### Important notes

- `listaService-NUEVO.ts` is an older draft; the active service is `listaService.ts`.
- Items always require a `lista_id` — the app supports multiple named lists.
- `ItemLista.estado` is one of `'pendiente' | 'comprado' | 'ignorado'`.
- Week/year metadata (`semana_compra`, `año_compra`) is automatically set when adding or marking items as purchased.
- Telegram notifications are sent via a Supabase Edge Function at the URL hardcoded in `telegramService.ts`.
