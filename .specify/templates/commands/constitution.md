---
# Constitution Command Notes
---

This command updates `.specify/memory/constitution.md` and propagates changes across templates.

Execution outline:
1) Identify placeholders and version bump type.
2) Fill principles with MUST/SHOULD language; add rationale.
3) Update Governance (amendment procedure, versioning, compliance review).
4) Validate no bracketed tokens remain and dates are ISO.
5) Write Sync Impact Report at the top of the constitution file as an HTML comment.
6) Review and update:
   - `.specify/templates/plan-template.md`
   - `.specify/templates/spec-template.md`
   - `.specify/templates/tasks-template.md`

Notes:
- Hide any agent/vendor-specific names unless explicitly required.
- Prefer declarative, testable rules.
- If RATIFICATION_DATE unknown, leave TODO and set LAST_AMENDED_DATE to today.
