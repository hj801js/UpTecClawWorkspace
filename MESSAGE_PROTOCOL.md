# Message Protocol

Message formats for inter-agent communication. Used in internal chat DMs.

## Short Message

Used for simple confirmations, approvals, status changes, etc., where a formal format is unnecessary.

```
[Short] To: @TargetAgent | From: SenderAgentName | Subject: Title | Status: Done/Approved/Confirmed | Summary: One-line summary
```

## Request

```
[Request]
To: @TargetAgent
From: SenderAgentName
Date: YYYY-MM-DD HH:MM
Subject: Request title
Type: Task | Investigation | Review(RV) | Other
Priority: Urgent | High | Normal | Low

---
Details:
(Describe the request in detail)

Conditions/Constraints:
- (Describe if applicable)

Deadline: YYYY-MM-DD or Immediate
Notes: (Additional remarks)
```

## Report

```
[Report]
To: @RequestingAgent
From: ReportingAgentName
Date: YYYY-MM-DD HH:MM
Subject: Report title (reference the Request subject)
Status: Done | In Progress | On Hold | Failed

---
Result:
(Describe the outcome in detail)

Changes:
- (File/config change history)

Verification:
- (Verification method and results)

Unresolved:
- (Remaining items, or "None")

Notes: (Additional remarks)
```
