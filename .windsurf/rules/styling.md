---
trigger: manual
---

---
trigger: manual
summary: Project-wide styling rules for agent-chat-ui
---

# Styling Rules and Conventions

This document defines the design system and styling conventions for `agent-chat-ui/`.


## Color Palette

Defined in `app/globals.css` as CSS variables and exposed as Tailwind v4 tokens via `@theme inline`.

- Brand neutrals
  - black-soft: near-black, easier on eyes than pure black
  - white-soft: near-white, easier on eyes than pure white
  - gray-soft: light gray (like white/50)
- Accents
  - accent-1: #BDAFD9
  - accent-2: #A08CC9

Usage with Tailwind utilities (v4 tokens):

- Background: `bg-white-soft`, `bg-gray-soft`, `bg-black-soft`, `bg-accent-1`, `bg-accent-2`
- Text: `text-white-soft`, `text-black-soft`, `text-accent-1`, `text-accent-2`
- Border: `border-white-soft`, `border-gray-soft`, `border-accent-1`, `border-accent-2`
- Hover/focus: `hover:bg-gray-soft`, `focus-visible:ring-accent-2`, etc.

Do/Don't:
- Do use the Tailwind tokens rather than raw hex or ad-hoc colors in components.
- Don’t hardcode `bg-white` or `#fff` — prefer `bg-white-soft`.
- Prefer semantic aliases (e.g. `text-foreground`, `bg-background`) where appropriate for theme alignment.


## TailwindCSS Setup and Usage

We are using Tailwind v4-style features via `@import "tailwindcss"` and `@theme inline` in `app/globals.css`.

- Global definitions live in `app/globals.css` under `:root` and `.dark`.
- Design tokens are exposed with `--color-` names inside `@theme inline` and become Tailwind utilities automatically.
- Add utilities using `@utility` blocks in `app/globals.css`.
- We also use `@plugin` for `tailwindcss-animate` and `@tailwindcss/typography`.

Editor warnings:
- If you see "Unknown at rule @plugin/@theme/@utility/@apply", that is the editor CSS linter not understanding Tailwind v4 syntax. Install the Tailwind CSS IntelliSense extension or configure CSS validation to ignore Tailwind at-rules for a clean experience.

If a `tailwind.config.js` is present (legacy/v3 style), ensure `content` includes Next.js directories to avoid purging issues:

```js
// tailwind.config.js (if kept)
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./providers/**/*.{ts,tsx,js,jsx,mdx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  // ...
};
```


## Next.js Conventions

- App Router architecture (`app/` directory) with global styles in `app/globals.css`.
- Keep `globals.css` for tokens, base layers, and shared utilities only; prefer component-level classes for per-component styles.
- Use CSS variables for theming (`:root` and `.dark`) and consume via Tailwind tokens.
- Prefer semantic colors (`bg-background`, `text-foreground`) for general layout areas; use brand tokens (`*-soft`, `accent-*`) for specific UI elements.
- Co-locate UI components under `components/` and avoid component-scoped CSS files unless necessary.


## Buttons and Interactive Elements

- Use the shared `Button` component under `components/ui/button`.
- Accent usage examples:
  - Primary emphasis border: `border-accent-2`
  - Ghost/soft hover: `hover:bg-gray-soft`
  - Focus ring: `focus-visible:ring-accent-2`


## Accessibility

- Maintain at least AA contrast for text. When using `accent-1`/`accent-2` backgrounds, choose appropriate foreground (`text-black-soft` or `text-white-soft`) depending on context.
- Always include `focus-visible` styles, ideally rings tied to `accent-2`.


## Preferred Package Manager: pnpm

- Always use pnpm for installs and scripts.
- Commands:
  - Install: `pnpm install`
  - Dev: `pnpm dev`
  - Build: `pnpm build`
  - Lint: `pnpm lint`
  - Test (if present): `pnpm test`
- Ensure the project `package.json` includes the package manager field, e.g.:

```json
{
  "packageManager": "pnpm@9"
}
```


## General Rules

- Do not commit raw hex colors in JSX/TSX. Prefer Tailwind tokens or `var(--token)` if needed in CSS.
- Keep radius variables and spacing scale consistent with tokens defined in `@theme inline`.
- Use `dark` class on `<html>` to enable dark theme. Manage theme toggling at the app level.
- Avoid inline styles for colors; prefer class utilities for consistency and purge safety.


## How to Add a New Design Token

1. Define CSS variable in `:root` (and in `.dark` if different) in `app/globals.css`.
2. Expose it under `@theme inline` as `--color-<name>: var(--my-var);`
3. Use via Tailwind: `bg-<name>`, `text-<name>`, `border-<name>`, etc.


## Migration Notes

- Existing hardcoded `bg-white` references have been updated to `bg-white-soft` in:
  - `components/chat/index.tsx`
  - `components/agent-inbox/components/thread-actions-view.tsx`
  - `components/artifact/writer/index.tsx`
- Continue migrating any remaining hardcoded color utilities to the new tokens.
