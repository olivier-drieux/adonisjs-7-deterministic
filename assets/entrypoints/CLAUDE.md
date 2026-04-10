# Project Instructions

<!-- BEGIN adonisjs-7-deterministic:managed -->
## AdonisJS 7 Deterministic — Skill obligatoire

Avant **toute** tâche d'implémentation ou de review sur ce projet :

1. Invoquer le skill `$adonisjs-7-deterministic`
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
<!-- END adonisjs-7-deterministic:managed -->
