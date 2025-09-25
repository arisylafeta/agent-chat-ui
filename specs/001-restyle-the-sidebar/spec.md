-# Feature Spec: Restyle Agent Chat Surfaces to Match Supabase UI
---

# Title

## Overview
- **Problem**
  - The current `agent-chat-ui` layout, spacing, and motion patterns differ noticeably from the refined experience in `supabase-ui`, creating a fractured user experience between the two codebases.
  - Sidebar width, chat canvas breakpoints, artifact panel transitions, and color tokens do not align, leading to inconsistent behavior and theming.
- **Goals**
  - Match the sidebar, chat surface, and artifact drawer styling (layout widths, responsive breakpoints, color system, elevation, motion) to mirror `supabase-ui`.
  - Consolidate shared styling primitives (tokens, animations, scrollbars) so that future updates remain in sync.
  - Preserve all existing chat functionality, including streaming, artifact interactions, and tooling controls.
- **Non-Goals**
  - No changes to backend APIs, data models, or authentication flows.
  - No redesign of copy, UX flows, or component information hierarchy beyond necessary visual alignment.
  - No introduction of brand-new components unless required to port existing `supabase-ui` patterns.

## User Stories
- **End user**: As a user switching between `supabase-ui` and `agent-chat-ui`, I want identical sidebar behavior and styling so I can rely on consistent navigation muscle memory.
- **Product designer**: As a designer, I want the chat canvas and artifact drawer to match the `supabase-ui` visual system so our demos feel cohesive and premium.
- **Developer**: As a developer, I want shared styling primitives so I can update colors or transitions once and have both apps stay aligned.

## Requirements
- **Functional**
  - Port the `supabase-ui` color tokens, typography scale, shadow, and radius values into `agent-chat-ui`, ensuring sidebar/chat/artifact surfaces use the same Tailwind CSS variables.
  - Align sidebar width behavior with `supabase-ui` (default width, collapsed state, animated open/close) including responsive breakpoints and cookie persistence if available.
  - Update chat canvas container to adopt the exact spacing, max-width, and scroll treatments from `supabase-ui`, including sticky header/footer gradients and scrollbar styling.
  - Mirror artifact drawer sizing, breakpoint-driven min-widths, and entry/exit animations from `supabase-ui` so open/close interactions feel identical.
  - Ensure animation timings, easing, and Framer Motion/Tailwind animate utilities match those used in `supabase-ui` components (e.g., sidebar toggle, card hover states, skeleton loading).
  - Validate that global CSS imports and plugins (e.g., `tailwindcss-animate`, typography, scrollbar rules) are applied consistently.
- **Non-Functional**
  - **Performance**: Maintain current render performance; do not introduce layout thrashing or blocking scripts. Animations should leverage GPU-friendly transforms.
  - **Accessibility**: Uphold contrast ratios, focus outlines, reduced-motion preferences, and keyboard navigation parity with `supabase-ui`.
  - **Security/Privacy**: No new data exposure; styling changes must not leak artifacts or message metadata via DOM attributes.

## API / Contracts
- **Backend endpoints / SDK events**: No changes required; styling updates must not alter request/response flows.
- **UI Messages shape**: Preserve existing message contracts and continue setting `metadata.message_id` on streamed messages.
- **Artifact interaction**: `useArtifact`, `setOpen`, and `setContext` signatures remain unchanged; only visual presentation of `ArtifactSidebar` updates.
- **Shared styling tokens**: Document any new token locations (e.g., central theme file) so both projects can reference identical values.

## Configuration
- **Env vars required (local vs production)**: None beyond existing configuration.
- **Auth mode**: No changes; continue using current auth strategy.
- **Build tools**: Ensure Tailwind config updates (if any) are reflected in `postcss.config`/`tailwind.config` without introducing environment-specific switches.

## Acceptance Criteria
- Streaming behavior matches Principle 1: Chat message rendering and optimistic updates remain unchanged while adopting new styling.
- Tool call integrity matches Principle 2: Tool call visibility toggles and transcript markers keep functioning with updated visuals.
- External UI linkage and artifact context matches Principle 3: Artifact drawer animation/state sync remains intact with new presentation.
- Multimodal constraints enforced (Principle 4): File upload affordances preserve limits and reflect new styling without regressions.
- Errors surfaced; cancel works; scroll behavior preserved (Principle 6): Toasts, cancel button, and sticky scroll helpers mirror `supabase-ui` styling without breaking behavior.
- A11y and copy-to-clipboard verified (Principle 9): Ensure focus rings, keyboard support, copy interactions, and reduced-motion respect remain consistent.
- Sidebar toggle parity: Sidebar open/close control mirrors `supabase-ui` width, motion, and persistence across reloads.
- Artifact drawer parity: Artifact panel animates and resizes identically to `supabase-ui` across breakpoints.

## QA Scenarios
- **Happy path**: Launch chat, toggle sidebar, send/receive streaming messages, open artifact drawer; verify visuals match `supabase-ui` reference.
- **Tool call with args and results**: Trigger tool execution, ensure tool call timeline styling and animation mirror `supabase-ui`.
- **Hidden messages (`do-not-render-`)**: Confirm hidden messages remain invisible and no stray spacing occurs with new layout rules.
- **Multimodal upload duplicate handling**: Upload multiple files, check drag-and-drop and preview styling align with `supabase-ui` and duplicates are handled gracefully.
- **Connection failure and toast handling**: Simulate network error, verify toast styling, placement, and dismissal animations match `supabase-ui`.
- **Reduced motion preference**: Enable prefers-reduced-motion and ensure animations diminish consistently with `supabase-ui` behavior.
- **Mobile viewport**: Validate responsive breakpoints on tablets/phones for sidebar collapse, chat canvas width, and artifact drawer overlays.
