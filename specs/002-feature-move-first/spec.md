# Move-first: Inline Essay Artifact Editing (Hosted Copilot)

## Overview
- Goal: Provide an inline essay artifact that users can edit in place, powered by a hosted Copilot experience.
- Why: Faster iteration, reliable streaming, and lower infra overhead than the bespoke Writer path.
- Out of scope: Non-essay artifacts; non-hosted/self-hosted runtime changes; unrelated UI polish.

## User Stories
- As a user, I can edit the AI-generated essay inline (title and body), and my changes are reflected in the active conversation without losing context.
- As a user, I can see the essay streaming and updating as it’s generated, and I can continue to make edits after generation completes.
- As a product owner, I can enable/disable the hosted Copilot experience without impacting the legacy flow.

## Requirements
- Functional
  - Users can modify the essay (title, content) inline within the conversation view.
  - The essay remains associated with its originating assistant message/conversation.
  - Updates to the essay are reflected in shared state and re-streamed to the specific UI component.
  - The experience continues to work if the hosted path is disabled (fallback to legacy behavior).
  - Basic controls: edit, save/apply, cancel (discard pending edits).
- Non-Functional
  - Performance: initial preview target ≤ 2s; final content target ≤ 30s (normal conditions).
  - Accessibility: inline editor operable via keyboard and screen readers.
  - Security/Privacy: comply with org policies; display notice when hosted processing is used.

## API / Contracts
- Shared state representation for essay artifact: `{ id, message_id, title, content, updated_at }`.
- Association: `message_id` must tie the artifact to the correct assistant message.
- Events: essay.created, essay.updated (streamed); client sends user edits which are acknowledged and reflected in state.

## Configuration
- Feature flag to enable hosted Copilot path.
- Environment variables for hosted runtime keys and any required headers.

## Acceptance Criteria
- When enabled, essay artifacts render inline, stream progressively, and remain editable.
- Editing updates are persisted and re-streamed to the correct artifact instance (no cross-thread leakage).
- Disabling the hosted path restores legacy behavior with no loss of context.
- A11y checks pass (keyboard, labels, focus management) for the inline editor.
- Clear notice shown when hosted processing is active.

## QA Scenarios
- Happy path: generate essay, stream updates, edit title/body, save, verify persistence and re-render.
- Toggle off hosted path mid-session: verify graceful fallback with state preserved.
- Association integrity: multiple conversations with simultaneous essays do not cross-link.
- Failure modes: hosted outage/not authorized → user notified; edits queued or blocked per policy.
