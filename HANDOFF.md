# Handoff — 2026-04-06

## 세션 요약

이번 세션에서 UpTecClaw 멀티 에이전트 시스템을 대폭 개선했습니다.

---

## 완료된 작업

### 1. 에이전트 메시지 프로토콜
- 요청서/보고서/약식 메시지 양식 정의
- 수신란에만 멘션, 본문은 평문
- CLAUDE.md에서 분리 → `MESSAGE_PROTOCOL.md`

### 2. 듀얼 채널 분리
- **Slack = 보고 전용**: 멘션 금지, 2~3줄 요약만, 2000자 제한
- **Internal Chat = 컨텍스트 교환**: 실제 대화, 길이 무제한
- "생각 중..." 메시지 편집 방식 → 새 메시지로 응답하도록 변경

### 3. 대시보드 기능 추가 (dashboard.js)
- **User — OR 전용 챗**: 사용자가 OR에게 직접 지시
- **DM Viewer**: 모든 에이전트 pair DM 열람 (OR↔Agent, DV↔RV)
- **Projects 탭**: 프로젝트 요약, 리뷰 점수, URL, 실행 방법, Editable 체크박스
- **헬스체크**: `GET /api/health`
- 한글 IME 중복 입력 수정 (`isComposing`)
- 페이지 로드 시 OR 채팅 히스토리 자동 로드

### 4. 모델 배정
- AR(Architect), DV(Developer) → Opus
- OR, PM, RV, DO → Sonnet
- `bot/config.js` 생성하여 설정 중앙화 (AGENT_MODELS, workspace check 등)

### 5. 리뷰-배포 파이프라인
- RV 점수 평가: X.X/10.0 + 항목별 평가
- 기준점: 초기 9.0, 10회 미달 시 1.0씩 하향
- OR이 DV↔RV 피드백 루프 조율 → 통과 시 DO에게 배포
- DO는 OR 승인 없이 배포 불가

### 6. OR 행동 원칙
- 되묻지 않고 판단해서 진행
- curl `/api/chat`으로 에이전트에게 DM 발송
- Internal Chat 작업 시에도 Slack에 간략 보고
- 매일 9시 워크스페이스 점검 → 미등록 프로젝트 자동 등록

### 7. DV ↔ RV 직접 DM
- OR 경유 예외로 허용
- `dm_logs/`에 자동 기록, DM Viewer에서 모니터링

### 8. 에이전트 경험 학습 (RAG)
- `context_store/` 구조: INDEX.md, STATUS.md, 경험 메모, 회고
- 에이전트가 자신의 도구(Read/Write/Glob)로 직접 관리
- Context TTL, 공유 컨텍스트, OR 대시보드

### 9. 프로젝트 완성본 관리
- 배포 완료 시 `editable: false` → CLAUDE.md에 "완성본" 마커 자동 추가
- 대시보드 Editable 체크박스로 잠금/해제 전환
- `PATCH /api/projects/:name/editable` API

### 10. 코드 품질
- `isRunning()` 버그 수정 (app.js)
- agents.json "subagent" 제거
- Slack 페르소나 전면 교체 (멘션 제거, OR 경유, 간략 보고)
- 레거시 skills deprecated 마킹
- 중복 상수/함수 제거 → config.js 통합

### 11. 문서 갱신
- CLAUDE.md 분리: MESSAGE_PROTOCOL.md, CONTEXT_MEMORY.md, REVIEW_PIPELINE.md
- README.md, ARCHITECTURE.md, ROADMAP.md 전면 갱신
- 각 프로젝트 폴더 CLAUDE.md 생성 (game, rock-paper-scissors, presentation, .github)

---

## 등록된 프로젝트 (3건)
| 이름 | 상태 | URL |
|------|------|-----|
| game | 완료 (LOCKED) | https://hj801js.github.io/UpTecClawWorkspace/game/ |
| rock-paper-scissors | 완료 (LOCKED) | https://hj801js.github.io/UpTecClawWorkspace/rock-paper-scissors/ |
| presentation | 완료 (LOCKED) | https://hj801js.github.io/UpTecClawWorkspace/presentation/ |

---

## 현재 상태
- 대시보드: `http://localhost:3000` 실행 중
- 리뷰 점수: 9.4/10.0
- Phase 1~7 완료

---

## Phase 8.2~8.5 완료

| # | 작업 | 설명 |
|---|------|------|
| 8.2 | 대시보드 타임라인 뷰 | Done — Timeline 탭, 이벤트 필터링, JSONL 저장 |
| 8.3 | 에이전트 성능 메트릭 | Done — Metrics 탭, 응답시간/성공률, 24h 롤링윈도우 |
| 8.4 | 자동 핸드오프 정확도 개선 | Done — 구조화 프롬프트(5섹션), 검증, completeness 추적 |
| 8.5 | 테스트 자동화 파이프라인 | Done — Pipeline 탭, DV 테스트 → RV 리뷰 자동 실행 |

### 변경 파일
- `bot/config.js` — 타임라인, 메트릭, 핸드오프, 파이프라인 상수 추가
- `bot/dashboard.js` — Timeline/Metrics/Pipeline API + 사이드바 탭 3개 추가
- `bot/app.js` — 타임라인 이벤트, 메트릭 수집, 구조화 핸드오프 적용
- `ROADMAP.md` — Phase 8.2~8.5 Done 표시

### 새 API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/timeline` | 타임라인 이벤트 조회 (?limit, ?agent, ?type) |
| GET | `/api/metrics` | 전체 에이전트 메트릭 요약 |
| GET | `/api/metrics/:agent` | 특정 에이전트 상세 메트릭 |
| POST | `/api/handoff/:agent` | 구조화 핸드오프 실행 |
| GET | `/api/handoff/:agent` | 핸드오프 내용 + 검증 결과 조회 |
| GET | `/api/pipelines` | 파이프라인 목록 조회 |
| POST | `/api/pipelines` | 파이프라인 실행 (body: {project}) |
| GET | `/api/pipelines/:id` | 파이프라인 상태 조회 |

### 새 데이터 파일
- `bot/timeline.jsonl` — 타임라인 이벤트 (최대 500건)
- `bot/metrics.json` — 에이전트 성능 메트릭
- `bot/test_pipeline.json` — 파이프라인 실행 기록

## 다음 작업
- Phase 8.1: 멀티 프로젝트 동시 관리 (Todo)

---

## 주요 파일 경로

| 파일 | 용도 |
|------|------|
| `UpTecClaw/bot/app.js` | Slack 에이전트 봇 |
| `UpTecClaw/bot/dashboard.js` | 웹 대시보드 |
| `UpTecClaw/bot/config.js` | 공유 설정 (모델, 상수) |
| `UpTecClaw/bot/dm_logs/` | DM 대화 로그 |
| `UpTecClaw/bot/projects.json` | 프로젝트 기록 |
| `UpTecClaw/agents.json` | 에이전트 정의 |
| `UpTecClaw_Workspace/CLAUDE.md` | 에이전트 규칙 (핵심) |
| `UpTecClaw_Workspace/MESSAGE_PROTOCOL.md` | 메시지 양식 |
| `UpTecClaw_Workspace/CONTEXT_MEMORY.md` | RAG 구조 |
| `UpTecClaw_Workspace/REVIEW_PIPELINE.md` | 리뷰-배포 파이프라인 |
