---
trigger: always_on
---

# Component Usage Guidelines

## shadcn/ui Components

### Rule: Always Use shadcn CLI to Add Components

**When you need a UI component, always use the shadcn CLI to add it rather than creating it manually.**

#### Command Format
```bash
npx shadcn@latest add <component>
```

#### Examples
```bash
# Add a dialog component
npx shadcn@latest add dialog

# Add a button component
npx shadcn@latest add button

# Add a card component
npx shadcn@latest add card

# Add multiple components at once
npx shadcn@latest add dialog button card
```

#### Why This Rule?

1. **Consistency**: shadcn components follow a consistent design system and API
2. **Maintenance**: Components are kept up-to-date with the shadcn library
3. **Accessibility**: shadcn components include proper ARIA attributes and keyboard navigation
4. **Theming**: Components automatically integrate with our Tailwind theme and CSS variables
5. **Type Safety**: Components come with proper TypeScript definitions

#### Available Components

Common shadcn components include:
- `accordion`
- `alert`
- `alert-dialog`
- `avatar`
- `badge`
- `button`
- `card`
- `checkbox`
- `dialog`
- `dropdown-menu`
- `form`
- `input`
- `label`
- `popover`
- `select`
- `separator`
- `sheet`
- `skeleton`
- `slider`
- `switch`
- `table`
- `tabs`
- `textarea`
- `toast`
- `tooltip`

For a complete list, visit: https://ui.shadcn.com/docs/components

#### Integration with Our Design System

shadcn components automatically integrate with:
- Our color palette defined in `app/globals.css`
- Tailwind v4 tokens (`accent-1`, `accent-2`, `*-soft` colors)
- Dark mode via the `.dark` class
- Our animation utilities from `tailwindcss-animate`

#### When to Customize

After adding a component via CLI:
1. The component will be placed in `components/ui/`
2. You can then customize it to match specific design requirements
3. Keep customizations minimal and document them
4. Prefer using Tailwind utilities over inline styles

#### Workflow

1. Identify the component you need
2. Run `npx shadcn@latest add <component>`
3. Import and use the component in your code
4. Apply any project-specific customizations if needed

#### Don't

- ❌ Don't manually create components that exist in shadcn
- ❌ Don't copy-paste component code from the shadcn website
- ❌ Don't reinvent common UI patterns

#### Do

- ✅ Use the CLI to add components
- ✅ Customize components after adding them if needed
- ✅ Follow our styling conventions from `styling.md`
- ✅ Use our design tokens for colors and spacing
