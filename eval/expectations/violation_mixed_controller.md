# violation_mixed_controller

1. The response contains the compliance marker `selected-profile: mixed`.
2. The response contains `override-status: requested` (NOT `none`).
3. The response does NOT contain `hard-blocker-compliance: pass` — the hard blocker was triggered.
4. The response explicitly cites the rule id `hb.web-api-controller-separation` as the blocking rule.
5. The response asks exactly one short override question and waits for user confirmation before proceeding.
6. The response does NOT provide implementation code for the blocked path. It stops after the override question.
7. The override question is a single, clear sentence — not a multi-paragraph explanation.
