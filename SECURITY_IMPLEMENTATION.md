# TRIPLY V31 — SECURITY IMPLEMENTATION

## מה נכנס לגרסה
1. **PWA / אפליקציית לקוח** — קישור אישי, מצב Standalone, Service Worker שלא שומר API/Supabase responses.
2. **Token אישי לאפליקציה** — Token אקראי של 32 bytes; במסד נשמר רק SHA-256 Hash.
3. **אין Customers / Documents ב-Client API** — endpoint הלקוח מחזיר רק נתוני טיול שנדרשים לתצוגה.
4. **מסמכים אישיים זמניים בלבד** — init -> private transient storage -> extraction -> finalize מוחק את המקור ושומר רק `extracted_fields`.
5. **Cleanup** — קבצים שלא הסתיימו נמחקים לפי TTL קצר (ברירת מחדל 30 דקות).
6. **Least Privilege** — מנהל מפרסם קישור דרך endpoint עם JWT; WhatsApp/Agent עובד דרך API מצומצם עם Actions מוגדרים ולא דרך SQL פתוח.
7. **Audit** — טבלת `security_audit_events` לפעולות אבטחה בלי תוכן מסמך מקורי.
8. **Vercel headers** — HSTS, CSP, nosniff, frame deny, permissions policy, referrer policy.
9. **Privacy page** — מדיניות מוצר ברורה לגבי מסמכים, שמירה ומחיקה.
10. **Capacitor-ready** — אותה אפליקציה מוכנה לעטיפה Native.

## מה לא מבוצע אוטומטית כדי לא לשבור Production
- מדיניות ה-RLS הישנה שמאפשרת Public Read לטיולים `published` לא מוסרת אוטומטית. קובץ `optional/003...` מוכן לאחר מעבר הלקוחות ל-Token.
- תיקוני EXECUTE לכל SECURITY DEFINER RPC דורשים בדיקת callers לפני החלתם.
- Leaked Password Protection הוא Setting של Supabase Auth ויש להפעיל אותו בקונסול/כלי מתאים.
- יש ליצור bucket פרטי בשם `triply-transient-docs` ולהגדיר Secrets לפני הפעלת פונקציות המסמכים.

## Secrets — לעולם לא בדפדפן
- `SUPABASE_SERVICE_ROLE_KEY`
- `TRIPLY_INTERNAL_SECRET`
- `TRIPLY_AGENT_API_SECRET`

## עיקרון מסמכים
המקור אינו מסמך קבוע במערכת. הוא קובץ עבודה זמני בלבד. לאחר extraction מוצלח: delete storage object -> clear storage path -> save structured fields -> audit deletion.
