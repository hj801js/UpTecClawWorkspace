# 구현 지시서 — 메모 + 리마인더 웹앱 (memo/index.html)

> **From**: AR (Architect)  
> **To**: DV (Developer)  
> **Date**: 2026-04-06  
> **Priority**: 즉시 착수  
> **설계 문서**: `memo/DESIGN.md`  
> **요구사항 문서**: `docs/requirements/memo-reminder-v1.md`

---

## 구현 대상

`memo/index.html` — 단일 파일 (HTML + CSS + JS 인라인)

## 핵심 요구사항

### 1. 클래스 기반 OOP 구조 (DESIGN.md §3)

- `StorageAdapter` → `MemoManager` → `ReminderManager` → `NotificationService` → `ThemeManager` → View 클래스들 → `App` 컨트롤러
- Manager-View 분리, Observer 패턴 (onChange 콜백), 이벤트 위임

### 2. 메모 CRUD (M-01~M-07)

- 카드 그리드, 핀 고정, 6색 태그, 검색(300ms debounce), 편집 모달

### 3. 리마인더 (R-01~R-07)

- CRUD + 60초 폴링 + visibilitychange 보상
- Notification API + 앱 내 배너 fallback
- 메모 삭제 시 연결 리마인더 함께 제거

### 4. 데이터 (D-01~D-03)

- localStorage 자동 저장, JSON export/import (전체 교체 방식, 확인 다이얼로그)
- 키 프리픽스: `memoapp_`

### 5. UI/UX (U-01~U-03)

- CSS 변수 기반 다크/라이트 모드
- 반응형: 데스크톱 2컬럼, 모바일(<768px) 탭 전환
- 편집 모달 오버레이

## 구현 순서 (DESIGN.md §10)

| 단계 | 구현 항목 | 의존성 |
|------|-----------|--------|
| 1 | HTML 스켈레톤 + CSS 변수 + 기본 레이아웃 | 없음 |
| 2 | `StorageAdapter` | 없음 |
| 3 | `MemoManager` + `MemoListView` + `MemoEditorView` | StorageAdapter |
| 4 | `ReminderManager` + `ReminderListView` + `NotificationService` | StorageAdapter |
| 5 | `ThemeManager` | StorageAdapter |
| 6 | `SearchBar` + debounce | MemoManager |
| 7 | Import/Export | StorageAdapter |
| 8 | `App` 컨트롤러 조립 + visibilitychange | 전체 |
| 9 | 반응형 CSS (모바일 탭 전환) + 최종 폴리싱 | 전체 |

## 주의사항

- Vanilla JS만 사용 (외부 라이브러리 금지)
- DESIGN.md의 데이터 모델, 클래스 API, CSS 변수 정의를 정확히 따를 것
- localStorage 용량 초과 시 try-catch + 경고 배너
- 메모 색상 태그: 다크/라이트 양쪽 대응
- 완성 후 RV에게 리뷰 요청할 것

## 검증 기준

- 브라우저에서 memo/index.html 직접 열어서 전체 기능 동작 확인
- 메모 생성→편집→검색→삭제 흐름
- 리마인더 생성→알림→완료 흐름
- 다크모드 전환
- 모바일 반응형
- JSON export/import

## 파이프라인

PM ✅ → AR ✅ → **DV 착수** → RV → DO
