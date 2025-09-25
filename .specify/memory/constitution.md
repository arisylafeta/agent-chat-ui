<!--
Sync Impact Report
- Version change: none → 1.0.0
- Modified principles: N/A (initial adoption)
- Added sections: Principles (1–10), Governance, Scope and Terminology
- Removed sections: None
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md
  ✅ .specify/templates/spec-template.md
  ✅ .specify/templates/tasks-template.md
  ✅ .specify/templates/commands/constitution.md
- Follow-up TODOs:
  - Set RATIFICATION_DATE (currently TODO)
-->

# Agent Chat UI Constitution

- Constitution Version: 1.0.0
- Ratification Date: TODO
- Last Amended Date: 2025-09-24
- Project Name: Agent Chat UI

## Scope and Terminology
- Agent Chat UI: Next.js 15 application located at `agent-chat-ui/` that connects to LangGraph servers using `@langchain/langgraph-sdk` and renders chat, tool calls, and artifact side panels.
- Backend: Any LangGraph deployment the UI connects to.
- UI Message: Events compatible with `@langchain/langgraph-sdk/react-ui` rendered via `LoadExternalComponent`.
- Artifact: Side panel content opened via `useArtifact()` and displayed by `ArtifactSidebar`.

## Principles

1) Streaming Graph Compatibility
- MUST connect to LangGraph servers that expose a `messages` key in state and support streaming (`/threads/*`, `/sessions`, `/info`).
- MUST use `useStream` from `@langchain/langgraph-sdk/react` with `onCustomEvent` to handle UI messages (see `src/providers/Stream.tsx`).
- MUST preserve thread continuity using `threadId` from URL params and SDK callbacks.
- SHOULD fetch state history when available to render prior messages consistently.
- Rationale: Guarantees real-time UX and compatible state transitions with LangGraph servers.

2) Tool Call Integrity and Visibility
- MUST ensure each AI `tool_call` has a corresponding tool result (`ToolMessage`) with a matching `tool_call_id`.
- MUST treat UI-injected tool results as a fallback only. The UI currently auto-injects hidden placeholder tool results when missing (see `src/lib/ensure-tool-responses.ts`) but the backend SHOULD emit proper tool results for correctness.
- MUST allow users to hide tool calls via the `hideToolCalls` query state toggle.
- MUST filter out any message whose `id` starts with `do-not-render-` and MAY respect the `langsmith:do-not-render` tag.
- Rationale: Keeps conversation consistent and auditable while supporting developer control of visibility.

3) External UI and Artifact Contract
- MUST render backend-provided UI components using `LoadExternalComponent` and pass `meta={{ ui, artifact }}` (see `src/components/thread/messages/ai.tsx`).
- MUST set `metadata.message_id` on UI messages to the related AI message `id`; the UI filters render scope by this field.
- MUST provide `useArtifact()` to external components so they can `setOpen(true)` and optionally `setContext(...)`; context MUST be included in the next `stream.submit` request (see `src/components/thread/index.tsx`).
- Rationale: Enables rich, controllable side-panel experiences tied to specific messages.

4) Multimodal Input Constraints
- MUST accept only JPEG/PNG/GIF/WEBP images and PDFs in the composer (see `src/hooks/use-file-upload.tsx`).
- MUST reject duplicates within a single message by filename and MIME type.
- MUST support paste and drag-and-drop for the allowed types.
- Rationale: Ensures predictable handling of inputs and prevents redundant uploads.

5) Configuration, Environments, and Authentication
- MUST support local development defaults: `http://localhost:2024` and assistant ID `agent` via the setup form (see `StreamProvider`).
- MUST support environment-variable overrides for `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ASSISTANT_ID`.
- SHOULD use API Passthrough in production with `LANGGRAPH_API_URL`, `NEXT_PUBLIC_API_URL` (proxy URL), and server-side `LANGSMITH_API_KEY`.
- MAY implement custom auth; if so, `useTypedStream` MUST set `defaultHeaders` with the token and the client MUST point `NEXT_PUBLIC_API_URL` directly to the deployment.
- Rationale: Provides a secure and scalable path from local testing to production.

6) Error Handling and UX
- MUST surface connection failures via toasts (see `checkGraphStatus` and `sonner`).
- MUST provide cancel control during streaming.
- SHOULD maintain scroll-to-bottom affordances and not auto-scroll when user is reviewing older content.
- Rationale: Improves resilience and user trust.

7) Versioning and Dependencies
- MUST target Next.js ^15.2, React ^19, TypeScript ~5.7; Tailwind ^4.x (see `package.json`).
- MUST manage packages with `pnpm` and keep lockfiles consistent.
- SHOULD avoid breaking upgrades without a compatibility check in a feature branch.
- Rationale: Keeps the UI stable while allowing modern features.

8) Privacy and Secrets
- MUST store the LangSmith API key only in browser localStorage under `lg:chat:apiKey` when entered by the user; MUST NOT expose secrets with `NEXT_PUBLIC_`.
- Rationale: Minimizes the risk of accidental key disclosure.

9) Accessibility and Interaction
- SHOULD support keyboard submit (Enter in composer; Ctrl/Cmd+Enter in edit), sensible focus states, and readable contrasts.
- SHOULD provide copy-to-clipboard on code blocks and accessible buttons/labels (see `markdown-text.tsx`).
- Rationale: Inclusive UX and developer ergonomics.

10) Observability and Message Hygiene
- MAY use tags like `langsmith:nostream` to suppress streaming when needed.
- MUST maintain message consistency between stream-time and final saved state; hidden stream messages MUST remain hidden after state updates if `do-not-render-` prefix is used.
- Rationale: Predictable display rules reduce debugging overhead.

## Governance
- Amendment Procedure: Propose changes via PR; require at least one maintainer approval. Major breaking policy changes require two approvals.
- Versioning Policy: 
  - MAJOR: Backward incompatible rule removals or redefinitions.
  - MINOR: New principles or materially expanded guidance.
  - PATCH: Clarifications or non-semantic edits.
- Compliance Reviews: 
  - At minimum before each tagged release and quarterly. Validate against Principles 1–10 with a short report checked into `.specify/memory/`.
- Exception Requests: Document rationale and scope in PR description; include sunset date or review trigger.

## References (source of truth in repo)
- Chat layout: `src/components/thread/index.tsx`
- Assistant message rendering: `src/components/thread/messages/ai.tsx`
- Human message rendering: `src/components/thread/messages/human.tsx`
- Tool calls rendering: `src/components/thread/messages/tool-calls.tsx`
- Artifact provider and sidebar: `src/components/thread/artifact.tsx`, `src/components/thread/artifact-sidebar.tsx`
- Stream provider and connection form: `src/providers/Stream.tsx`
- Threads provider and client: `src/providers/Thread.tsx`, `src/providers/client.ts`
- Multimodal upload: `src/hooks/use-file-upload.tsx`
- Markdown rendering: `src/components/thread/markdown-text.tsx`
- Tool-call fallback: `src/lib/ensure-tool-responses.ts`
- Docs: `README.md`, `docs/artifacts.md`
