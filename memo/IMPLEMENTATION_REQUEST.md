# AR → DV 구현 지시: MemoKeep 앱

> **Date**: 2026-04-06
> **Status**: DV 구현 착수 요청

---

## 선행 문서
- PM 요구사항: `docs/requirements/memo-reminder-v1.md` ✅
- AR 기술 설계: `memo/DESIGN.md` ✅ ← **반드시 원문 참조**

---

## 구현 대상

**단일 파일**: `memo/index.html` (Vanilla JS/CSS/HTML only, 외부 의존성 없음)

---

## 클래스 아키텍처 (10개)

| # | 클래스 | 역할 |
|---|--------|------|
| 1 | `StorageAdapter` | localStorage 추상화 (load/save/exportAll/importAll) |
| 2 | `MemoManager` | 메모 CRUD + 검색 + Observer (onChange) |
| 3 | `ReminderManager` | 리마인더 CRUD + 60초 폴링 (_checkDue) |
| 4 | `NotificationService` | Web Notifications API 래퍼 (static) |
| 5 | `ThemeManager` | CSS 변수 기반 다크/라이트 전환 |
| 6 | `MemoListView` | 메모 카드 그리드 렌더링 |
| 7 | `MemoEditorView` | 생성/수정 모달 |
| 8 | `ReminderListView` | 리마인더 목록 |
| 9 | `SearchBar` | 300ms debounce 검색 |
| 10 | `App` | 메인 컨트롤러 (조립 + 초기화) |

---

## 데이터 모델

```
Memo:        { id, title, content, color, pinned, createdAt, updatedAt }
Reminder:    { id, memoId, title, dueAt, done, notified, createdAt }
AppSettings: { theme, sortBy, sortOrder }

localStorage keys: memoapp_memos, memoapp_reminders, memoapp_settings
```

---

## 구현 순서 (권장)

1. HTML 스켈레톤 + CSS 변수 + 기본 레이아웃
2. `StorageAdapter`
3. `MemoManager` + `MemoListView` + `MemoEditorView`
4. `ReminderManager` + `ReminderListView` + `NotificationService`
5. `ThemeManager`
6. `SearchBar` + debounce
7. Import/Export
8. `App` 컨트롤러 조립 + visibilitychange
9. 반응형 CSS (모바일 탭 전환) + 최종 폴리싱

---

## 핵심 설계 포인트

- **상태 관리**: 단방향 (User → View → Manager → _persist → onChange → render)
- **이벤트 위임**: container 레벨 addEventListener + `data-action` 속성
- **리마인더 폴링**: setInterval(60000) + visibilitychange 보완
- **UI**: 데스크톱 2컬럼 / 모바일 탭 전환 (768px 기준)
- **테마**: `<html data-theme="light|dark">` + CSS 변수
- **메모 색상**: 6종 (yellow/blue/green/pink/purple/gray), 다크모드 변형 포함
- **Import = 전체 교체** (확인 다이얼로그 표시)
- **메모 삭제 → 연결 리마인더도 삭제** (deleteByMemoId)
- **localStorage try-catch** 용량 초과 경고

---

## 주의사항

- DESIGN.md에 모든 클래스 API, CSS 변수, 레이아웃 와이어프레임이 명시되어 있음
- pinned 메모는 정렬 시 항상 상단
- 예상 규모 ~1000줄, 주석 섹션 구분으로 가독성 확보

---

## 완료 후

RV(Reviewer)에게 코드 리뷰 요청 → DO 배포 파이프라인 진행
