# Styling Parity Inventory: agent-chat-ui ↔ supabase-ui

This document captures the shared design tokens, plugins, utilities, and sidebar motion/layout primitives to align `agent-chat-ui` with `supabase-ui`.

## Sources
- supabase-ui tokens: `supabase-ui/app/globals.css`
- supabase-ui sidebar system: `supabase-ui/components/ui/sidebar.tsx`
- supabase-ui PostCSS: `supabase-ui/postcss.config.mjs`
- agent-chat-ui tokens: `agent-chat-ui/src/app/globals.css`
- agent-chat-ui Tailwind config: `agent-chat-ui/tailwind.config.js`
- agent-chat-ui PostCSS: `agent-chat-ui/postcss.config.mjs`

## Design Tokens and Theme
- Supabase uses HSL-based tokens and defines both light and dark schemes under `.dark`.
- Agent uses OKLCH-based tokens and maps theme aliases via `@theme inline` similarly.
- Common aliases to ensure parity:
  - `--background`, `--foreground`, `--card`, `--popover`
  - `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
  - `--border`, `--input`, `--ring`
  - `--chart-1..5`
  - Sidebar-specific: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`
- Radius:
  - supabase-ui: `--radius: 0.5rem` -> mapped to `--radius-lg/md/sm` via `@theme`.
  - agent-chat-ui: `--radius: 0.625rem` and maps `--radius-{sm,md,lg,xl}` via `@theme inline`.

Notes:
- Color space differs (HSL vs OKLCH). We should maintain the agent’s OKLCH set but ensure semantic names align with Supabase tokens so classes like `bg-sidebar`/`text-sidebar-foreground` behave consistently.

## Tailwind / PostCSS Plugins
- supabase-ui:
  - Declares plugins via CSS `@plugin`: `tailwindcss-animate`, `@tailwindcss/typography`.
  - PostCSS uses `"@tailwindcss/postcss"` (v4 pipeline).
- agent-chat-ui:
  - Tailwind config includes `tailwindcss-animate` and `tailwind-scrollbar` in `tailwind.config.js`.
  - PostCSS uses `"@tailwindcss/postcss"`.

Action:
- Consider adding `@tailwindcss/typography` usage to agent if needed for rich text areas, or confirm existing prose styles suffice.
- Keep a single source of truth for scrollbar styling (prefer CSS utilities in globals or Tailwind plugin, not both).

## Utilities and Global Rules
- supabase-ui defines minimal cross-browser scrollbar styling and utilities like:
  - `@utility text-balance`, `-webkit-overflow-scrolling-touch`, `touch-pan-y`, `overscroll-behavior-contain`.
  - Base layer applies `@apply border-border` and sets body/html overflow guards.
- agent-chat-ui defines:
  - Box-shadow utilities: `.shadow-inner-right`, `.shadow-inner-left`.
  - Base layer `@apply border-border outline-ring/50` and theme chart overrides per mode.

Action:
- Port minimal scrollbar styling if desired, or rely on `tailwind-scrollbar` consistently. Avoid duplication.

## Sidebar System Parity (From supabase-ui/components/ui/sidebar.tsx)
- Constants:
  - Cookie name: `sidebar_state`
  - Cookie max age: 7 days
  - Widths: `--sidebar-width` = `16rem` desktop, `18rem` mobile; icon width = `3rem`
  - Keyboard shortcut: `Cmd/Ctrl + b` toggles
- Provider behaviors:
  - Controls `open` state and mobile `openMobile`, writes cookie on change.
  - Computes `state` as `expanded` or `collapsed` and exposes via context.
- Variants and data attributes:
  - `data-variant`: `sidebar`, `floating`, `inset`
  - `data-collapsible`: `offcanvas`, `icon`, or `none`
  - `data-side`: `left` or `right`
- Transitions and motion:
  - Uses Tailwind transitions (no Framer Motion). Core transitions: `transition-[width,left,right] duration-200 ease-linear`.
  - Offcanvas calculates positions using CSS vars: `left/right: calc(var(--sidebar-width) * -1)` when collapsed.
- Structure:
  - Desktop uses a `peer` wrapper to orchestrate layout gap and a fixed sidebar container.
  - Mobile uses `Sheet` for drawer behavior (`@radix-ui` based component set).
- Interaction affordances:
  - `SidebarTrigger` button and `SidebarRail` hit area to toggle.
  - Tooltip only visible when collapsed and not mobile.

Action for agent-chat-ui (T005/T007):
- Mirror widths and timing (200ms, ease-linear) for parity unless we standardize different easing.
- Adopt `data-state` and `data-*` attributes approach to simplify styling.
- Implement cookie persistence on toggle (client-side only), maintaining existing query-state and route integrations.

## Breakpoints and Layout
- supabase-ui uses `md:` breakpoints for desktop behavior and `Sheet` for mobile.
- Supabase global theme defines `--breakpoint-toast-mobile: 600px;` for toast behavior; not required for sidebar but good reference.
- agent-chat-ui should maintain current breakpoints but ensure sidebar behaviors flip at `md:` similarly for parity.

## Differences Summary and Decisions
- Color system: Keep agent OKLCH tokens; ensure semantic mapping matches Supabase variable names.
- Plugins: Consider adding `@tailwindcss/typography` if we need consistent prose; otherwise keep current setup.
- Scrollbars: Choose either CSS global styling or `tailwind-scrollbar` plugin to avoid conflicts. Prefer plugin already in use in agent.
- Sidebar motion: Use Tailwind transitions as in Supabase instead of Framer Motion. Preserve existing streaming and artifacts logic.
- Persistence: Port cookie strategy names and max-age, behind provider or context where appropriate.

## Next Steps (Mapping to Tasks)
- T002: Establish baseline visual regression tests (Playwright or Storybook) and token snapshot before changes.
- T003: Port shared design tokens/utilities. Ensure no duplicates and align plugin usage.
- T004: Align Tailwind config/theme extensions; add any sidebar color aliases if missing.
- T005: Update sidebar layout/toggle widths/state + cookie persistence to match Supabase.
- T006–T007: Align chat canvas spacing/typography and artifact drawer sizing/transitions.
- T008: Run end-to-end validation across flows.
- T009–T010: A11y/perf and docs updates.
