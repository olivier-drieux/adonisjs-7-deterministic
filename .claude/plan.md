# Plan d'amélioration du skill adonisjs-7-deterministic

## Changements implémentés

### Phase 1 — Corrections et cohérence ✅

1. **3 hard blockers ajoutés dans `sync_contract.core_blocker_ids`** : `hb.data-stack`, `hb.official-side-effect-packages`, `hb.no-express-fastify-composition` sont maintenant dans le core, propagés dans SKILL.md, les wrappers, et openai.yaml.

2. **manifest.yaml renommé en manifest.json** : toutes les références mises à jour (SKILL.md, scripts, wrappers, README, plan).

3. **Scripts corrigés** :
   - `validate_snippets.mjs` : FENCE_RE accepte `typescript` en plus de `ts|tsx` ; pattern `fetch(` utilise un negative lookbehind pour éviter les false positives (`prefetch(`, `refetch(`).
   - `score_eval.mjs` / `catalog.mjs` : `countQuestions()` ignore les `?` dans les blocs de code fencés.
   - `validate_sync.mjs` : vérifie que TOUS les hard blockers du manifest sont dans SKILL.md et dans `core_blocker_ids`.
   - `validate_snippets.mjs` : scanne aussi `references/patterns/*.md`.

### Phase 2 — Couverture eval ✅

4. **4 nouveaux cas eval** :
   - `violation_data_stack.json` : demande Prisma au lieu de Lucid.
   - `violation_side_effect_packages.json` : demande CASL au lieu de Bouncer.
   - `violation_api_only_session_auth.json` : session auth en profil api-only.
   - `violation_express_composition.json` : Express-style middleware chain.

5. **`test_ids` mis à jour** dans le manifest pour `hb.data-stack`, `hb.official-side-effect-packages`, `hb.no-express-fastify-composition`, et `hb.access-tokens-external`.

### Phase 3 — Documentation et portabilité multi-agent ✅

6. **Wrappers rendus autonomes** : les 3 wrappers (claude.md, codex.md, vscode.instructions.md) contiennent maintenant le protocole complet, les 19 hard blockers avec leurs statements, les profils, et les règles d'override. Un agent qui ne lit que le wrapper peut appliquer la doctrine.

7. **Points d'entrée natifs** créés dans `assets/entrypoints/` :
   - `.cursorrules` pour Cursor
   - `copilot-instructions.md` pour GitHub Copilot
   - `AGENTS.md` pour Codex / opencode

8. **`FORBIDDEN.md`** : table plate forbidden/alternative lisible par n'importe quel agent.

9. **`references/transformers.md`** : convention transformer complète.

10. **`references/examples.md`** : 6 exemples few-shot d'interactions (prompt → comportement attendu).

11. **`patterns.md` splitté** en 5 fichiers ciblés dans `references/patterns/` :
    - `crud-web.md`, `auth-flow.md`, `api-resource.md`, `frontend-bootstrap.md`, `advanced.md`
    - L'ancien `patterns.md` est devenu un index avec table de contenu.

12. **README mis à jour** avec les instructions d'installation pour chaque agent.

## Validation

Tous les scripts passent : 55 snippets, 43 rules, 19 hard blockers, 23 eval cases, sync aligné.
