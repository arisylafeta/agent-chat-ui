---
# Tasks: Restyle Agent Chat Surfaces to Match Supabase UI
---

## Task Categories
- Streaming & State (P1)
- Tooling Integrity (P2)
- External UI & Artifacts (P3)
- Multimodal Inputs (P4)
- Config & Auth (P5)
- Error Handling & UX (P6)
- Versioning & Deps (P7)
- Privacy & Secrets (P8)
- Accessibility (P9)
- Observability & Hygiene (P10)

## Tasks

1. **T001 [X] – Inventory Supabase UI styling and layout primitives**
   - Goal: Build a comprehensive reference for colors, typography, spacing, animations, and viewport breakpoints used in `supabase-ui` so every downstream task works from an aligned baseline.
   - Paths: `supabase-ui/app/globals.css`, `supabase-ui/components/**`, `supabase-ui/components/ui/sidebar.tsx`, `supabase-ui/components/artifact.tsx`
   - Notes: Document tokens, component-specific overrides, motion specs.
   - Dependencies: _None_

2. **T002 [P] – Author baseline visual regression & token snapshot tests**
   - Goal: Capture current `agent-chat-ui` rendering to guard against regressions while porting styles.
   - Paths: `agent-chat-ui/tests/e2e/` (create Playwright snapshots), `agent-chat-ui/src/app/globals.css`
   - Notes: Record sidebar open/closed, chat streaming, artifact drawer, and composer states. Export token snapshots to compare before/after.
   - Dependencies: T001

3. **T003 – Port shared design tokens and utilities**
   - Goal: Mirror `supabase-ui` root variables, light/dark palettes, scrollbar rules, and reduced-motion handling in `agent-chat-ui`.
   - Paths: `agent-chat-ui/src/app/globals.css`, `agent-chat-ui/postcss.config.mjs`
   - Notes: Ensure plugin imports (`@tailwindcss/typography`, `tailwindcss-animate`) match; validate no duplicate definitions remain.
   - Dependencies: T002

4. **T004 – Align Tailwind configuration and theme extensions**
   - Goal: Synchronize Tailwind theme tokens, breakpoints, and radius definitions with `supabase-ui` while preserving project-specific needs.
   - Paths: `agent-chat-ui/tailwind.config.*`
   - Notes: Reconcile existing theme extensions; add sidebar-specific color aliases and animation keyframes.
   - Dependencies: T003

5. **T005 – Match sidebar layout and motion with Supabase implementation**
   - Goal: Update sidebar width handling, toggle behavior, and cookies/persistence to mirror the `supabase-ui` Sidebar system.
   - Paths: `agent-chat-ui/src/components/thread/index.tsx`, `agent-chat-ui/src/components/ui/sidebar/*` (create/update if needed)
   - Notes: Ensure Framer Motion props, easing curves, and responsive breakpoints follow Supabase reference; preserve existing query-state integration.
   - Dependencies: T004

6. **T006 – Align chat canvas spacing, typography, and scroll affordances**
   - Goal: Bring message containers, sticky headers, gradients, and scrollbars into parity with `supabase-ui` chat components.
   - Paths: `agent-chat-ui/src/components/thread/messages/ai.tsx`, `agent-chat-ui/src/components/thread/messages/human.tsx`, `agent-chat-ui/src/components/thread/utils.ts`
   - Notes: Maintain streaming UX and hidden message filtering; adjust max-widths and padding to match reference.
   - Dependencies: T005

7. **T007 – Update artifact drawer sizing and transitions**
   - Goal: Ensure artifact sidebar uses identical breakpoint logic, min-widths, and entry/exit animations as `supabase-ui`.
   - Paths: `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`, `agent-chat-ui/src/components/thread/artifact.tsx`
   - Notes: Keep `useArtifact()` contract untouched; confirm context propagation persists after layout tweaks.
   - Dependencies: T006

8. **T008 – Run integration validation across sidebar, chat, and artifact flows**
   - Goal: Execute end-to-end checks covering streaming, tool calls, artifact opening, and file uploads with the new styling in place.
   - Paths: `agent-chat-ui/tests/e2e/` (new or updated scenarios), `supabase-ui/` reference captures for comparison
   - Notes: Compare interaction timings/animations with Supabase side-by-side; update documentation if deviations remain.
   - Dependencies: T007

9. **T009 [P] – Accessibility and performance regression audit**
   - Goal: Re-test focus states, reduced-motion preferences, and Lighthouse metrics after styling changes.
   - Paths: `agent-chat-ui/src/components/**`, QA tooling configs
   - Notes: Ensure contrast, keyboard flow, and copy-to-clipboard affordances remain compliant.
   - Dependencies: T008

10. **T010 [P] – Update documentation with shared styling guidance**
    - Goal: Capture new styling parity rules and token mappings for future contributors.
    - Paths: `agent-chat-ui/docs/artifacts.md`, new `agent-chat-ui/docs/styling-parity.md` (if needed)
    - Notes: Summarize analysis artifacts from T001 and implementation decisions; include instructions for keeping projects in sync.
    - Dependencies: T008

11. **T011 – Standardize responsive breakpoints with Supabase UI**
    - Goal: Align Tailwind breakpoints and responsive classes (e.g., `md`, `lg`) to match Supabase’s behavior across sidebar, chat, and artifact surfaces.
    - Paths: `agent-chat-ui/tailwind.config.*`, `agent-chat-ui/src/components/thread/index.tsx`, `agent-chat-ui/src/app/globals.css`
    - Notes: Ensure the desktop threshold and sidebar widths mirror Supabase (e.g., 16rem desktop width) and that layout flips occur at the same breakpoints.
    - Dependencies: T004, T005

12. **T012 – Match artifact internal padding and scroll affordances**
    - Goal: Ensure artifact header/content/footer padding and scroll behavior match Supabase, including sticky header backdrop and consistent scrollbar styling.
    - Paths: `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`, `agent-chat-ui/src/components/thread/artifact.tsx`
    - Notes: Validate long-content scenarios, maintain background tokens, and avoid double scrollbars.
    - Dependencies: T007

13. **T013 – Align artifact button styles and layout**
    - Goal: Match button sizes, variants, spacing, and icon placement in the artifact (actions, toolbar) with Supabase.
    - Paths: `agent-chat-ui/src/components/thread/artifact.tsx`, `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`, related UI button components
    - Notes: Use consistent `Button` variants and ensure focus states and accessibility labels match.
    - Dependencies: T012

14. **T014 – Full-screen mobile artifact behavior**
    - Goal: On small screens, the artifact should take the entire viewport like in Supabase, with appropriate motion and background treatment.
    - Paths: `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`
    - Notes: Disable background scrolling when open, respect safe-area insets, and ensure smooth enter/exit animations.
    - Dependencies: T012

15. **T015 [P] – Create parity E2E tests mirroring Supabase UI flows**
    - Goal: Add or adapt Playwright tests in `agent-chat-ui/tests/e2e/` that mirror `supabase-ui` authoritative flows.
    - Paths: `agent-chat-ui/tests/e2e/` (new: `artifact-parity.spec.ts`, `chat-parity.spec.ts`), reference: `supabase-ui/tests/e2e/chat.test.ts`, `supabase-ui/tests/e2e/session.test.ts`, `supabase-ui/tests/e2e/artifacts.test.ts`, `supabase-ui/tests/e2e/reasoning.test.ts`
    - Notes: Cover new chat creation, streaming, artifact open/close, follow-up messaging while artifact is open, and sidebar toggling/persistence.
    - Dependencies: T007, T011, T012, T014

16. **T016 – Enforce artifact overlay width rules (desktop + sidebar-aware)**
    - Goal: Ensure left column is fixed to 400px and right panel width equals `viewportWidth - 400px`; reduce background filler width by 256px (16rem) when the app sidebar is open.
    - Paths: `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`, `agent-chat-ui/src/components/thread/index.tsx`
    - Notes: Acceptance via T015 parity tests and visual measurement assertions.
    - Dependencies: T007, T011

17. **T017 [P] – Implement open-from-bounding-box animation origin**
    - Goal: Capture clicked preview rect and animate overlay from that bounding box to final layout (desktop/mobile).
    - Paths: `agent-chat-ui/src/components/thread/messages/ai.tsx`, `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`
    - Notes: Align with Supabase behavior (`supabase-ui/components/document-preview.tsx` bounding box capture). Add unit/E2E checks for initial geometry.
    - Dependencies: T007

18. **T018 [P] – Sidebar-aware background filler width logic**
    - Goal: When sidebar is open, initialize/exit overlay background width to `windowWidth - 256`; otherwise `windowWidth`.
    - Paths: `agent-chat-ui/src/components/thread/index.tsx`, `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`
    - Notes: Keep motion timings/easing aligned with Supabase. Add tests to verify width deltas with sidebar toggled.
    - Dependencies: T005, T007, T011

19. **T019 [P] – Visual regression snapshots for artifact overlay**
    - Goal: Record snapshots for desktop (two-panel) and mobile (full-screen) artifact overlay; compare against Supabase reference.
    - Paths: `agent-chat-ui/tests/e2e/` snapshots; reference captures from `supabase-ui`.
    - Notes: Validate fixed 400px left column, right panel fill, background filler width with sidebar open, and animation end-states.
    - Dependencies: T016, T015

## Parallel Execution Guidance
- **Group A (post-T008)**: Run `task-agent run --task T009` and `task-agent run --task T010` in parallel once integration validation passes; they touch independent deliverables (QA audits vs. documentation).
- **Baseline Tests**: `task-agent run --task T002` can execute concurrently with any documentation prep that does not modify styling code, but must complete before T003 begins to ensure snapshots exist.
- **Group B (parity and visuals, after implementation wiring)**: Once T007/T011/T012/T014 complete, run in parallel:
  - `task-agent run --task T015`
  - `task-agent run --task T017`
  - `task-agent run --task T018`
  - `task-agent run --task T019`
  These validate animation origin, sidebar-aware widths, and parity flows without overlapping code paths.

## Dependency Notes
- Critical path (extended): T001 → T002 → T003 → T004 → T011 → T005 → T006 → T007 → T012 → T013 → T014 → T016 → T015 → T008.
- T017, T018, and T019 can run in parallel with T015/T016 once core overlay and sidebar logic are wired (T007/T011/T012/T014).
- T009 and T010 depend on successful integration validation (T008) but can proceed concurrently thereafter.
