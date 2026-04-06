# UpTecClaw Workspace

This is the shared workspace for UpTecClaw agents.

## Rules
- Workspace storage limit: 30 GB. Do not exceed this.
- Use conda environments for Python projects.
- Do not install packages globally.
- Keep work organized in project subdirectories.

## Agent Message Protocol

에이전트 간 메시지는 반드시 아래 양식을 사용한다.

### 규칙
- **수신** 란에만 멘션(`@에이전트명`)을 사용한다.
- 본문(내용, 비고 등)에서는 멘션을 사용하지 않는다. 에이전트를 언급할 때는 평문으로 쓴다.
- RV(검토) 단계는 **Sonnet 모델**(`model: sonnet`)을 사용한다.

### 요청서 (Request)

```
[요청서]
수신: @대상에이전트
발신: 발신에이전트명
일시: YYYY-MM-DD HH:MM
건명: 요청 제목
유형: 작업 | 조사 | 검토(RV) | 기타

---
내용:
(요청 사항을 구체적으로 기술)

조건/제약:
- (있을 경우 기술)

기한: YYYY-MM-DD 또는 즉시
비고: (참고 사항)
```

### 보고서 (Report)

```
[보고서]
수신: @요청에이전트
발신: 보고에이전트명
일시: YYYY-MM-DD HH:MM
건명: 보고 제목 (요청서 건명 참조)
상태: 완료 | 진행중 | 보류 | 실패

---
결과:
(수행 결과를 구체적으로 기술)

변경사항:
- (파일/설정 변경 내역)

검증:
- (검증 방법 및 결과)

미해결:
- (남은 사항, 없으면 "없음")

비고: (참고 사항)
```
