# Memo + Reminder Web App v2 — Technical Design (AR → DV)

> **Status**: AR 설계 완료, DV 구현 대기  
> **Date**: 2026-04-06  
> **Requirements**: `docs/requirements/memo-reminder-v2.md`  
> **Deploy**: `https://hj801js.github.io/UpTecClaw_Workspace/memo-app/`

---

## 0. v1 대비 변경 요약

| 항목 | v1 (`memo/`) | v2 (`memo-app/`) |
|------|-------------|-----------------|
| 배포 경로 | `memo/` | `memo-app/` |
| 데이터 모델 | Memo + Reminder 별도 엔티티 | Reminder가 Memo에 내장 (1:1) |
| localStorage 키 | 3개 분리 (`memos`, `reminders`, `settings`) | 단일 키 (`memoapp_data`) |
| 독립 리마인더 | 지원 | 미지원 (항상 메모에 종속) |
| 색상/핀 기능 | 지원 | v2 범위 외 (단순화) |
| 다크 테마 | 지원 | v2 범위 외 |

---

## 1. 설계 결정 (5개 항목)

### D-1. 단일 파일 (`index.html` 인라인)

**결정**: CSS와 JS를 모두 `index.html`에 인라인.

**근거**:
- 외부 의존성 없음 제약 (NF-01) → 파일 분리의 이점 없음
- GitHub Pages 정적 배포 — 파일 수 최소화가 유리
- 워크스페이스 선례: `game/index.html`
- 예상 규모: ~600–800줄 (v2는 v1보다 기능 적음). 관리 가능.
- 분리 기준: 1200줄 초과 시 재검토

### D-2. JS 모듈 설계: 3-tier 클래스

```
App (컨트롤러)
 ├── MemoStore          (데이터 CRUD + localStorage 영속성)
 ├── ReminderService    (폴링 + Web Notifications + toast fallback)
 └── UIController       (DOM 렌더링 + 이벤트 핸들링)
```

**역할 분리**:
- `MemoStore`: 상태 소유자. 메모 배열 관리, 검색, 정렬, import/export. localStorage 직접 접근.
- `ReminderService`: 폴링 루프, 알림 발송, 권한 관리. 상태 비소유 (MemoStore에서 읽기만).
- `UIController`: DOM 렌더링, 이벤트 바인딩, 모달 관리. 비즈니스 로직 없음.
- `App`: 조립 + 초기화. 세 모듈을 연결.

**v1과 차이**: v2 데이터 모델에서 Reminder가 Memo에 내장되므로 `ReminderManager`가 CRUD를 갖지 않음. 폴링+알림 전담 서비스로 경량화.

### D-3. 렌더링 전략: innerHTML 템플릿 + 이벤트 위임

**결정**: innerHTML로 전체 리스트를 re-render + container 레벨 이벤트 위임.

**근거**:
- 순수 DOM 조작(`createElement`)은 코드량 2–3배. 단일 파일에서 부담.
- innerHTML은 XSS 위험이 있으나, 사용자 입력은 escape 함수를 통과시켜 해결.
- 이벤트 위임: `container.addEventListener('click', handler)` 하나로 `data-action` 속성 분기. DOM 재렌더 시 리스너 누수 없음.

**필수 유틸**:
```js
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### D-4. 리마인더 폴링: setInterval 60s + visibilitychange 보상

**결정**: `setInterval(checkDue, 60000)` + `visibilitychange` 이벤트로 탭 복귀 시 즉시 체크.

**근거**:
- 리마인더 최소 단위 = 분 → 60초 간격이면 최대 59초 지연. 충분한 정밀도.
- 백그라운드 탭에서 브라우저가 setInterval을 throttle(~1분 이상 지연) → `visibilitychange`로 보상.
- 배터리/CPU 부담 최소.

### D-5. ID 생성: `crypto.randomUUID()`

**결정**: `crypto.randomUUID()` 사용.

**근거**:
- GitHub Pages = HTTPS → `crypto.randomUUID()` 항상 사용 가능 (Secure Context 필수)
- `Date.now()` 대비: 동시 생성 시 충돌 불가, 진정한 UUID v4
- 모던 브라우저 전제 (NF-05, GitHub Pages 대상 사용자)
- `crypto.randomUUID()` 지원: Chrome 92+, Firefox 95+, Safari 15.4+ (2022~)

---

## 2. 데이터 모델

### 2.1 전체 구조 (localStorage `memoapp_data` 단일 키)

```json
{
  "memos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "회의 메모",
      "body": "오후 3시 디자인 리뷰...",
      "createdAt": "2026-04-06T10:00:00.000Z",
      "updatedAt": "2026-04-06T10:30:00.000Z",
      "reminder": {
        "datetime": "2026-04-07T09:00:00.000Z",
        "reminderFired": false
      }
    }
  ]
}
```

### 2.2 필드 명세

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (UUID v4) | `crypto.randomUUID()` |
| `title` | String | 빈 문자열 허용. 없으면 "제목 없음" 표시 |
| `body` | String | 본문. 빈 문자열 허용 |
| `createdAt` | String (ISO 8601) | 생성 시점. 불변 |
| `updatedAt` | String (ISO 8601) | 마지막 수정 시점 |
| `reminder.datetime` | String (ISO 8601) \| null | null이면 리마인더 미설정 |
| `reminder.reminderFired` | Boolean | true면 이미 알림 발송됨 |

### 2.3 불변식 (Invariants)

- `reminder.datetime`이 null이면 `reminderFired`는 반드시 false
- `reminder.datetime` 변경 시 `reminderFired`를 false로 리셋
- 메모 삭제 시 해당 리마인더도 자동 소멸 (내장 구조이므로 자연스러움)

---

## 3. 클래스 아키텍처

### 3.1 MemoStore

```
class MemoStore {
  constructor()

  // ── State ──
  _memos: Array         // 메모 배열 (메모리 캐시)
  _listeners: Set       // onChange 콜백들

  // ── CRUD ──
  getAll()              → Memo[]     // updatedAt 내림차순
  getById(id)           → Memo|null
  create({ title, body })  → Memo   // id, timestamps 자동 생성
  update(id, fields)    → Memo      // title, body, reminder 변경 가능
  delete(id)            → void      // 확인 다이얼로그는 UI 책임

  // ── Reminder ──
  setReminder(id, datetime)   → Memo  // reminder.datetime 설정, reminderFired=false
  clearReminder(id)           → Memo  // reminder = { datetime: null, reminderFired: false }
  markFired(id)               → void  // reminderFired = true

  // ── Query ──
  search(query)         → Memo[]    // title + body, case-insensitive includes
  getDueReminders()     → Memo[]    // reminder.datetime <= now && !reminderFired

  // ── Import/Export ──
  exportJSON()          → String    // { version: 1, exportedAt, memos }
  importJSON(str)       → void      // 파싱 + 검증 + 저장 + notify

  // ── Observer ──
  onChange(cb)           → Function  // 구독. 반환값 = 해제 함수
  _persist()            → void      // localStorage 저장 + listeners 호출
  _load()               → Memo[]    // localStorage 로드 (초기화 시)
}
```

**설계 판단**: v2에서 Reminder가 Memo에 내장되므로, `MemoStore`가 리마인더 CRUD도 담당. 별도 `ReminderManager` 불필요. `StorageAdapter` 추상화도 불필요 — 키가 하나뿐이므로 직접 접근이 더 단순.

### 3.2 ReminderService

```
class ReminderService {
  constructor(memoStore: MemoStore)

  // ── State ──
  _store: MemoStore
  _pollTimer: number|null

  // ── Polling ──
  start()               → void    // 즉시 1회 check + setInterval(60000)
  stop()                → void    // clearInterval
  _check()              → void    // store.getDueReminders() → 각각 notify + markFired

  // ── Notification ──
  _notify(memo)         → void    // Web Notification 시도, 실패 시 toast fallback
  
  // ── Permission ──
  static isSupported()       → Boolean
  static async requestPermission()  → String  // "granted"|"denied"|"default"
}
```

**핵심**: ReminderService는 상태를 소유하지 않음. MemoStore에서 만기 항목을 조회하고, 알림 발송 후 `markFired()`를 호출할 뿐.

### 3.3 UIController

```
class UIController {
  constructor(memoStore: MemoStore, reminderService: ReminderService)

  // ── Initialization ──
  init()                → void    // DOM 참조 획득, 이벤트 바인딩, 최초 render

  // ── Rendering ──
  renderMemoList()      → void    // 메모 카드 그리드
  renderMemoDetail(id)  → void    // 편집 모달 표시
  renderSearchResults(q)→ void    // 검색 결과로 필터링된 리스트
  
  // ── Modal ──
  openEditor(id?)       → void    // id 있으면 수정, 없으면 새 메모
  closeEditor()         → void
  
  // ── Toast ──
  showToast(message)    → void    // in-app 알림 배너 (3초 자동 소멸)
  
  // ── Import/Export ──
  handleExport()        → void    // Blob → download link
  handleImport()        → void    // file input → FileReader → store.importJSON
  
  // ── Event Delegation ──
  _onListClick(e)       → void    // data-action 분기: edit, delete, toggle-reminder
  _onEditorSubmit(e)    → void    // 폼 제출 → store.create or store.update
  _onSearch(e)          → void    // 300ms debounce → renderSearchResults
}
```

**이벤트 위임 패턴**:
```js
this.listContainer.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.closest('[data-id]')?.dataset.id;
  // action별 분기
});
```

### 3.4 App (메인 컨트롤러)

```
class App {
  init() {
    1. const store = new MemoStore()
    2. const reminder = new ReminderService(store)
    3. const ui = new UIController(store, reminder)
    4. ui.init()
    5. store.onChange(() => ui.renderMemoList())
    6. reminder.start()
    7. document.addEventListener('visibilitychange', () => {
         if (!document.hidden) reminder._check()
       })
  }
}

// 진입점
document.addEventListener('DOMContentLoaded', () => new App().init());
```

---

## 4. 상태 관리 흐름

```
User Action (클릭/입력)
  → UIController 이벤트 핸들러
  → MemoStore.create/update/delete 호출
  → MemoStore: _memos 배열 변경 + _persist()
  → _persist(): localStorage.setItem('memoapp_data', ...) + listeners.forEach(cb())
  → UIController.renderMemoList(): 최신 상태로 DOM 갱신
```

```
setInterval (60초)
  → ReminderService._check()
  → MemoStore.getDueReminders() → 만기 메모 배열
  → 각 메모: _notify() + MemoStore.markFired()
  → _persist() → UI 자동 갱신 (리마인더 아이콘 상태 변경)
```

**원칙**:
- UIController는 MemoStore 상태를 직접 수정하지 않음 (항상 API 통해)
- MemoStore는 DOM을 모름
- 연결은 onChange 콜백으로만 (느슨한 결합)

---

## 5. UI 레이아웃

### 5.1 데스크톱 (≥768px): 2패널

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                  │
│  [MemoKeep]     [🔍 검색...]          [📥 Import] [📤]  │
├───────────────────────────────┬─────────────────────────┤
│  Memo List                    │  Memo Editor / Detail    │
│                               │  (선택 시 표시)          │
│  [+ 새 메모]                  │                          │
│                               │  제목: [_____________]   │
│  ┌────────────────────────┐   │                          │
│  │ 회의 메모          🔔  │   │  ┌──────────────────┐   │
│  │ 오후 3시 디자인...     │   │  │ 본문 textarea    │   │
│  │ 2분 전 수정            │   │  │                  │   │
│  └────────────────────────┘   │  └──────────────────┘   │
│                               │                          │
│  ┌────────────────────────┐   │  리마인더:               │
│  │ 쇼핑 목록              │   │  [날짜] [시간] [설정]   │
│  │ 우유, 빵, 계란...     │   │                          │
│  │ 1시간 전 수정          │   │  [삭제]       [저장]    │
│  └────────────────────────┘   │                          │
└───────────────────────────────┴─────────────────────────┘
```

### 5.2 모바일 (<768px): 단일 컬럼 + 모달

```
┌──────────────────────────┐
│ [MemoKeep]    [📥] [📤] │
│ [🔍 검색...]             │
├──────────────────────────┤
│ [+ 새 메모]              │
│                          │
│ ┌──────────────────────┐ │
│ │ 회의 메모        🔔  │ │
│ │ 오후 3시 디자인...   │ │
│ │ 2분 전               │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 쇼핑 목록            │ │
│ │ ...                  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

모바일에서 메모 클릭 시 **전체 화면 모달**로 편집기 표시.

### 5.3 메모 카드

```
┌─────────────────────────────────────┐
│  제목 (1줄, 말줄임)          [✕]   │
│  본문 미리보기 (2줄, 말줄임)        │
│                                     │
│  🔔 4/7 09:00  ·  2분 전 수정      │
└─────────────────────────────────────┘
```

- 🔔 아이콘: `reminder.datetime` 존재 시 표시 (F-08)
- 🔔 색상: 만기 전 = 주황, 만기+fired = 회색, 미설정 = 표시 안 함

### 5.4 Toast 알림 (in-app fallback)

```
┌──────────────────────────────────┐
│  🔔 "회의 메모" 리마인더 시간입니다 │
│                            [닫기] │
└──────────────────────────────────┘
```

화면 상단 고정, 3초 후 자동 소멸. 클릭 시 해당 메모 편집기 열기.

---

## 6. CSS 전략

시스템 폰트 스택, CSS 변수 기반 (다크 테마는 v2 범위 외이나 확장 가능하도록 변수 사용).

```css
:root {
  --bg-primary:    #ffffff;
  --bg-secondary:  #f8f9fa;
  --bg-card:       #ffffff;
  --text-primary:  #1a1a1a;
  --text-secondary:#666666;
  --border:        #e0e0e0;
  --accent:        #4a90d9;
  --reminder:      #f59e0b;   /* amber — 리마인더 강조 */
  --reminder-fired:#9ca3af;   /* gray — 발송 완료 */
  --danger:        #ef4444;
  --radius:        8px;
  --shadow:        0 1px 3px rgba(0,0,0,0.08);
  --font:          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

반응형: `@media (max-width: 767px)` → 단일 컬럼, 모달 전환.

---

## 7. Import/Export 상세

### Export (F-15)

```js
exportJSON() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    memos: this._memos
  };
  return JSON.stringify(data, null, 2);
}
// 트리거: Blob → URL.createObjectURL → <a download="memokeep_YYYY-MM-DD.json">
```

### Import (F-16)

```js
importJSON(jsonString) {
  const data = JSON.parse(jsonString);     // 실패 시 throw
  if (data.version !== 1 || !Array.isArray(data.memos)) {
    throw new Error('Invalid backup format');
  }
  // 스키마 기본 검증: 각 memo에 id, title, body 존재 확인
  this._memos = data.memos;
  this._persist();
}
// 트리거: <input type="file" accept=".json"> → FileReader → importJSON → re-render
```

**전체 교체 방식**: merge는 ID 충돌 처리 복잡. import 전 확인 다이얼로그 표시.

---

## 8. 알림 전략 상세

### 권한 요청 타이밍 (F-10)

페이지 로드 시 요청하지 않음. **사용자가 첫 리마인더를 설정할 때** 요청.

```
사용자: 리마인더 설정 클릭
  → Notification.permission === "default"?
    → requestPermission() 호출
    → granted → 정상 진행
    → denied → toast fallback 안내 메시지
  → "granted" → 바로 설정
  → "denied" → toast fallback 안내
```

### Fallback (F-11)

Web Notification 거부/미지원 시: `UIController.showToast(message)` 호출.  
Toast는 항상 발생 (Web Notification 성공 여부와 무관하게 앱 내 표시).

### 중복 방지 (F-12)

`reminderFired` 플래그가 핵심:
- `_check()` 시 `!reminderFired && datetime <= now` 조건만 처리
- 알림 발송 후 즉시 `markFired(id)` → `_persist()`
- 리마인더 시간 변경 시 `reminderFired = false`로 리셋

---

## 9. Accessibility (NF-04)

- Semantic HTML: `<header>`, `<main>`, `<aside>`, `<section>`, `<button>`, `<label>`
- `aria-label` on icon-only buttons (FAB "+", close "✕", delete)
- Keyboard navigation: Tab 순서 보장, Enter로 카드 선택, Escape로 모달 닫기
- Focus management: 편집기 열릴 때 제목 input에 autofocus
- 삭제 확인: `confirm()` 사용 (내장 접근성)
- 검색: `<input type="search">` + `role="search"` wrapper

---

## 10. DV 구현 순서 (권장)

| 단계 | 구현 항목 | 검증 기준 |
|------|-----------|-----------|
| 1 | HTML 스켈레톤 + CSS 변수 + 반응형 레이아웃 | 빈 화면이 데스크톱/모바일 양쪽 정상 렌더링 |
| 2 | `MemoStore` (CRUD + localStorage 영속성) | 콘솔에서 create/update/delete 후 새로고침 시 데이터 유지 |
| 3 | `UIController` — 메모 리스트 + 카드 렌더링 | 메모 목록 표시, 카드 클릭/삭제 동작 |
| 4 | `UIController` — 편집 모달 (생성/수정) | 새 메모 작성, 기존 메모 수정 + 저장 |
| 5 | 검색 (debounce 300ms) | 키워드 입력 시 필터링된 목록 표시 |
| 6 | `ReminderService` + 리마인더 UI (설정/해제) | 리마인더 설정 → 60초 내 알림 발생 |
| 7 | Toast fallback + 알림 권한 흐름 | 권한 거부 상태에서 toast 표시 확인 |
| 8 | Import/Export | JSON 내보내기 → 데이터 삭제 → JSON 가져오기 → 복원 확인 |
| 9 | 최종 통합 + visibilitychange + 엣지 케이스 | 탭 전환 후 만기 알림 즉시 발생 |

---

## 11. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| localStorage 5MB 제한 | 메모 수천 개 시 | try-catch + 용량 초과 경고. 일반 사용(수백 개)에는 충분 |
| 알림 권한 거부 | 리마인더 알림 무음 | toast fallback 상시 동작 (F-11) |
| 백그라운드 탭 throttle | setInterval 60s 이상 지연 | visibilitychange 보상 (D-4) |
| crypto.randomUUID 미지원 | 매우 구형 브라우저 | GitHub Pages 대상 = 모던 브라우저 전제. fallback 불필요 |
| 단일 파일 규모 | 유지보수 | ~600-800줄 예상. 1200줄 초과 시 분리 검토 |

---

## 12. 설계 판단 요약

| 결정 | 근거 |
|------|------|
| 단일 `index.html` | NF-01 제약 + `game/` 선례 + 예상 규모 관리 가능 |
| Reminder 내장 (1:1) | PM v2 데이터 모델. 독립 리마인더 불필요 → 구조 단순화 |
| `memoapp_data` 단일 키 | PM 명시. 키 1개 = 일관성 보장, export/import 단순 |
| `crypto.randomUUID()` | HTTPS 보장(GitHub Pages), 충돌 불가, 모던 브라우저 전제 |
| MemoStore/ReminderService/UIController 3-tier | 관심사 분리: 데이터 / 폴링+알림 / DOM |
| innerHTML + 이벤트 위임 | 코드량 최소화 + 리스너 누수 방지 |
| Observer 패턴 (onChange) | 느슨한 결합. Store가 UI를 모름 |
| 60s polling + visibilitychange | 분 단위 정밀도 + 탭 비활성 보상 |
| Import = 전체 교체 | merge 복잡도 회피. 백업/복원 시맨틱 |
| 알림 권한: 첫 리마인더 설정 시 요청 | UX 최적화. 페이지 로드 즉시 요청은 사용자 거부율 높음 |
