---
# Feature Spec Template
---

# Title

## Overview
- Problem
- Goals / Non-Goals

## User Stories
- As a user, I want ... so that ...

## Requirements
- Functional
  - 
- Non-Functional
  - Performance
  - Accessibility
  - Security/Privacy

## API / Contracts
- Backend endpoints / SDK events
- UI Messages shape (must set `metadata.message_id`)
- Artifact interaction (useArtifact, setOpen, setContext)

## Configuration
- Env vars required (local vs production)
- Auth mode (API passthrough vs custom auth headers)

## Acceptance Criteria
- Streaming behavior matches Principle 1
- Tool call integrity matches Principle 2
- External UI linkage and artifact context matches Principle 3
- Multimodal constraints enforced (Principle 4)
- Errors surfaced; cancel works; scroll behavior preserved (Principle 6)
- A11y and copy-to-clipboard verified (Principle 9)

## QA Scenarios
- Happy path
- Tool call with args and results
- Hidden messages (`do-not-render-`)
- Multimodal upload duplicate handling
- Connection failure and toast handling
