# ok_web_standard

1. The response contains the compliance marker `selected-profile: web`.
2. The response contains the compliance marker `override-status: none`.
3. The response contains the compliance marker `hard-blocker-compliance: pass`.
4. The response does NOT trigger an override question — it proceeds directly.
5. The response references Inertia React pages, Mantine components, session auth, Lucid models, VineJS validators with `request.validateUsing(...)`, a service, a policy, a transformer, redirect plus flash feedback, and functional tests.
6. The response follows the canonical build order: migration → model → validator → policy → service → transformer → controller → routes → tests → UI.
7. The response does NOT use `any`, `request.all()`, `request.only()`, raw `fetch`, `axios`, `@mantine/form`, `react-hook-form`, or a repository layer.
