# Project Instructions

<!-- BEGIN adonisjs-ai-doctrine:managed -->
## AdonisJS 7 Deterministic — Skill obligatoire

Avant **toute** tâche d'implémentation ou de review sur ce projet :

1. Invoquer le skill `$adonisjs-ai-doctrine`
2. Suivre le protocole : `select-profile` → `load-targeted-references` (lookup `reference_slices` dans le manifest) → `list-applicable-hard-blockers` → `detect-conflicts` → `ask-one-override-question` si conflit → `run-final-compliance-check`
3. Toujours produire les markers de sortie :
   - `selected-profile: <web|mixed|api-only>`
   - `override-status: none|requested|approved`
   - `hard-blocker-compliance: pass|override`

### Rappels critiques

- Avant de coder une feature, vérifier https://packages.adonisjs.com/ puis https://www.npmjs.com/
- Pages Inertia : typer avec `InertiaProps<{...}>` + `Data.*` de `@generated/data`, jamais d'interface inline
- Données sensibles : l'agent doit détecter proactivement et chiffrer avec `@adonisjs/core/services/encryption`
- Jobs background : utiliser `@adonisjs/queue`, pas de BullMQ brut
- Styling : CSS Modules (`.module.css`), pas de Tailwind ni styled-components
- Composants : toujours Mantine sauf besoin complexe sans équivalent
- Validation : `vine.create({...})` + `request.validateUsing(...)`, jamais `request.all()`
- Apps `mixed` avec ≥ 2 des cinq surfaces montées (`web`, `api.internal`, `api.external`, `webhooks`, `runtime`) : scinder les routes un fichier par surface (`start/routes.ts` pour `web`, `start/routes/<surface>.ts` pour les autres — y compris `start/routes/runtime.ts` pour `/mcp`, `/health` et autres endpoints d'infrastructure), enregistrés dans `adonisrc.ts` `preloads` via `node ace make:preload routes/<surface> --environments=web`. Interdit d'empiler tout dans un seul `start/routes.ts`.
- **Avant tout refactor de routing** (`hb.http-surface-inventory`) : lire `start/routes.ts` et tous ses imports transitifs + les fichiers préchargés par `adonisrc.ts`, énumérer chaque route montée, détecter les déclarations atypiques (`router.on`, `router.any`, `router.route`, closures, healthchecks, endpoints `/mcp`, ponts opérateur), classer chaque route par RÔLE (appelant, but) et non par préfixe d'URL, et produire une table des surfaces **avant** d'écrire du code. Une route qui n'entre pas dans `web` / `api.internal` / `api.external` / `webhooks` appartient à la surface `runtime` — jamais absorbée silencieusement dans `api.internal` ou `api.external` juste parce qu'elle renvoie du JSON.
<!-- END adonisjs-ai-doctrine:managed -->
