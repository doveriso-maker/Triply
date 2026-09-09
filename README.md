# TRIPLY V32 SECURE + PWA — GitHub Ready

זו גרסת המשך ל-V30, עם שכבת אבטחה ו-PWA.

## מבנה
- `/index.html` — אתר TRIPLY V30, ללא שינוי עיצובי מהותי; ה-Logo הוצא מ-base64 לקובץ פיזי.
- `/privacy.html` — פרטיות ואבטחת מידע.
- `/app/` — אפליקציית לקוח PWA.
- `/backend/functions/` — Edge Functions לאפליקציה, פרסום מאובטח, מסמכים זמניים, Cleanup ו-Agent Data API.
- `/backend/supabase/migrations/` — migrations additive + תיקוני hardening אופציונליים.
- `/vercel.json` — Security Headers + routing.
- `package.json`, `capacitor.config.ts` — הכנה ל-Android/iOS.

## Deployment
1. העלה את כל תוכן ה-ZIP ל-GitHub.
2. Deploy ל-Vercel מה-root.
3. ב-Supabase: migration 001 כבר תואם לשכבה שהוכנה. migration 002 נועד לשכבת Audit/Transient Docs.
4. Deploy functions עם Secrets בצד השרת בלבד.
5. צור bucket פרטי `triply-transient-docs`.
6. חבר בממשק הניהול: Preview -> Publish App -> Send to Client.
7. אחרי שכל האפליקציות עוברות Token, שקול להריץ optional/003 לביטול legacy public read.

## חשוב
אין להכניס Service Role Key או Secrets ל-HTML, JS ציבורי, GitHub public repo או localStorage.


## V32 live hardening
See `LIVE_SECURITY_STATUS.md`. Supabase-side hardening has already been applied and tested. No integration secret plaintext is committed to this repository.
