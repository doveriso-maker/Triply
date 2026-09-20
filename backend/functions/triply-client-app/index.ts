import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const DEFAULT_ALLOWED = new Set([
  "https://mytriply.co.il",
  "https://www.mytriply.co.il",
  "https://app.mytriply.co.il",
  "https://triply-russian-triply2.vercel.app",
  "https://triply-arabic-triply2.vercel.app",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost"
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const configured = (Deno.env.get("TRIPLY_CLIENT_ORIGINS") || "").split(",").map(v => v.trim()).filter(Boolean);
  const allowed = new Set([...DEFAULT_ALLOWED, ...configured]);
  const allowOrigin = allowed.has(origin) ? origin : "https://mytriply.co.il";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin"
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "Pragma": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function resolveLocale(trip: any) {
  const pref = trip?.preferences || {};
  const code = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase().split(/[-_]/)[0] : "";
  const supported = (value: string) => ["he", "ru", "ar"].includes(value);
  const primary = code(pref.language), regional = code(pref.locale);
  const language = supported(primary) ? primary : supported(regional) ? regional : "he";
  const locale = language === "ru" ? "ru-RU" : language === "ar" ? "ar-IL" : "he-IL";
  return { language, locale, direction: language === "he" || language === "ar" ? "rtl" : "ltr" };
}

function dictionaryFor(language: string) {
  if (language === "ru") return {
    version: 1, language: "ru", locale: "ru-RU", direction: "ltr",
    brand: { name: "TRIPLY", agent_name: "Авия", tagline: "Ваша поездка. Именно для вас." },
    navigation: { home: "Главная", schedule: "Маршрут", food: "Еда", shopping: "Шопинг", nightlife: "Вечер", navigation: "Навигация", experiences: "Впечатления", phrasebook: "Разговорник", useful: "Полезное", more: "Ещё" },
    home: { today: "Сегодня в поездке", all_trip: "Вся поездка", live_update: "Актуально к поездке", currency: "Конвертер валют", phrasebook: "Фразы для поездки", useful: "Полезная информация", our_places: "Наши места", travel_dna: "Travel DNA" },
    schedule: { day: "День", planned: "Запланировано", optional: "По желанию", backup: "Запасной вариант", drive: "Переезд", walk: "Пешком", rest: "Отдых", open_maps: "Открыть в Maps" },
    places: { details: "Подробнее", website: "Сайт", menu: "Меню", booking: "Бронирование", phone: "Позвонить", whatsapp: "WhatsApp", instagram: "Instagram", google_maps: "Google Maps", waze: "Waze", address: "Адрес", opening_hours: "Часы работы" },
    food: { title: "Еда и рестораны", restaurants: "Рестораны", street_food: "Стрит-фуд", bakery: "Пекарни", cafes: "Кофе и кафе", food_rules: "Ваши предпочтения в еде" },
    shopping: { title: "Шопинг, рынки и аутлеты", markets: "Рынки", malls: "Торговые центры", outlets: "Аутлеты", brands: "Бренды", budget: "Бюджет на покупки" },
    nightlife: { title: "Вечерние планы и события", bars: "Бары", clubs: "Клубы", events: "События", festivals: "Фестивали" },
    useful: { emergency: "Экстренная помощь", flights: "Рейсы", hotel: "Отель", transport: "Транспорт", weather: "Погода", offline: "Основной контент доступен и без интернета" },
    phrasebook: { title: "Фразы для поездки", source_language: "Русский", local_language: "Местный язык", pronunciation: "Произношение", speak: "Прослушать" },
    errors: { load_failed: "Не удалось загрузить данные поездки", connection_required: "Для синхронизации приложения требуется подключение к интернету", retry: "Попробовать снова" },
    cta: { start_whatsapp: "Начать в WhatsApp", plan_trip: "Спланировать поездку", create_app: "Создать моё приложение для поездки" }
  };
  if (language === "ar") return {
    version: 1, language: "ar", locale: "ar-IL", direction: "rtl",
    brand: { name: "TRIPLY", agent_name: "أفيا", tagline: "رحلتك. مصممة خصيصًا لك." },
    navigation: { home: "الرئيسية", schedule: "المسار", food: "الطعام", shopping: "التسوق", nightlife: "المساء", navigation: "التنقل", experiences: "التجارب", phrasebook: "دليل العبارات", useful: "معلومات مفيدة", more: "المزيد" },
    home: { today: "اليوم في الرحلة", all_trip: "كل الرحلة", live_update: "تحديثات الرحلة", currency: "محول العملات", phrasebook: "عبارات للسفر", useful: "معلومات مفيدة", our_places: "أماكننا", travel_dna: "Travel DNA" },
    schedule: { day: "اليوم", planned: "مخطط", optional: "اختياري", backup: "بديل", drive: "تنقل", walk: "مشي", rest: "راحة", open_maps: "فتح في Maps" },
    places: { details: "التفاصيل", website: "الموقع", menu: "القائمة", booking: "الحجز", phone: "اتصال", whatsapp: "WhatsApp", instagram: "Instagram", google_maps: "Google Maps", waze: "Waze", address: "العنوان", opening_hours: "ساعات العمل" },
    food: { title: "الطعام والمطاعم", restaurants: "مطاعم", street_food: "طعام الشارع", bakery: "مخابز", cafes: "مقاهٍ", food_rules: "تفضيلات الطعام" },
    shopping: { title: "التسوق والأسواق والأوتلت", markets: "أسواق", malls: "مراكز تسوق", outlets: "أوتلت", brands: "علامات تجارية", budget: "ميزانية التسوق" },
    nightlife: { title: "خطط المساء والفعاليات", bars: "بارات", clubs: "نوادٍ", events: "فعاليات", festivals: "مهرجانات" },
    useful: { emergency: "طوارئ", flights: "رحلات جوية", hotel: "الفندق", transport: "المواصلات", weather: "الطقس", offline: "المحتوى الأساسي متاح دون اتصال" },
    phrasebook: { title: "عبارات للسفر", source_language: "العربية", local_language: "اللغة المحلية", pronunciation: "النطق", speak: "استماع" },
    errors: { load_failed: "تعذر تحميل بيانات الرحلة", connection_required: "يلزم اتصال بالإنترنت للمزامنة", retry: "حاول مرة أخرى" },
    cta: { start_whatsapp: "ابدأ عبر WhatsApp", plan_trip: "خطط للرحلة", create_app: "أنشئ تطبيق رحلتي" }
  };
  return {
    version: 1, language: "he", locale: "he-IL", direction: "rtl",
    brand: { name: "TRIPLY", agent_name: "אביה", tagline: "הטיול שלך. בדיוק בשבילך." },
    navigation: { home: "בית", schedule: "מסלול", food: "אוכל", shopping: "קניות", nightlife: "ערב", navigation: "ניווט", experiences: "חוויות", phrasebook: "שיחון", useful: "שימושי", more: "עוד" },
    home: { today: "היום בטיול", all_trip: "כל הטיול", live_update: "עדכונים לטיול", currency: "ממיר כסף", phrasebook: "שיחון למטייל", useful: "מידע שימושי", our_places: "המקומות שלנו", travel_dna: "Travel DNA" },
    schedule: { day: "יום", planned: "מתוכנן", optional: "אופציונלי", backup: "גיבוי", drive: "נסיעה", walk: "הליכה", rest: "מנוחה", open_maps: "פתח ב-Maps" },
    places: { details: "פרטים", website: "אתר", menu: "תפריט", booking: "הזמנה", phone: "טלפון", whatsapp: "WhatsApp", instagram: "Instagram", google_maps: "Google Maps", waze: "Waze", address: "כתובת", opening_hours: "שעות פתיחה" },
    food: { title: "אוכל ומסעדות", restaurants: "מסעדות", street_food: "אוכל רחוב", bakery: "מאפיות", cafes: "קפה ובתי קפה", food_rules: "העדפות האוכל שלכם" },
    shopping: { title: "קניות, שווקים ואאוטלטים", markets: "שווקים", malls: "קניונים", outlets: "אאוטלטים", brands: "מותגים", budget: "תקציב קניות" },
    nightlife: { title: "ערב ואירועים", bars: "ברים", clubs: "מועדונים", events: "אירועים", festivals: "פסטיבלים" },
    useful: { emergency: "חירום", flights: "טיסות", hotel: "מלון", transport: "תחבורה", weather: "מזג אוויר", offline: "התוכן המרכזי זמין גם בלי אינטרנט" },
    phrasebook: { title: "שיחון למטייל", source_language: "עברית", local_language: "שפה מקומית", pronunciation: "הגייה", speak: "השמע" },
    errors: { load_failed: "לא הצלחנו לטעון את נתוני הטיול", connection_required: "נדרש חיבור לאינטרנט לסנכרון האפליקציה", retry: "נסה שוב" },
    cta: { start_whatsapp: "מתחילים ב-WhatsApp", plan_trip: "מתכננים טיול", create_app: "יצירת האפליקציה שלי" }
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "GET") return json(req, { error: "method_not_allowed" }, 405);
  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get("token") || "").trim();
    if (token.length < 32 || token.length > 256) return json(req, { error: "invalid_or_missing_token" }, 401);
    const tokenHash = await sha256Hex(token);
    const { data: link, error: linkError } = await supabase.from("trip_app_links").select("id, trip_id, status, expires_at").eq("token_hash", tokenHash).maybeSingle();
    if (linkError) throw linkError;
    if (!link || link.status !== "active") return json(req, { error: "link_not_found_or_revoked" }, 401);
    if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) return json(req, { error: "link_expired" }, 401);

    const { data: trip, error: tripError } = await supabase.from("trips").select("id, trip_code, title, destination, base_location, start_date, end_date, timezone, status, theme, travel_dna, preferences, live_settings, published_at, base_latitude, base_longitude, countdown_at, traveler_label, updated_at").eq("id", link.trip_id).single();
    if (tripError || !trip) return json(req, { error: "trip_not_found" }, 404);
    const appLocale = resolveLocale(trip);
    const i18n = dictionaryFor(appLocale.language);

    const [daysRes, assetsRes, liveRes] = await Promise.all([
      supabase.from("trip_days").select("id, trip_id, day_number, trip_date, title, summary, sort_order").eq("trip_id", link.trip_id).order("sort_order", { ascending: true }),
      supabase.from("trip_assets").select("id, trip_id, asset_type, title, url, metadata, created_at").eq("trip_id", link.trip_id),
      supabase.from("live_items").select("id, trip_id, kind, title, source, source_url, starts_at, ends_at, status, payload, fetched_at, expires_at").eq("trip_id", link.trip_id)
    ]);
    if (daysRes.error) throw daysRes.error;
    if (assetsRes.error) throw assetsRes.error;
    if (liveRes.error) throw liveRes.error;

    const days = daysRes.data || [];
    const dayIds = days.map((d: any) => d.id);
    let itinerary: any[] = [];
    if (dayIds.length) {
      const itemsRes = await supabase.from("itinerary_items").select("id, trip_day_id, place_id, start_time, end_time, title, item_type, description, status, sort_order, metadata").in("trip_day_id", dayIds).order("sort_order", { ascending: true });
      if (itemsRes.error) throw itemsRes.error;
      itinerary = itemsRes.data || [];
    }

    const itineraryPlaceIds = [...new Set(itinerary.map((i: any) => i.place_id).filter(Boolean))];
    let places: any[] = [];
    const allPlacesRes = await supabase.from("places").select("id, name, category, city, country, address, latitude, longitude, phone, whatsapp, website, instagram, facebook, google_maps_url, waze_url, booking_url, menu_url, metadata").eq("metadata->>trip_code", trip.trip_code);
    if (!allPlacesRes.error) places = allPlacesRes.data || [];
    const knownPlaceIds = new Set(places.map((p: any) => p.id));
    const missingPlaceIds = itineraryPlaceIds.filter(id => !knownPlaceIds.has(id));
    if (missingPlaceIds.length) {
      const placesRes = await supabase.from("places").select("id, name, category, city, country, address, latitude, longitude, phone, whatsapp, website, instagram, facebook, google_maps_url, waze_url, booking_url, menu_url, metadata").in("id", missingPlaceIds);
      if (placesRes.error) throw placesRes.error;
      places = [...places, ...(placesRes.data || [])];
    }

    await supabase.from("trip_app_links").update({ last_used_at: new Date().toISOString() }).eq("id", link.id);
    return json(req, { app_version: 5, language: appLocale.language, locale: appLocale.locale, direction: appLocale.direction, i18n, trip, days, itinerary, places, assets: assetsRes.data || [], live_items: liveRes.data || [] });
  } catch (error) {
    console.error("triply-client-app error", error);
    return json(req, { error: "internal_error" }, 500);
  }
});
