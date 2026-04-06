# Memo + Reminder Web App — Technical Design (AR → DV)

> **Status**: AR 설계 완료, DV 구현 대기
> **Date**: 2026-04-06
> **Deploy Target**: `https://hj801js.github.io/UpTecClawWorkspace/memo/`

---

## 1. 파일 구조

워크스페이스 컨벤션(프로젝트별 서브디렉토리, `game/`, `presentation/` 등)을 따른다.

```
memo/
├── index.html          ← 모든 코드 포함 (HTML + CSS + JS)
├── CLAUDE.md           ← 에이전트 규칙
└── DESIGN.md           ← 이 문서
```

**단일 파일 결정 근거**: GitHub Pages 정적 배포, 외부 의존성 없음 제약, 기존 `game/index.html` 선례. 예상 규모 ~1000줄으로 단일 파일 관리 가능.

---

## 2. 데이터 모델

### 2.1 Memo

```js
{
  id:        String,    // "m_" + Date.now() + "_" + Math.random().toString(36).slice(2,5)
  title:     String,    // 빈 문자열 허용
  content:   String,    // 본문
  color:     String,    // "yellow" | "blue" | "green" | "pink" | "purple" | "gray"
  pinned:    Boolean,   // 핀 고정 여부
  createdAt: String,    // ISO 8601
  updatedAt: String     // ISO 8601
}
```

### 2.2 Reminder

```js
{
  id:        String,    // "r_" + Date.now() + "_" + Math.random().toString(36).slice(2,5)
  memoId:    String|null, // 연결된 메모 ID (선택)
  title:     String,    // 필수
  dueAt:     String,    // ISO 8601 (날짜 + 시간)
  done:      Boolean,   // 완료/만료 여부
  notified:  Boolean,   // 브라우저 알림 발송 여부
  createdAt: String     // ISO 8601
}
```

### 2.3 AppSettings

```js
{
  theme:     String,    // "light" | "dark"
  sortBy:    String,    // "updatedAt" | "createdAt" | "title"
  sortOrder: String     // "desc" | "asc"
}
```

### 2.4 localStorage 키

| 키 | 값 | 기본값 |
|---|---|---|
| `memoapp_memos` | `Memo[]` JSON | `[]` |
| `memoapp_reminders` | `Reminder[]` JSON | `[]` |
| `memoapp_settings` | `AppSettings` JSON | `{ theme: "light", sortBy: "updatedAt", sortOrder: "desc" }` |

`memoapp_` 프리픽스로 다른 앱과 키 충돌 방지.

---

## 3. 클래스 아키텍처

### 3.0 전체 구조도

```
App (컨트롤러)
 ├── StorageAdapter        (localStorage 추상화)
 ├── MemoManager           (메모 CRUD + 검색 + 상태)
 ├── ReminderManager       (리마인더 CRUD + 폴링)
 ├── NotificationService   (Web Notifications API 래퍼)
 ├── ThemeManager          (다크/라이트 전환)
 └── Views
      ├── MemoListView     (메모 카드 그리드)
      ├── MemoEditorView   (생성/수정 모달)
      ├── ReminderListView (리마인더 목록)
      └── SearchBar        (검색 필터링)
```

### 3.1 StorageAdapter

localStorage 접근을 캡슐화. 모든 영속성은 이 클래스를 통해서만.

```
class StorageAdapter {
  constructor(prefix = "memoapp_")

  load(key, defaultValue = null)    → any
    // JSON.parse(localStorage.getItem(prefix + key)) ?? defaultValue

  save(key, data)                   → void
    // localStorage.setItem(prefix + key, JSON.stringify(data))

  exportAll()                       → String
    // JSON { version: 1, exportedAt, memos, reminders }

  importAll(jsonString)             → { memos, reminders }
    // 파싱 → version 확인 → 스키마 기본 검증 → 저장 → 반환
    // 실패 시 throw Error (기존 데이터 보존)
}
```

### 3.2 MemoManager

메모 비즈니스 로직. 상태 보유 + 변경 시 콜백 통지.

```
class MemoManager {
  constructor(storage: StorageAdapter)
  
  // ── State ──
  _memos: Memo[]
  _listeners: Set<Function>

  // ── Public API ──
  getAll(sortBy?, sortOrder?)  → Memo[]    // pinned 우선, 이후 정렬
  getById(id)                  → Memo|null
  create({ title, content, color? })  → Memo
  update(id, { title?, content?, color? })  → Memo
  delete(id)                   → void
  togglePin(id)                → Memo
  search(query)                → Memo[]    // title+content, case-insensitive

  // ── Observer ──
  onChange(callback)            → void     // 변경 구독
  _persist()                   → void     // storage.save + listeners 호출
}
```

### 3.3 ReminderManager

리마인더 CRUD + 폴링 엔진.

```
class ReminderManager {
  constructor(storage: StorageAdapter, notificationService: NotificationService)
  
  // ── State ──
  _reminders: Reminder[]
  _listeners: Set<Function>
  _pollTimer: number|null

  // ── Public API ──
  getAll()                     → Reminder[]   // 미완료 우선, dueAt 오름차순
  getById(id)                  → Reminder|null
  create({ title, dueAt, memoId? })  → Reminder
  update(id, { title?, dueAt? })     → Reminder
  delete(id)                   → void
  toggleDone(id)               → void

  // ── Polling ──
  startPolling()               → void   // 즉시 1회 체크 + setInterval(60000)
  stopPolling()                → void   // clearInterval
  _checkDue()                  → void   // 만기 항목 → notify + notified=true

  // ── Observer ──
  onChange(callback)            → void
  _persist()                   → void

  // ── Cleanup ──
  deleteByMemoId(memoId)       → void   // 메모 삭제 시 연결된 리마인더도 제거
}
```

### 3.4 NotificationService

Web Notifications API 래퍼. 상태 없음 (static 메서드).

```
class NotificationService {
  static isSupported()           → Boolean
  static getPermission()         → String   // "granted"|"denied"|"default"
  static async requestPermission()  → String
  static send(title, body)       → void     // new Notification(...)
}
```

### 3.5 ThemeManager

CSS 변수 기반 테마 전환.

```
class ThemeManager {
  constructor(storage: StorageAdapter)

  _theme: String   // "light" | "dark"

  toggle()         → void   // 테마 전환 + CSS 적용 + 저장
  apply()          → void   // document.documentElement.dataset.theme = _theme
  getTheme()       → String
}
```

### 3.6 View 클래스 공통 패턴

모든 View는 동일 패턴을 따른다:

```
class [SomeView] {
  constructor(containerEl, service, ...deps)
  render()          → void    // container innerHTML 갱신
  _bindEvents()     → void    // container 레벨 이벤트 위임
  _onAction(e)      → void    // data-action 속성 기반 분기
}
```

**이벤트 위임**: `container.addEventListener('click', e => ...)` 하나로 처리.
자식 요소에서 `e.target.closest('[data-action]')` 로 액션 분기.
→ DOM 재렌더 시 리스너 누수 없음.

#### MemoListView
- 메모 카드 그리드 렌더링
- 카드: 제목, 본문 미리보기, 색상 스트라이프, 핀 아이콘, 타임스탬프
- 액션: 카드 클릭(편집), 핀 토글, 삭제

#### MemoEditorView
- 모달 다이얼로그
- 필드: 제목 input, 본문 textarea, 색상 선택 (라디오/버튼), 리마인더 추가 옵션
- 액션: 저장, 취소, 삭제

#### ReminderListView
- 리마인더 항목 목록 렌더링
- 항목: 체크박스, 제목, 기한 (상대 시간 + 절대 시간), 연결된 메모 링크
- 상태 표시: 미완료(기본), 만료(dueAt < now, 빨간색), 완료(done, 취소선)
- 액션: 완료 토글, 편집, 삭제

#### SearchBar
- 검색 input + 결과 필터링
- 입력 시 300ms debounce → MemoManager.search() → MemoListView.render()

### 3.7 App (메인 컨트롤러)

```
class App {
  constructor()

  init()
    1. StorageAdapter 생성
    2. NotificationService.requestPermission()
    3. MemoManager 생성 (storage 주입)
    4. ReminderManager 생성 (storage, notificationService 주입)
    5. ThemeManager 생성 (storage 주입) → apply()
    6. 각 View 생성 (DOM 요소 + manager 주입)
    7. Manager.onChange → View.render 바인딩
    8. MemoManager.onChange → ReminderListView.render (메모 삭제 시 리마인더 연동)
    9. ReminderManager.startPolling()
    10. Import/Export 버튼 이벤트 바인딩
    11. visibilitychange 이벤트 바인딩
    12. 최초 render()
}
```

---

## 4. 상태 관리 패턴

**단방향 데이터 흐름 + Observer 패턴**

```
User Action
  → View 이벤트 핸들러
  → Manager.create/update/delete 호출
  → Manager: 내부 배열 변경 + _persist()
  → _persist(): StorageAdapter.save() + listeners.forEach(cb => cb())
  → View.render(): 최신 상태로 DOM 갱신
```

핵심 원칙:
- **View는 Manager의 상태를 직접 수정하지 않는다** (항상 Manager API를 통해)
- **Manager는 DOM을 모른다** (View에 대한 참조 없음)
- **연결은 onChange 콜백으로만** (느슨한 결합)

---

## 5. 리마인더 폴링 전략

```
┌──────────────┐
│ App.init()   │
│              │
│ startPolling │──→ _checkDue() 즉시 1회 실행
│              │
│ setInterval  │──→ 매 60초마다 _checkDue()
└──────────────┘

┌──────────────────────────────┐
│ _checkDue()                  │
│                              │
│ 1. now = new Date()          │
│ 2. due = reminders.filter(   │
│      !done && !notified &&   │
│      dueAt <= now            │
│    )                         │
│ 3. due.forEach:              │
│    - NotificationService     │
│      .send(title)            │
│    - r.notified = true       │
│ 4. if (due.length > 0)      │
│    → _persist()              │
└──────────────────────────────┘

보완:
- document.addEventListener('visibilitychange', () => {
    if (!document.hidden) _checkDue()  // 탭 복귀 시 즉시 체크
  })
- 알림 권한 거부 시: 앱 내 배너로 "만기된 리마인더" 표시
```

**왜 60초?**: 리마인더 최소 단위가 "분"이므로 1분 간격이면 최대 59초 지연. 사용자 체감상 충분한 정밀도.

---

## 6. UI 레이아웃

### 6.1 데스크톱 (≥768px): 2컬럼

```
┌─────────────────────────────────────────────────────┐
│  Header                                              │
│  [MemoKeep]   [🔍 검색...]   [☀️/🌙] [📥] [📤]    │
├────────────────────────────┬────────────────────────┤
│  Memos                     │  Reminders              │
│                            │                         │
│  [+ 새 메모]               │  [+ 새 리마인더]        │
│                            │                         │
│  ┌──────┐  ┌──────┐       │  ☐ 회의 준비            │
│  │ 📌   │  │      │       │    4/7 09:00            │
│  │ 메모1│  │ 메모2│       │                         │
│  │      │  │      │       │  ☑ 점심 약속 (만료)     │
│  └──────┘  └──────┘       │    4/6 12:00            │
│                            │                         │
│  ┌──────┐  ┌──────┐       │  ☐ 보고서 제출          │
│  │      │  │      │       │    4/8 18:00            │
│  └──────┘  └──────┘       │                         │
└────────────────────────────┴────────────────────────┘
```

### 6.2 모바일 (<768px): 탭 전환

```
┌──────────────────────┐
│ [MemoKeep]  [☀️] ... │
│ [🔍 검색...]         │
├──────────────────────┤
│ [메모] | [리마인더]  │  ← 탭 전환
├──────────────────────┤
│ [+ 새 메모]          │
│                      │
│ ┌──────────────────┐ │
│ │ 📌 메모 제목     │ │
│ │ 본문 미리보기... │ │
│ │ 2분 전           │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ ...              │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### 6.3 메모 카드 컴포넌트

```
┌─ color stripe (4px left border) ───────────────────┐
│  📌 (pinned일 때만)              [✕ 삭제]          │
│                                                     │
│  제목 (굵게, 1줄 말줄임)                           │
│  본문 미리보기 (2~3줄 말줄임)                      │
│                                                     │
│  🔔 리마인더 1건  ·  2분 전 수정                   │
└─────────────────────────────────────────────────────┘
```

### 6.4 메모 편집 모달

```
┌──── 메모 편집 ──────────────────── [✕] ─┐
│                                          │
│  제목: [________________________]        │
│                                          │
│  ┌────────────────────────────────┐      │
│  │ 본문 textarea                  │      │
│  │                                │      │
│  │                                │      │
│  └────────────────────────────────┘      │
│                                          │
│  색상: (●)(●)(●)(●)(●)(●)               │
│         Y   B  G  Pk Pu Gr              │
│                                          │
│  [+ 리마인더 추가]                       │
│                                          │
│  ┌────────────────────────────────┐      │
│  │  날짜: [____]  시간: [____]   │      │
│  └────────────────────────────────┘      │
│                                          │
│          [취소]   [저장]                 │
└──────────────────────────────────────────┘
```

---

## 7. CSS 테마 전략

CSS 변수 기반. `<html data-theme="light|dark">` 토글.

```css
:root[data-theme="light"] {
  --bg-primary:   #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-card:      #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border:       #e0e0e0;
  --shadow:       rgba(0, 0, 0, 0.08);
  --accent:       #4a90d9;
}

:root[data-theme="dark"] {
  --bg-primary:   #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card:      #1e2a45;
  --text-primary: #eaeaea;
  --text-secondary: #a0a0a0;
  --border:       #2a2a4a;
  --shadow:       rgba(0, 0, 0, 0.3);
  --accent:       #5fa8f5;
}
```

메모 색상 태그 — 라이트/다크 양쪽에 대응:

```css
.memo-yellow { --memo-color: #fff3cd; --memo-border: #ffc107; }
.memo-blue   { --memo-color: #cfe2ff; --memo-border: #0d6efd; }
.memo-green  { --memo-color: #d1e7dd; --memo-border: #198754; }
.memo-pink   { --memo-color: #f8d7da; --memo-border: #dc3545; }
.memo-purple { --memo-color: #e2d9f3; --memo-border: #6f42c1; }
.memo-gray   { --memo-color: #e9ecef; --memo-border: #6c757d; }

[data-theme="dark"] .memo-yellow { --memo-color: #3d3520; --memo-border: #d4a017; }
/* ... 다크모드 변형 동일 패턴 */
```

---

## 8. Import/Export 상세

### Export

```js
exportAll() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    memos: this.load('memos', []),
    reminders: this.load('reminders', [])
  };
  return JSON.stringify(data, null, 2);
}

// 트리거: Blob → URL.createObjectURL → <a download="memokeep_backup_YYYY-MM-DD.json">
```

### Import

```js
importAll(jsonString) {
  const data = JSON.parse(jsonString);  // 실패 시 throw
  if (!data.version || !Array.isArray(data.memos) || !Array.isArray(data.reminders)) {
    throw new Error('Invalid backup format');
  }
  this.save('memos', data.memos);
  this.save('reminders', data.reminders);
  return data;
}

// 트리거: <input type="file" accept=".json"> → FileReader → importAll → 전체 re-render
```

**덮어쓰기 방식** 채택: merge는 ID 충돌 처리 복잡. 백업/복원 시맨틱에 replace가 직관적. import 전 확인 다이얼로그 표시.

---

## 9. 메모 ↔ 리마인더 연동

- 메모 편집 모달에서 리마인더 추가 가능 → `reminder.memoId = memo.id`
- 리마인더 목록에서 연결된 메모 제목 표시 + 클릭 시 해당 메모 편집 모달 열기
- **메모 삭제 시**: 연결된 리마인더도 함께 삭제 (`ReminderManager.deleteByMemoId(memoId)`)
- 독립 리마인더도 허용 (memoId = null)

---

## 10. DV 구현 순서 (권장)

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

---

## 11. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| localStorage 5MB 제한 | 메모 대량 저장 시 | try-catch + 용량 초과 경고 배너. 일반 사용(수백 개)에는 문제없음 |
| 알림 권한 거부 | 리마인더 무용 | 앱 내 배너로 만기 리마인더 표시 (fallback) |
| 탭 비활성 시 setInterval 지연 | 알림 누락 | visibilitychange 이벤트로 탭 복귀 시 즉시 체크 |
| 단일 파일 규모 | 유지보수 | ~1000줄 예상, 주석 섹션 구분으로 관리. 추후 분리 필요 시 협의 |
| 구형 브라우저 | ES6+ 미지원 | GitHub Pages 대상 사용자는 모던 브라우저 가정 |

---

## 12. 설계 판단 요약

| 결정 | 근거 |
|------|------|
| 단일 `index.html` | PM 제약 + 워크스페이스 `game/` 선례 |
| `memo/` 서브디렉토리 | 워크스페이스 컨벤션 (`game/`, `presentation/` 등) |
| 클래스 기반 OOP | CLAUDE.md 원칙 + PM 요구 |
| Manager-View 분리 | 비즈니스 로직 ↔ DOM 관심사 분리 |
| Observer 패턴 (onChange) | 느슨한 결합, Manager가 View를 모름 |
| 이벤트 위임 | 동적 DOM 재렌더 시 리스너 누수 방지 |
| 60초 setInterval + visibilitychange | 분 단위 정밀도 + 탭 비활성 보상 |
| CSS 변수 테마 | JS 최소화, 전환 즉각 반영 |
| Import = 전체 교체 | ID 충돌 회피, 백업/복원 시맨틱 |
| `memoapp_` 키 프리픽스 | 다른 앱과 localStorage 충돌 방지 |
