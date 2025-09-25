---
# Plan Template
---

# Plan Title

## Summary
Briefly describe the goal of this plan and the target outcome.

## Context
- Link to spec
- Link to tasks
- Link to relevant code: paths, components, providers

## Work Breakdown
- Milestone 1: ...
- Milestone 2: ...
- Milestone 3: ...

## Constitution Check
- Principle 1 (Streaming Graph Compatibility): How is streaming/state continuity maintained?
- Principle 2 (Tool Call Integrity): Do tool_calls have matching tool results? Any reliance on fallback injection removed?
- Principle 3 (External UI & Artifacts): Are UI messages scoped with metadata.message_id and artifact context passed back on submit?
- Principle 4 (Multimodal Constraints): Are supported file types and duplicate blockers preserved?
- Principle 5 (Config & Auth): Are env vars and auth mode correctly set for the target environment?
- Principle 6 (Error Handling & UX): Are toasts, cancel, and scroll affordances addressed?
- Principle 7 (Versioning & Deps): Do changes respect supported versions and package management?
- Principle 8 (Privacy & Secrets): Are secrets handled safely? No `NEXT_PUBLIC_` leaks.
- Principle 9 (Accessibility): Keyboard paths and contrast preserved/enhanced?
- Principle 10 (Observability): Message hygiene guarantees upheld?

## Risks / Mitigations
- Risk A → Mitigation
- Risk B → Mitigation

## Rollout
- Experiment/flagging
- Monitoring and rollback steps
