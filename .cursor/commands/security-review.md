# Security Review

Launch a **security-review** subagent when changes touch auth, payments, E2EE, webhooks, or GDPR flows.

## When to use

- JWT, roles, protected routes
- PayPal / IAP / subscription validation
- Life Context / personality E2EE
- Webhook signature verification
- Data export, erasure, retention

Also consult `.cursor/skills/meaningful-conversations/gdpr-compliance/SKILL.md`.

## Invocation

- `subagent_type`: `security-review`
- `run_in_background`: `false`
- `description`: `Security Review`

Use this prompt shape:

```text
Full Repository Path: /Users/gherold/Meaningful-Conversations-Project
Diff: branch changes
```

Add `Custom Instructions:` only if the user gave specific review focus.

## After review

1. Summarize security findings.
2. Apply fixes or document accepted risks in the relevant skill/docs.
3. Stay in **PLAN mode** until user types `ACT`.
4. Subagents must **not** commit, push, or deploy.
