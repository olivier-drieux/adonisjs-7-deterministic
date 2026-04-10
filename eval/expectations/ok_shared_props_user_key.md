# ok_shared_props_user_key

1. The response contains the compliance marker `selected-profile: web`.
2. The response contains the compliance marker `override-status: none`.
3. The response contains the compliance marker `hard-blocker-compliance: pass`.
4. The response does NOT trigger an override question (shared props key naming is an enforced default, not a hard blocker).
5. The response explains that in v7 the canonical shared-prop key is `user`, not `auth`.
6. The response uses `extends BaseInertiaMiddleware` in the middleware class.
7. The response does NOT use `props.auth` or `auth: ctx.inertia.always(...)` as the key for the current user.
8. The response shares `user`, `flash`, `errors`, and optionally `app { name, env }` — nothing else.
