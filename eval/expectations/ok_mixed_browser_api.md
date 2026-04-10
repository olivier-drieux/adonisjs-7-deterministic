# ok_mixed_browser_api

1. The response contains the compliance marker `selected-profile: mixed`.
2. The response contains the compliance marker `override-status: none`.
3. The response contains the compliance marker `hard-blocker-compliance: pass`.
4. The response does NOT trigger an override question.
5. The response creates separate controllers for web (Inertia) and API (/api) surfaces — they are never the same controller.
6. The browser-called /api routes stay on session auth (not bearer tokens), because the caller is the same application.
7. The Inertia page controllers return `inertia.render(...)` and the API controllers return JSON via `serialize(...)`.
