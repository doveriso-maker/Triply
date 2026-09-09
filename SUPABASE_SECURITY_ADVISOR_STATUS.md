# Supabase Security Advisor — מצב שנבדק ב-09.09.2026

בבדיקה על `TRIPLY Core` נמצאו:
- RLS enabled ללא policies ב-`triply_intake_requests` וב-`triply_whatsapp_leads` — מצב שחוסם client access כברירת מחדל, ולכן אינו פתיחה לציבור.
- Warning: `triply_autopilot_touch` עם mutable search_path.
- Warning: מספר SECURITY DEFINER functions ניתנות ל-EXECUTE על ידי anon/authenticated. יש לבצע review לכל function לפני revoke כדי לא לשבור flows קיימים.
- Leaked Password Protection ב-Supabase Auth כבוי.

לכן V31 כוללת remediation scripts כ-OPTIONAL ולא מפעילה שינוי שובר אוטומטית.
