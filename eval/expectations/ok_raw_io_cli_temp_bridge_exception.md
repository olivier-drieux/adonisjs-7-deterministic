# ok_raw_io_cli_temp_bridge_exception

1. The response contains the compliance markers `selected-profile: api-only`, `override-status: none`, and `hard-blocker-compliance: pass`.
2. The response cites `hb.no-raw-io-and-timers` **and** names the documented temp-bridge exception clause — it does NOT trigger an override flow.
3. The raw `fs` write lives inside an **Ace command** (or equivalent subprocess adapter), never inside an HTTP controller, middleware, or Inertia page action.
4. The temp path is built from `os.tmpdir()` with a unique suffix (`randomUUID`, `cuid`, or an equivalent collision-safe generator).
5. The file is removed in a `finally` block (or an equivalent guaranteed-cleanup path). No persistent state survives the subprocess call.
6. The response does NOT route this workload through `@adonisjs/drive` — the doctrine explicitly carves out Drive for persistent application storage, not ephemeral subprocess bridges.
7. A code comment or nearby explanation cites `hb.no-raw-io-and-timers` and the temp-bridge exception clause so the non-default status is visible.
8. The response does NOT use `setInterval`, unbounded `while (true)` polling, or raw `nodemailer` for unrelated side effects.
