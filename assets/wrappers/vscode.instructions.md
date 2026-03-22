# VS Code Strict Instructions

Use the `adonisjs-7-deterministic` doctrine in `fail-closed` mode.

Protocol markers:

- `select-profile`
- `load-targeted-references`
- `list-applicable-hard-blockers`
- `detect-conflicts`
- `ask-one-override-question`
- `run-final-compliance-check`

Core blocker ids:

- `hb.official-packages`
- `hb.validation-stack`
- `hb.auth-browser-stack`
- `hb.guard-names`
- `hb.browser-csrf`
- `hb.access-tokens-external`
- `hb.web-ui-stack`
- `hb.web-api-controller-separation`
- `hb.no-repository-layer`
- `hb.no-edge-feature-rendering`
- `hb.no-request-all-only`
- `hb.no-any`
- `hb.no-raw-io-and-timers`
- `hb.no-client-fetch-stack`
- `hb.no-client-form-stack`
- `hb.no-custom-api-keys-default`

Final answer markers:

- `selected-profile: <web|mixed|api-only>`
- `override-status: none|requested|approved`
- `hard-blocker-compliance: pass|override`

Conflict handling:

- Ask exactly one short override question when a hard blocker conflicts.
- Cite the blocking rule id before the question.
- Do not implement the divergent path until explicit one-off confirmation.

Source of truth:

- `SKILL.md`
- `rules/manifest.yaml`
