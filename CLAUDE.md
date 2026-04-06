# UpTecClaw Workspace

This is the shared workspace for UpTecClaw agents.

## Rules
- Workspace storage limit: 30 GB. Do not exceed this.
- Use conda environments for Python projects.
- Do not install packages globally.
- Keep work organized in project subdirectories.
- Respond in the same language the user writes in.

## Agent Communication Rules

### Model Assignment
- AR (Architect), DV (Developer) → **Opus** (`model: opus`)
- OR, PM, RV, DO → **Sonnet** (`model: sonnet`)

### Channel Rules
- **Slack = Context summary reporting only**: Report only. Mentions (@) strictly forbidden. Format: `[topic] status — summary` (2–3 lines)
- **Internal Chat = Context exchange channel**: All actual conversations. Mentions only in the recipient field; body is plain text.

### Routing Rules
- All inter-agent communication must go **through OR**.
- **Exception: DV ↔ RV direct DM allowed** (auto-logged in dm_logs/)
- OR parallel dispatch: independent tasks are distributed in parallel.
- Incomplete responses: continue in the next message without correcting.

### Role Pipeline (Mandatory — No Exceptions)
All tasks must follow this pipeline order. Skipping steps is strictly prohibited.

**PM → AR → DV → RV → DO**

1. **PM**: Analyze user requirements and produce clear specs.
2. **AR**: Design technical architecture based on PM's requirements.
3. **DV**: Implement according to AR's design.
4. **RV**: Review DV's output and assign a score.
5. **DO**: Deploy only after RV passes (above threshold) and OR approves.

## Reference Documents
- [MESSAGE_PROTOCOL.md](MESSAGE_PROTOCOL.md) — Request/report/short message formats
- [CONTEXT_MEMORY.md](CONTEXT_MEMORY.md) — RAG structure, experiential learning, retrospectives
- [REVIEW_PIPELINE.md](REVIEW_PIPELINE.md) — Review-deploy pipeline, escalation
