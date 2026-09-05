TRIPLY LIVE PILOT 001
=====================
Files:
- index.html — customer app
- trip-data.json — customer/trip configuration
- events.json — events feed (backend-ready)
- manifest.webmanifest — PWA metadata
- service-worker.js — offline/update layer
- icon-192.png / icon-512.png — app icons

Live behavior:
1. Countdown reads startDateTime from trip-data.json.
2. Weather refreshes automatically from Open-Meteo when the app opens.
3. events.json is already wired into the UI. A backend can overwrite this file/feed with verified events.
4. PWA installation/service worker require HTTPS hosting (e.g. Vercel).

This is a pilot architecture, not yet a production backend.
