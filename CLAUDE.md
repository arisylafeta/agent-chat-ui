# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reoutfit is a Next.js 15 application for AI-powered fashion styling and shopping. Built on top of LangGraph agent chat UI, it extends the chat interface with features like wardrobe management, virtual try-on studio, and lookbook creation. Uses Supabase for authentication and data persistence, with LangGraph for agent orchestration.

## Common Commands

### Development
```bash
pnpm dev          # Start development server on localhost:3000
pnpm build        # Create production build
pnpm start        # Run production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors automatically
pnpm format       # Format code with Prettier
pnpm format:check # Check code formatting
```

### Testing
```bash
pnpm test:e2e           # Run Playwright e2e tests
pnpm test:update        # Update Playwright snapshots
pnpm test:ui            # Open Playwright UI mode
```

## Architecture

### Core Provider Hierarchy

The application uses a nested provider structure that must be maintained (from root to leaf):

1. **ThemeProvider** - Dark/light mode theming
2. **NuqsAdapter** - URL state management (nuqs library)
3. **SidebarProvider** (`providers/Sidebar.tsx`) - Sidebar state and thread management
4. **StudioProvider** (`providers/studio-provider.tsx`) - Virtual try-on studio state
5. **StreamProvider** (`providers/Stream.tsx`) - LangGraph streaming connection

**Critical**: `StreamProvider` handles LangGraph communication and must have access to Supabase auth context. It uses `useStream` from `@langchain/langgraph-sdk/react` and automatically:
- Injects Supabase access tokens as Bearer auth headers
- Creates new threads and navigates to `/chat/[threadId]`
- Manages thread lifecycle with 4s delay for thread metadata propagation
- Validates LangGraph server connection on mount

### Key Application Areas

#### Chat Interface (`app/(chat)/`)
- Main conversational UI for fashion agent
- Uses LangGraph streaming with custom UI message reducers
- Supports multimodal input (text + images via file upload)
- Message hiding via `langsmith:nostream` tag and `do-not-render-` prefix on message IDs
- Thread persistence and search via Supabase

#### Virtual Try-On Studio (`app/studio/`, `providers/studio-provider.tsx`)
- Dedicated workspace for outfit composition
- Artifact-based architecture: renders in side panel next to chat
- Product selection from wardrobe, shopping results, or previous looks (max 6 items)
- Responsive layout: vertical right panel (desktop) vs bottom drawer (mobile)
- Generate/save/download/share/remix workflows
- Uses `thread.meta.artifact` for cross-component state management

#### Wardrobe Management (`app/wardrobe/`, `hooks/use-wardrobe.ts`)
- User's saved clothing items stored in Supabase
- Category-based organization (tops, bottoms, shoes, accessories, etc.)
- Image upload with Gemini AI auto-enhancement
- Integration with studio for outfit composition

#### Lookbook System (`app/lookbook/`, `types/lookbook.ts`)
- Collection of saved outfit "looks"
- Each look contains generated try-on image + product references
- Shopping integration: track which looks led to purchases
- Uses Supabase storage for generated images

### Database Architecture (Supabase)

Key tables:
- **Authentication**: Handled by Supabase Auth with RLS policies
- **Threads**: Chat conversation metadata with user ownership
- **Wardrobe**: User's clothing items with images and metadata
- **Lookbooks**: Collections of generated outfit looks
- **searchable_messages**: Materialized view for chat search (refresh via `refresh_searchable_messages` RPC)

All data access uses Row Level Security (RLS) to scope by authenticated user.

### Path Aliases

TypeScript paths configured in `tsconfig.json`:
```typescript
"@/*" maps to "./*"
```

Examples:
- `@/components/ui/button` → `components/ui/button`
- `@/lib/db/search` → `lib/db/search`
- `@/hooks/use-wardrobe` → `hooks/use-wardrobe`

### Artifact System

Artifacts render content in a side panel (desktop) or modal (mobile) next to the chat. Access via `useArtifact()` hook (see README.md lines 128-154 for implementation details).

Pattern:
```tsx
const [Artifact, { open, setOpen, context, setContext }] = useArtifact();
// Use setContext to pass data to artifact
// Use Artifact component to render content
```

The studio feature heavily uses this pattern via `thread.meta.artifact`.

## Environment Variables

Required environment variables (see `.env.example`):

### Core Services
- `NEXT_PUBLIC_API_URL` - LangGraph server URL (default: http://localhost:8000)
- `NEXT_PUBLIC_ASSISTANT_ID` - LangGraph assistant/graph ID (default: agent)

### Supabase (Required for auth + data persistence)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### AI Services
- `GEMINI_API_KEY` - Google Gemini for wardrobe image enhancement (server-side only)

### Analytics (Optional)
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL
- `NEXT_PUBLIC_CLARITY_ID` - Microsoft Clarity

### Sentry (Optional)
- `LANGSMITH_API_KEY` - For LangGraph production deployments (server-side only, no NEXT_PUBLIC_ prefix)

**Important**: Never prefix server-side secrets with `NEXT_PUBLIC_` as they will be exposed to the client.

## Code Style & Conventions

### React Patterns
- Use `'use client'` directive for client components (required for hooks, context, interactivity)
- Server actions in `lib/db/*.ts` use `"use server"` directive
- Prefer functional components with TypeScript
- Use custom hooks in `hooks/` for shared logic

### Type Definitions
- Shared types in `types/` directory (lookbook, wardrobe, studio)
- Database types in `lib/db/*-types.ts` and `lib/db/*-validation.ts`
- LangGraph message types from `@langchain/langgraph-sdk`

### Styling
- Tailwind CSS v4 with custom configuration
- shadcn/ui components in `components/ui/`
- Responsive design: mobile-first with breakpoints (sm, md, lg, xl)
- Dark mode support via `next-themes`

### State Management
- React Context for global state (providers)
- `nuqs` for URL-based state (search params)
- LangGraph SDK for streaming state
- No external state management library (Redux, Zustand, etc.)

## LangGraph Integration

### Authentication Methods

This app supports two LangGraph authentication patterns:

1. **Development (default)**: Direct client → LangGraph connection with no auth
2. **Production**: Supabase access token as Bearer token in headers

Current implementation uses Supabase auth tokens injected in `StreamProvider` (see `providers/Stream.tsx:89-92`).

### Message Visibility Control

Hide streaming messages during LLM call:
```python
model = ChatAnthropic().with_config(config={"tags": ["langsmith:nostream"]})
```

Hide messages permanently in UI:
```python
result = model.invoke([messages])
result.id = f"do-not-render-{result.id}"
return {"messages": [result]}
```

### Custom Events & UI Messages

The stream handles custom events via `onCustomEvent` callback to update UI state with `uiMessageReducer`. Used for real-time artifact updates and tool call visualization.

## Key Hooks

- `useStreamContext()` - Access LangGraph stream (thread, messages, submit, etc.)
- `useThreads()` - Thread list management and current thread state
- `useWardrobe()` - Wardrobe CRUD operations
- `useLookbook()` / `useLookbooks()` - Lookbook management
- `useArtifact()` - Artifact panel state and rendering
- `useChatSidebar()` - Sidebar state (open/close, mobile handling)
- `useStudioContext()` - Studio state (selected products, active look)

## Feature Specs

Feature specifications live in `specs/` directory with detailed plans, API contracts, and data models. Reference these when modifying or extending features:

- `specs/001-wardrobe-management-feature/` - Wardrobe system
- `specs/003-studio-feature-for/` - Virtual try-on studio

Each spec includes:
- `spec.md` - Requirements and user stories
- `plan.md` - Implementation approach
- `contracts/` - API contracts and interfaces
- `tasks.md` - Development task breakdown

## Testing

Playwright e2e tests in `tests/e2e/`. Config in `playwright.config.ts`:
- Base URL: http://localhost:3000
- Test directory: `./tests/e2e`
- Auto-starts dev server before tests
- Chromium only by default
- Uses `.env.local` for environment variables

## Monitoring & Analytics

- **Sentry**: Error tracking and performance monitoring (see `sentry.*.config.ts`, `instrumentation*.ts`)
- **PostHog**: Product analytics with event tracking (proxied through `/ingest/*` routes)
- **Microsoft Clarity**: Session recordings and heatmaps

Sentry tunnel route: `/monitoring` (see `next.config.mjs:78`)

## Special Considerations

### Middleware Authentication
`middleware.ts` uses Supabase session management via `updateSession()`. Excludes:
- Static assets, images
- Auth callback routes (`/auth/*`)
- Login/signup/error pages
- Share pages (public)
- API routes (handle their own auth)

### Performance Optimizations
- Package imports optimized: `lucide-react`, `@supabase/supabase-js` (see `next.config.mjs:9`)
- Webpack cache tuning for development speed
- Incremental TypeScript compilation
- Image optimization for Supabase storage URLs

### Thread Management Race Condition
When creating new threads, there's a 4-second delay before fetching updated thread list to allow LangGraph backend to propagate metadata (see `providers/Stream.tsx:113-122`). Do not remove this delay.

### Navigation During Streaming
Uses `router.replace()` instead of `router.push()` when navigating from `/` to `/chat/[threadId]` to avoid breaking the active stream (same layout, providers persist).
