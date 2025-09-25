---
# Tasks Template
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

## Example Tasks
- Implement endpoint configuration and setup form validation
- Ensure all tool_calls emit corresponding tool results (backend + UI)
- Add UI message wiring with `metadata.message_id` and artifact controls
- Enforce file constraints and duplicate prevention on uploads and paste
- Add toasts for error states; Cancel button; stick-to-bottom behavior
- Upgrade dependency X with compatibility check; pin versions
- Replace any accidental secret exposure; re-check env handling
- Add keyboard shortcuts and code copy behavior tests
- Verify hidden message filtering logic with `do-not-render-`
