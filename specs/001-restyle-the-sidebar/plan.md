---
# Plan Template
---

# Restyle Agent Chat Surfaces to Match Supabase UI

## Summary
Align `agent-chat-ui` sidebar, chat canvas, and artifact panel styling and motion with the reference implementation in `supabase-ui`. Specifically, mirror the artifact overlay’s two-panel desktop layout (400px left column + right panel filling the remaining width), full-screen mobile behavior, sidebar width interactions, and the open/close animation that expands from the inline preview’s bounding box. Preserve all existing functionality (streaming, tool calls, artifact editing) while achieving visual and behavioral parity.

## Context
- Link to spec: `/Users/admin/Desktop/AI/Reoutfit/prototype/agent-chat-ui/specs/001-restyle-the-sidebar/spec.md`
- Link to tasks: `/Users/admin/Desktop/AI/Reoutfit/prototype/agent-chat-ui/specs/001-restyle-the-sidebar/tasks.md`
- Supabase UI reference (how width is managed when an artifact opens):
  - `supabase-ui/components/artifact.tsx`
    - Desktop: two-panels. Left column fixed `w-[400px]`; right panel animates with `x: 400` and `width: windowWidth - 400`, `height: windowHeight`. See `motion.div` animate/initial/exit blocks.
    - Background filler respects app sidebar: initial/exit width uses `isSidebarOpen ? windowWidth - 256 : windowWidth` (256px = 16rem sidebar default).
    - Mobile: full-screen artifact viewer (no 400px column). Animate to `x: 0`, `width: windowWidth`, `height: windowHeight`.
  - `supabase-ui/components/document-preview.tsx`
    - Clicking a preview captures its DOM rect and stores `artifact.boundingBox` for the opening animation origin.
  - `supabase-ui/components/ui/sidebar.tsx`
    - Sidebar width tokens: `SIDEBAR_WIDTH = "16rem"` (256px), `SIDEBAR_WIDTH_MOBILE = "18rem"`. Mobile sidebar presented via `Sheet`.
  - `supabase-ui/app/globals.css`
    - Tailwind v4, tokens, and overflow rules that prevent horizontal scroll during animations.
- Target adaptation points in Agent Chat UI:
  - `agent-chat-ui/src/components/thread/artifact-sidebar.tsx`
  - `agent-chat-ui/src/components/thread/index.tsx`
  - `agent-chat-ui/src/components/thread/messages/ai.tsx`
  - Global styles and any width tokens that govern sidebar and panel sizing.

### Rough line references (supabase-ui)
  - `supabase-ui/components/artifact.tsx`
    - Overlay container and z-index: L266–272
    - Background filler width with sidebar awareness: L273–285 (uses 256px when sidebar open)
    - Left column width 400px: L288–301 (see `w-[400px]` at ~L301)
    - Right panel final geometry (desktop): L354–389 (`x: 400`, `width: windowWidth - 400`, `height: windowHeight`)
    - Panel container props: L390–419
    - Mobile full-screen geometry: L356–371
  - `supabase-ui/components/document-preview.tsx`
    - Bounding box capture effect: L45–59
    - Click hitbox bounding box and open: L157–179 (see also 183–196 wrapper)
  - `supabase-ui/components/ui/sidebar.tsx`
    - Width constants: L28–33 (`SIDEBAR_WIDTH = "16rem"` → 256px; `SIDEBAR_WIDTH_MOBILE = "18rem"`)
  - `supabase-ui/app/globals.css`
    - Prevent horizontal overflow during animation: L194–207 (`body`/`html` overflow-x rules)
  - `supabase-ui/hooks/use-mobile.ts`
    - Mobile breakpoint (768px): L3, L8–15

### Technical Context (from analysis)
- Desktop behavior:
  - Left column: fixed width 400px (`w-[400px]`).
  - Right panel width: `viewportWidth - 400px` via Framer Motion animated style; height = `viewportHeight`.
  - Overlay background width initialization/exit accounts for app sidebar. If sidebar is open, base width is `windowWidth - 256` (256px = 16rem default from `Sidebar`), else `windowWidth`.
- Mobile behavior (< 768px):
  - Single full-screen artifact viewer (`x: 0`, `width: windowWidth`, `height: windowHeight`, `borderRadius: 0`).
- Open animation origin:
  - `artifact.boundingBox` captured from the clicked inline preview (`getBoundingClientRect()`), used as the `initial` x/y/width/height of the overlay; animates to the final layout.
- Responsiveness and state:
  - `useWindowSize()` provides `windowWidth`/`windowHeight`.
  - `isMobile = windowWidth < 768` gates the desktop vs mobile layouts.

## Work Breakdown
- Milestone 1: Establish width tokens and responsive breakpoints
  - Mirror sidebar width tokens: 16rem (256px) desktop default; verify mobile variant parity.
  - Ensure global CSS prevents horizontal overflow during overlay animations.
  - Audit `agent-chat-ui` for any conflicting width utilities or container max-widths.

- Milestone 2: Implement artifact overlay layout and animation
  - Desktop: Introduce two-panel overlay within `ArtifactSidebar` or equivalent:
    - Left column: fixed 400px, contains artifact-specific chat/messages + composer (like `supabase-ui` left column).
    - Right panel: animated to `x: 400`, width = `viewportWidth - 400`, height = `viewportHeight`.
  - Mobile: Full-screen artifact panel; no left 400px column.
  - Respect app sidebar width in background filler (initialize/exit width reduced by 256px when sidebar open) for seamless integration.
  - Use the clicked preview’s bounding box as the animation origin when opening.

- Milestone 3: Wire responsive detection and state
  - Use `useWindowSize()` (or equivalent) to derive `windowWidth/windowHeight` and compute `isMobile` at 768px.
  - Ensure sidebar open/closed state is accessible to artifact overlay to adjust background base width.

- Milestone 4: QA and parity validation
  - Compare behavior against `supabase-ui` across desktop and mobile viewports.
  - Validate streaming, tool calls, version footer/toolbar visibility, and scroll affordances under the new layout.
  - Confirm no regressions in message rendering, input, or artifact editing.

## Verification Tasks
- Ensure styling parity with supabase-ui artifact overlay
  - Desktop: Verify left column fixed at 400px and right panel width equals `viewportWidth - 400px`. Confirm background filler width reduces by 256px when the app sidebar is open.
  - Mobile: Verify the artifact viewer occupies the full viewport with `x: 0`, `width: windowWidth`, `height: windowHeight` and no stray border radii.
  - Check that open animation originates from the inline preview’s bounding box in agent-chat-ui (matching supabase-ui’s `artifact.boundingBox` behavior).

- Cross-project test parity (must pass in both repos)
  - Reference supabase-ui tests:
    - `supabase-ui/tests/e2e/chat.test.ts`
    - `supabase-ui/tests/e2e/session.test.ts`
    - `supabase-ui/tests/e2e/artifacts.test.ts` (currently `test.fixme()` sections but flows are authoritative)
    - `supabase-ui/tests/e2e/reasoning.test.ts`
  - Create or adapt equivalent tests under `agent-chat-ui/tests/e2e/` to cover:
    - New chat creation, sending messages, streaming behavior
    - Artifact creation, open/close, and follow-up messaging while artifact is open
    - Sidebar toggling and persistence across reloads
  - Acceptance: The equivalent scenarios should pass in both `supabase-ui` and `agent-chat-ui` after styling alignment.

- Visual parity checklist
  - Compare spacing, font sizes, scrollbars, and sticky header/footer treatments between apps.
  - Confirm Tailwind plugin parity and global token usage.

## Constitution Check
- Principle 1 (Streaming Graph Compatibility): Streaming paths unchanged; overlay refactor is presentational only. Maintain existing stream handlers.
- Principle 2 (Tool Call Integrity): No changes to tool_call/result pairing. Maintain message hygiene and fallback logic as-is.
- Principle 3 (External UI & Artifacts): Preserve `useArtifact()` contract and metadata flows; ensure overlay continues to include artifact context on submit.
- Principle 4 (Multimodal Constraints): Preserve file-type and duplicate checks; no changes to upload logic.
- Principle 5 (Config & Auth): No new envs required; honor existing auth/config behavior.
- Principle 6 (Error Handling & UX): Preserve toasts, cancel, scroll affordances; verify parity under new overlay.
- Principle 7 (Versioning & Deps): Tailwind/Framer Motion already in use; avoid breaking upgrades.
- Principle 8 (Privacy & Secrets): No secrets added; no `NEXT_PUBLIC_` leaks.
- Principle 9 (Accessibility): Maintain focus outlines, reduced-motion handling, keyboard navigation within overlay.
- Principle 10 (Observability): Maintain message consistency and filtering rules.

## Risks / Mitigations
- Breakpoint drift between apps → Document and centralize the 768px threshold and 400px/256px constants; add visual tests.
- Layout regressions (scroll/overflow) → Validate globals (no horizontal overflow), add E2E for open/close and scroll behavior.
- Sidebar state desync → Source sidebar open/closed state from a single provider; add unit tests around width calc.

## Rollout
- Branch: `001-restyle-the-sidebar`. Gated behind feature branch and PR review.
- Monitoring: Visual QA across devices; run E2E covering artifact open/close, streaming, and sidebar toggling.
- Rollback: Revert overlay layout changes if regressions appear; changes are isolated to presentational layers for safe revert.
