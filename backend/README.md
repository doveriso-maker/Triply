# AVIA WhatsApp backend

This directory tracks the AVIA intake and follow-up services previously maintained only in Supabase.

## Deployment

Deploy each function with its own index.ts and the shared `whatsapp-policy.mjs`, retaining their relative paths. Both functions retain custom token authentication; `verify_jwt` is false. Apply migrations through the normal Supabase migration process.

The follow-up destination is read from the existing server-only `internal_runtime_secrets` table under `triply_followup_automation_url`. Provision this setting privately for a new environment; never commit its value. The existing deployment has been provisioned. Keep RLS and server-only access on this table.

## Behavior

- Preserve the launch price and V9 questionnaire.
- Require app consent, destination and valid departure/return dates before a payment reminder.
- Preserve verified payment when a delayed intake event arrives.
- Suppress follow-ups for opt-out, human handling, safety holds, supplier conversations and paid/closed leads.
- Preserve suppression flags across incomplete extraction. Human handoff release must be a deliberate operator action after handling the request; ordinary extraction cannot clear it.
- Use supported customer language, with no Hebrew fallback when language is unknown.
- Retain the existing one-minute conversation inactivity plus 119-minute scheduling interval.
- Avoid blind retries after ambiguous send responses; an accepted automation request is not a delivery receipt.

## Verification

Run `node --test backend/tests/*.test.mjs` with Node 24 or newer. Readiness tests also verify that the existing V9 email requirement is enforced consistently by intake and SQL.
The guard migration was also validated with an isolated temporary table and synthetic rows. No customer messages or payment documents are created by these tests.

## Remaining integration limits

The dispatcher now reads live Autocalls AI enablement after claiming each reminder, then rechecks the local profile before sending. A paused, missing or unverifiable conversation is not sent a reminder. A failed state read may be retried up to three attempts; this never retries an outgoing message. A human action after the last read still remains a race. The automation endpoint currently acknowledges acceptance rather than returning a confirmed WhatsApp delivery receipt.

The Vercel connector cannot access the current team scope. Public HTTP checks do not validate protected project settings, deployment logs or the complete client journey. Do not describe this audit as full end-to-end certification.

`functions/autocalls-state.mjs` is active in the deployed dispatcher. The account API key is stored only in `internal_runtime_secrets` under `triply_autocalls_api_key`. Authenticated provider reads verified an enabled and a paused conversation. The REST response uses the assistant UUID, unlike the integer identifier exposed by the management connector; the guard uses the verified UUID. Never commit credentials. A pre-send read cannot make the third-party send operation atomic with human takeover.
