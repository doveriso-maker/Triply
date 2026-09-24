# NAVIGAM PREMIUM V2

The approved source is preserved on branch `PREMIUM_V2_STABLE_20260924`, commit `ff1fe03c8f7675dd59671f1348bb0c02ec9a5c55`.
Approved HTML SHA-256: `78b1b9b19ec125fbfe6641ec49b65c5cce22a8dad42a5a7b1c46fef04ef280cf`.

The NEXT engine extracts the approved CSS, three identical embedded PNG assets, UI components and language packs into reusable files. Customer data is fetched only after server authorization and normalized by `preview/adapter.js`. The shell contains no customer code or itinerary.

Entry: `/p/{code}` → `preview/index.html`. Boot checks `triply-preview-app`, loads the canonical shell modules and revalidates access. A separate monotonic deadline closes access while a slow refresh is pending. No device clock or cached response can grant authorization. Legacy service worker authorization caches are purged.

The server retains legacy response fields and adds normalized destination, party, days, images and feature data. Destination assets belong in its registry, keyed by stable place IDs. The approved UI is shared by all customers. Add destinations through data, never a copied customer HTML file.

Map pins use itinerary item/place identity. Unknown accommodation remains a listed stop without a fabricated pin. Registry coordinates were checked against place/operator and map sources; area-center coordinates remain approximate and are not promised as entrance locations. The line indicates visit order, not a verified walking or driving route. Google provides the complete external route and mobile segments; Waze provides individual navigation.

Live translation uses MyMemory and browser speech APIs. Weather uses Open-Meteo and shows trip forecasts only within seven days. Currency uses Frankfurter. Avia preview answers are explicitly a demonstration from trip data. Preview offline storage retains local preferences. An already authorized visible trip can continue in memory through a transport outage only until the existing server-derived hard deadline. Opening, reloading, or restoring the protected trip requires server authorization; outages cannot renew or extend it.

Verification includes backend auth/expiry and metadata filtering, shell/adapter DOM integration, locale checks, stable-image identity, six map pins/seven stops, compact failure states, live-service error states, scoped Vercel headers and service-worker cache exclusions. Run `tests/preview-engine.test.cjs` with jsdom available and an authorized API JSON fixture path as its first argument.

Promotion to `PREMIUM_V2_STABLE` follows actual public-URL visual QA. Physical Android Chrome microphone/audio verification must be recorded separately and must not be inferred from a desktop responsive viewport.

Rollback: restore the backed-up frontend commit and, if needed, deploy `supabase/backups/triply-preview-app-v13.ts`. The previous frontend used embedded customer data and cached authorization; prefer reverting isolated presentation regressions while retaining the new authorization boundary.


## Production verification — 24 September 2026

The actual public preview was visually checked in a 390 × 844 same-origin frame, with the approved splash and start action, Arabic layout, destination and dates, all seven itinerary entries, eight locked days, six located map pins, Google route and Waze targets, fixed centered Avia navigation, saved places, checklist, live currency and current weather, and the honest distant-trip forecast state. The accommodation/rest entry has no supplied location and is listed without an invented pin.

All 15 place cards and the hero were also loaded and visually checked in the public mobile viewport, with distinct image URLs and no broken-image fallbacks.

An expired QA record produced the real Arabic premium expiry screen and was then deleted. The active customer expiry was not extended. Backend v16 serves 15 unique self-hosted place photos and the approved hero; all 16 files were checked on the public domain for successful responses, image MIME types and exact byte hashes. Arabic-to-Turkish and reverse text translation were exercised in the public UI, including the provider's previously empty greeting response.

The original embedded map failure was traced to CSP blocking its external Leaflet dependency. Leaflet is now served from the same origin. Failed map loading retains a compact explanation and stop/navigation list.

Desktop responsive checks do not constitute physical Android Chrome testing. Device microphone capture, installed speech voices and audible playback remain unverified. The engine remains PREMIUM_V2_NEXT; PREMIUM_V2_STABLE has not been promoted.

The synthetic boot regression suite (`tests/preview-boot.test.cjs`, with jsdom available) covers transport-only continuity, the unchanged hard deadline, denials and malformed responses, script timeouts, and fresh authorization after visibility/BFCache restore. Network loss was simulated in this suite; it was not presented as a physical-device test.
