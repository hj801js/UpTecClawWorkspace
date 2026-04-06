# Agent Context Memory (RAG)

에이전트의 컨텍스트를 유지하기 위해 RAG 기법을 사용한다.

> **구현 방식:** 별도 자동화 코드 없이, 에이전트가 자신의 도구(Read, Write, Glob)를 사용하여 `context_store/`를 직접 관리한다. 페르소나 규칙에 의해 작업 시작/완료 시 조회·저장하도록 지시된다.

## 구조
- 저장 경로: `context_store/{에이전트명}/`
- 파일 형식: Markdown (`.md`)
- INDEX.md: 태그별/최근갱신 인덱스 (빠른 조회)
- STATUS.md: 현재 상태 (OR이 전체 현황 파악)

## 컨텍스트 파일 형식
```
---
agent: 에이전트명
topic: 주제
date: YYYY-MM-DD
expires: YYYY-MM-DD (optional)
tags: [태그1, 태그2]
related: [건명1, 건명2] (optional)
---
(내용)
```

## 경험 학습 메모 형식
```
---
agent: 에이전트명
topic: 경험 주제
date: YYYY-MM-DD
type: success | failure | feedback | domain | collaboration
severity: high | medium | low
tags: [태그1, 태그2]
---
상황: (어떤 상황에서)
행동: (어떻게 했는지)
결과: (어떤 결과가 나왔는지)
교훈: (앞으로 어떻게 적용할지)
```

## 규칙
- 작업 시작 시 INDEX.md 조회 → 관련 컨텍스트 로드
- 작업 완료 시 컨텍스트 저장/갱신 + INDEX.md, STATUS.md 업데이트
- `expires` 지난 컨텍스트는 정리
- 원문 저장 금지 (핵심 요약만)
- 민감 정보 저장 금지
- `severity: high` 교훈은 매 작업 시 필수 확인
- 공유 정보는 `context_store/shared/`에 저장
- OR은 `context_store/OR/DASHBOARD.md`에 전체 상태 집계
- 회고: `context_store/{에이전트명}/retro_YYYY-MM.md`에 월별 정리
