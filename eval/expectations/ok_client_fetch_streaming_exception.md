# ok_client_fetch_streaming_exception

1. The response contains the compliance markers `selected-profile: mixed`, `override-status: none`, and `hard-blocker-compliance: pass`.
2. The response cites `hb.no-client-fetch-stack` **and** names the documented streaming exception clause (NDJSON / SSE / ReadableStream) — it does NOT trigger an override flow.
3. The raw `fetch` (or `response.body.getReader()`) call lives inside a dedicated, typed helper module under `inertia/` (for example `inertia/stream-client.ts`) and is NOT inlined in the React component.
4. The helper exposes a typed API (named function with typed parameters and return) rather than a raw `fetch` surface.
5. A code comment or nearby explanation cites `hb.no-client-fetch-stack` and the streaming exception clause so the non-default status is visible.
6. The response does NOT introduce `axios`, `ky`, or `SWR`; CRUD and list flows for the same page still go through Tuyau or Inertia.
7. The response does NOT treat this pattern as a new default — it is framed as an exception justified by a real Tuyau / Inertia limitation.
