# Review-Deploy Pipeline

## Flow

1. OR -> RV: Deliver deliverable path and review request
2. RV: Evaluate (score X.X/10.0 + feedback)
3. Score >= threshold -> OR -> DO: Issue deploy instruction
4. Score < threshold -> OR -> DV: Forward RV feedback, DV revises and resubmits for review

## Threshold Rules
- Initial threshold: 9.0/10.0
- After 10 consecutive failures to meet threshold -> lower threshold by 1.0 (9.0 -> 8.0 -> 7.0 -> ...)
- Track review count and threshold per project

## RV Evaluation Format
```
## Review Result
Score: X.X/10.0
Categories: Accuracy(X) Quality(X) Testing(X) Security(X) Requirements(X)
Feedback: (Specific improvements)
Conclusion: PASS / FAIL
```

## Error Escalation
1. Blocker occurs -> Record `Blocked` in STATUS.md
2. Report to OR -> Submit report (Failed/On Hold)
3. OR decides -> Reassign or escalate to user
4. User escalation -> Notify via Slack
