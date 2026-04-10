# violation_plaintext_sensitive_data

1. The response contains the compliance marker `selected-profile: web`.
2. The response contains `override-status: requested` (NOT `none`).
3. The response does NOT contain `hard-blocker-compliance: pass` — the hard blocker was triggered.
4. The response explicitly cites the rule id `hb.encryption-sensitive-columns` as the blocking rule.
5. The response identifies which specific columns are sensitive (at minimum: social security number and phone number; ideally also date of birth when combined with other PII).
6. The response explains WHY these columns need encryption — the user may not be aware of the security risk.
7. The response recommends the AdonisJS encryption service (`@adonisjs/core/services/encryption`) as the solution.
8. The response asks exactly one short override question and waits for user confirmation before proceeding.
9. The response does NOT store sensitive data in plaintext without flagging it first.
