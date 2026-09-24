# NAVIGAM PREMIUM V2

The approved source is preserved on branch `PREMIUM_V2_STABLE_20260924`, commit `ff1fe03c8f7675dd59671f1348bb0c02ec9a5c55`.
Approved HTML SHA-256: `78b1b9b19ec125fbfe6641ec49b65c5cce22a8dad42a5a7b1c46fef04ef280cf`.

The NEXT engine extracts the approved CSS, three identical embedded PNG assets, UI components and language packs into reusable files. Customer data is fetched only after server authorization and normalized by `preview/adapter.js`. The shell contains no customer code or itinerary.

Entry: `/p/{code}` → `preview/index.html`. Boot checks `triply-preview-app`, loads the canonical shell modules and revalidates access. A separate monotonic deadline closes access while a slow refresh is pending. No device clock or cached response can grant authorization. Legacy service worker authorization caches are purged.

The server retains legacy response fields and adds normalized destination, party, days, images and feature data. Destination assets belong in its registry, keyed by stable place IDs. The approved UI is shared by all customers. Add destinations through data, never a copied customer HTML file.

Map pins use itinerary item/place identity. Unknown accommodation remains a listed stop without a fabricated pin. Curated coordinates inherited from the approved file are approximate. The line indicates visit order, not a verified walking or driving route. Google provides the complete external route and mobile segments; Waze provides individual navigation.

Live translation uses MyMemory and browser speech APIs. Weather uses Open-Meteo and shows trip forecasts only within seven days. Currency uses Frankfurter. Avia preview answers are explicitly a demonstration from trip data. Preview offline storage retains local preferences; opening the protected trip requires server authorization.

Verification includes backend auth/expiry and metadata filtering, shell/adapter DOM integration, locale checks, stable-image identity, six map pins/seven stops, compact failure states, live-service error states, scoped Vercel headers and service-worker cache exclusions. Run `tests/preview-engine.test.cjs` with jsdom available and an authorized API JSON fixture path as its first argument.

Promotion to `PREMIUM_V2_STABLE` follows actual public-URL visual QA. Physical Android Chrome microphone/audio verification must be recorded separately and must not be inferred from a desktop responsive viewport.

Rollback: restore the backed-up frontend commit and, if needed, deploy `supabase/backups/triply-preview-app-v13.ts`. The previous frontend used embedded customer data and cached authorization; prefer reverting isolated presentation regressions while retaining the new authorization boundary.
