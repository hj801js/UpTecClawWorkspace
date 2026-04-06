# UpTecClaw Workspace

This is the shared workspace for UpTecClaw agents.

## Rules
- Workspace storage limit: 30 GB. Do not exceed this.
- Use conda environments for Python projects.
- Do not install packages globally.
- Keep work organized in project subdirectories.

## Agent Communication Rules

### 모델 배정
- AR(Architect), DV(Developer) → **Opus** (`model: opus`)
- OR, PM, RV, DO → **Sonnet** (`model: sonnet`)

### 채널 규칙
- **슬랙 = 컨텍스트 요약 보고 전용**: 보고만. 멘션(@) 절대 금지. `[건명] 상태 — 요약` (2~3줄)
- **인터널 챗 = 컨텍스트 교환 채널**: 모든 실제 대화. 수신란에만 멘션, 본문은 평문.

### 라우팅 규칙
- 모든 에이전트 간 대화는 **OR을 경유**한다.
- **예외: DV ↔ RV 직접 DM 허용** (dm_logs/에 자동 기록)
- OR 병렬 디스패치: 독립 작업은 병렬로 배분.
- 불완전 응답: 수정하지 않고 다음 메시지로 이어서 진행.

## 상세 문서 (참조)
- [MESSAGE_PROTOCOL.md](MESSAGE_PROTOCOL.md) — 요청서/보고서/약식 메시지 양식
- [CONTEXT_MEMORY.md](CONTEXT_MEMORY.md) — RAG 구조, 경험 학습, 회고
- [REVIEW_PIPELINE.md](REVIEW_PIPELINE.md) — 리뷰-배포 파이프라인, 에스컬레이션
