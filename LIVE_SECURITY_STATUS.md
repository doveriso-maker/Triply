# TRIPLY V32 — Live Security Status

Checked and applied on 2026-09-09 against Supabase project `TRIPLY Core`.

## Live changes applied
- Token-only customer app access is active through `triply-client-app`.
- Legacy public RLS policies for published trips were removed.
- Raw intake attachments are no longer persisted by `triply-intake` (v6).
- WhatsApp webhook token is no longer hard-coded in Edge Function source; only its SHA-256 hash is stored server-side.
- WhatsApp lead retention is structured-only: raw payload, raw transcript and free-form summary are scrubbed/not retained.
- Private transient-document bucket + job metadata + audit log are active.
- `triply-document-init`, `triply-document-finalize`, `triply-document-cleanup` and `triply-client-publish` are ACTIVE.
- Expired transient documents are cleaned automatically every 5 minutes by `pg_cron`.
- Cleanup endpoint custom authentication was tested live and returned HTTP 200.
- Unauthenticated access tests returned HTTP 401 for client app, WhatsApp webhook and document-init endpoints.
- Anonymous EXECUTE access to SECURITY DEFINER RPCs was removed.
- Internal SECURITY DEFINER RPCs were removed from the `authenticated` role; authenticated access remains only for admin RPCs and `is_triply_admin()`, each of which checks admin status internally.
- Function search_path warning was hardened.

## Storage state at verification
- Legacy persistent original document objects: 0
- `trip_documents` rows: 0
- Pending transient document jobs: 0

## Remaining Supabase advisor item
`Leaked Password Protection` is still disabled. This setting belongs to Supabase Auth configuration and is not writable through the connected management tools used for this deployment. Enable it in Supabase Dashboard → Authentication → Security / Password Security.

## Intentional advisor INFO/WARN
- Server-only RLS tables have RLS enabled with no client policies by design (deny-by-default).
- Admin SECURITY DEFINER RPCs remain callable by authenticated users, but each checks `is_triply_admin()` internally.
