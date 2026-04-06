# Agent Context Memory (RAG)

RAG techniques are used to maintain agent context.

> **Implementation:** Without separate automation code, agents directly manage `context_store/` using their own tools (Read, Write, Glob). Persona rules instruct agents to query and store context at the start and completion of each task.

## Structure
- Storage path: `context_store/{AgentName}/`
- File format: Markdown (`.md`)
- INDEX.md: Index by tags/recent updates (for quick lookup)
- STATUS.md: Current status (for OR to assess overall state)

## Context File Format
```
---
agent: AgentName
topic: Topic
date: YYYY-MM-DD
expires: YYYY-MM-DD (optional)
tags: [tag1, tag2]
related: [subject1, subject2] (optional)
---
(Content)
```

## Experience Learning Memo Format
```
---
agent: AgentName
topic: Experience topic
date: YYYY-MM-DD
type: success | failure | feedback | domain | collaboration
severity: high | medium | low
tags: [tag1, tag2]
---
Situation: (Under what circumstances)
Action: (What was done)
Result: (What outcome occurred)
Lesson: (How to apply going forward)
```

## Rules
- At task start: query INDEX.md -> load related context
- At task completion: save/update context + update INDEX.md and STATUS.md
- Clean up context past its `expires` date
- Do not store raw content (key summaries only)
- Do not store sensitive information
- `severity: high` lessons must be reviewed at every task
- Shared information is stored in `context_store/shared/`
- OR aggregates overall status in `context_store/OR/DASHBOARD.md`
- Retrospectives: organized monthly in `context_store/{AgentName}/retro_YYYY-MM.md`
