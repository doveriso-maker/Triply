TRIPLY CORE V1
==============
Architecture:
- One Vercel app for every customer trip.
- Public route: /trip/{trip_code}
- Trip 001: /trip/001
- Trip data is loaded from Supabase through get_public_trip RPC.
- Sensitive customer/contact data is not returned to the public app.
- Weather: Open-Meteo live.
- Events/Festivals: Vercel live radar API.
- Shopping/Deals: Vercel live radar API.
- PWA/offline fallback remains enabled.
- Local trip-data.json is fallback only.

Supabase project: TRIPLY Core
Public client uses a Supabase publishable key (safe for browser use when access is restricted).

V1.1: events/shopping moved to Supabase Edge Functions. No /api folder required in GitHub.
