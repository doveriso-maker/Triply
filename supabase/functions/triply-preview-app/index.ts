// PREMIUM_V2_NEXT. Legacy trip/day/items fields remain available during migration.
// Baseline: deployed triply-preview-app v13, archived before this change.
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import istanbul from "./istanbul.json" with { type: "json" };

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const LOCALES = new Set(["he", "en", "ru", "ar"]);
const DESTINATIONS: any[] = [istanbul];
const ORIGINS = new Set([
  "https://navigam.com", "https://www.navigam.com",
  "https://mytriply.co.il", "https://www.mytriply.co.il",
  "http://localhost", "https://localhost", "capacitor://localhost", "null",
]);

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.has(origin) ? origin : "https://www.navigam.com",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  };
}
function json(req: Request, body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json; charset=utf-8" },
  });
}
const text = (value: any, max = 6000) => typeof value === "string" ? value.trim().slice(0, max) : "";
function langOf(trip: any) {
  const lang = text(trip?.preferences?.language || trip?.preferences?.locale || "he").toLowerCase().split(/[-_]/)[0];
  return LOCALES.has(lang) ? lang : "he";
}
function localized(value: any, language: string) {
  return text(value && typeof value === "object" ? value[language] || value.en : value);
}
function normText(value: any) {
  return text(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function safeUrl(value: any) {
  try {
    const url = new URL(text(value, 4096));
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}
function numeric(value: any, min: number, max: number) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}
function coordinates(value: any) {
  const latitude = numeric(value?.latitude, -90, 90);
  const longitude = numeric(value?.longitude, -180, 180);
  return latitude !== null && longitude !== null ? { latitude, longitude } : null;
}
function registryFor(trip: any) {
  const destination = normText(trip.destination);
  return DESTINATIONS.find(registry => registry.aliases.some((alias: string) => normText(alias) === destination)) || null;
}
function languageCode(value: any) {
  const code = text(value, 24).toLowerCase().split(/[-_]/)[0];
  return /^[a-z]{2,3}$/.test(code) ? code : null;
}
function destinationFor(trip: any, registry: any, language: string) {
  const prefs = trip.preferences || {};
  const point = coordinates({ latitude: trip.base_latitude, longitude: trip.base_longitude }) || coordinates(registry);
  const localLanguage = languageCode(prefs.phrasebook?.language_code) || languageCode(prefs.phrasebook?.speech_code) || languageCode(prefs.destination_language) || registry?.language || null;
  return {
    id: registry?.id || normText(trip.destination).replace(/ /g, "-"),
    name: registry?.name || { [language]: text(trip.destination) },
    label: registry ? localized(registry.name, language) : text(trip.destination),
    language: localLanguage,
    speech_locale: text(prefs.phrasebook?.speech_code, 24) || registry?.speech_locale || localLanguage,
    country: registry?.country || null,
    currency: text(prefs.destination_currency, 3).toUpperCase() || registry?.currency || null,
    timezone: registry?.timezone || text(trip.timezone, 60) || "UTC",
    latitude: point?.latitude ?? null,
    longitude: point?.longitude ?? null,
  };
}
function normalizedParty(preferences: any) {
  const structured = preferences.party && typeof preferences.party === "object" ? preferences.party : {};
  const count = (value: any) => { const n = numeric(value, 0, 100); return n !== null && Number.isInteger(n) ? n : null; };
  let adults = count(structured.adults ?? preferences.adults);
  let children = count(structured.children ?? preferences.children);
  let infants = count(structured.infants ?? preferences.infants);
  const travelers = text(preferences.travelers);
  const ageInput = structured.children_ages ?? preferences.kids_ages;
  let ages = Array.isArray(ageInput) ? ageInput.map((n: any) => numeric(n, 0, 17)).filter((n: any) => n !== null) : [];
  if (adults === null) {
    const match = travelers.match(/(\d{1,2})\s*(?:adults?|מבוגרים|بالغ(?:ين|ان)?|взросл)/iu);
    if (match) adults = count(match[1]);
  }
  // Legacy data is normalized here; the mixed-language intake text is never public.
  if (!ages.length && typeof ageInput === "string" && /(?:سنة واحدة|בן שנה|one.year.old|1\s*(?:year|שנ|год|سنة))/iu.test(ageInput + " " + travelers)) ages = [1];
  if (ages.length) {
    if (infants === null) infants = ages.filter((age: number) => age < 2).length;
    if (children === null) children = ages.filter((age: number) => age >= 2).length;
  }
  return { adults, children, infants, children_ages: ages, type: ["family", "couple", "solo", "friends", "group"].includes(preferences.party_type) ? preferences.party_type : null };
}
function publicMetadata(metadata: any) {
  const out: any = {};
  for (const key of ["description", "why_match"]) if (text(metadata?.[key])) out[key] = text(metadata[key]);
  if (Array.isArray(metadata?.source_urls)) out.source_urls = metadata.source_urls.map(safeUrl).filter(Boolean).slice(0, 12);
  const lang = languageCode(metadata?.language);
  if (lang) out.language = lang;
  if (metadata?.preview === true) out.preview = true;
  return out;
}
function mapQuery(place: any) {
  try {
    const fromUrl = new URL(place.google_maps_url).searchParams.get("query");
    if (fromUrl) return text(fromUrl, 500);
  } catch { /* A name remains useful when a link is missing. */ }
  return [place.name, place.city, place.country].map(value => text(value, 200)).filter(Boolean).join(", ");
}
function imageIdentity(value: string) {
  try {
    const url = new URL(value);
    let path = decodeURIComponent(url.pathname);
    if (path.includes("/thumb/")) { path = path.replace("/thumb/", "/"); path = path.substring(0, path.lastIndexOf("/")); }
    return (url.hostname + path).toLowerCase();
  } catch { return value.toLowerCase().split("?")[0]; }
}
function imageSelector(hero: string | null, splash: string | null) {
  const used = new Set([hero, splash].filter(Boolean).map(value => imageIdentity(value!)));
  return (image: any) => {
    const url = safeUrl(image?.url);
    if (!url || used.has(imageIdentity(url))) return { url: null, kind: "unavailable", verified: false };
    used.add(imageIdentity(url));
    return { url, kind: image.kind === "atmosphere" ? "atmosphere" : "place", verified: image.verified === true, source: text(image.source, 120) };
  };
}
function publicPlace(place: any, registry: any, language: string, chooseImage: (value: any) => any) {
  const curated = registry?.places?.[place.id];
  const dbPoint = coordinates(place);
  const point = dbPoint || coordinates(curated);
  const metadata = place.metadata || {};
  const preferred = safeUrl(metadata.preview_image_url);
  const preferredFor = normText(metadata.preview_image_place_name);
  const verifiedReplacement = curated?.image?.verified === true &&
    (!preferred || safeUrl(curated.image.replaces_url) === preferred);
  const image = chooseImage(verifiedReplacement ? curated.image : preferred && preferredFor === normText(place.name)
    ? { url: preferred, kind: "place", source: "place_metadata", verified: metadata.preview_image_verified === true }
    : curated?.image);
  const query = mapQuery(place);
  const category = curated?.category_key || text(metadata.category_key, 50) || "attractions";
  return {
    id: place.id, name: text(place.name), category: text(place.category),
    category_key: category, categories: curated?.categories || [category],
    area: curated?.area || text(place.city), city: text(place.city), country: text(place.country),
    address: text(place.address), description: localized(metadata.description, language),
    website: safeUrl(place.website), booking_url: safeUrl(place.booking_url),
    google_maps_url: safeUrl(place.google_maps_url) || (query ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query) : null),
    waze_url: safeUrl(place.waze_url) || (query ? "https://waze.com/ul?q=" + encodeURIComponent(query) + "&navigate=yes" : null),
    query, latitude: point?.latitude ?? null, longitude: point?.longitude ?? null,
    coordinates_approximate: dbPoint ? metadata.coordinates_approximate === true : !!point,
    coordinates_source: dbPoint ? "database" : curated?.coordinates_source || null,
    metadata: publicMetadata(metadata), preview_image_url: image.url, image,
  };
}
function recommendedPlace(place: any, destination: any, language: string, chooseImage: (value: any) => any) {
  const query = text(place.query, 500);
  const image = chooseImage(place.image);
  return {
    id: place.id, name: localized(place.name, language),
    category: place.category_key, category_key: place.category_key, categories: place.categories || [place.category_key],
    area: text(place.area), city: destination.label, country: destination.country,
    address: "", description: localized(place.description, language),
    website: safeUrl(place.website), booking_url: null,
    google_maps_url: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query),
    waze_url: "https://waze.com/ul?q=" + encodeURIComponent(query) + "&navigate=yes",
    query, latitude: null, longitude: null, coordinates_approximate: false,
    metadata: {}, preview_image_url: image.url, image,
  };
}
function datePlan(trip: any, day: any, items: any[], language: string) {
  const start = Date.parse(String(trip.start_date) + "T00:00:00Z");
  const end = Date.parse(String(trip.end_date) + "T00:00:00Z");
  const count = Number.isFinite(start) && Number.isFinite(end) && end >= start ? Math.min(366, Math.floor((end - start) / 86400000) + 1) : 1;
  const label = ({ he: "יום", en: "Day", ru: "День", ar: "اليوم" } as any)[language];
  return Array.from({ length: count }, (_, index) => index === 0
    ? { day: 1, date: day.trip_date, title: day.title, summary: day.summary, locked: false, items }
    : { day: index + 1, date: new Date(start + index * 86400000).toISOString().slice(0, 10), title: label + " " + (index + 1), locked: true, items: [] });
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
function expired(link: any) {
  const until = Date.parse(link.expires_at || "");
  return !Number.isFinite(until) || until <= Date.now();
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "GET") return json(req, { ok: false, error: "method_not_allowed" }, 405);
  let code = "";
  let language = "he";
  const denied = (error: string, status = 401, extras: any = {}) => json(req, {
    ok: false, error, code: code || null, language, server_now: new Date().toISOString(), ...extras,
  }, status);
  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get("token") || "").trim();
    code = (url.searchParams.get("code") || "").trim().toUpperCase();
    let lookup: any;
    if (token) {
      if (token.length < 32 || token.length > 256) return denied("invalid_token");
      lookup = await supabase.from("trip_app_links").select("id,trip_id,status,expires_at,metadata").eq("token_hash", await sha256(token)).maybeSingle();
    } else if (code) {
      if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,16}$/.test(code)) return denied("invalid_code");
      lookup = await supabase.from("trip_app_links").select("id,trip_id,status,expires_at,metadata").contains("metadata", { short_code: code }).maybeSingle();
    } else return denied("missing_link");
    if (lookup.error) throw lookup.error;
    const link = lookup.data;
    if (!link || link.status !== "active" || link.metadata?.preview !== true) return denied("preview_not_found");
    code = text(link.metadata.short_code, 16) || code;

    // Resolve only language before expiry. No itinerary query is made for expired links.
    const { data: trip, error: tripError } = await supabase.from("trips")
      .select("id,title,destination,start_date,end_date,preferences,base_latitude,base_longitude,timezone")
      .eq("id", link.trip_id).single();
    if (tripError || !trip) return denied("trip_not_found", 404);
    language = langOf(trip);
    if (expired(link)) return denied("preview_expired", 401, { expires_at: link.expires_at || null });

    const { data: day, error: dayError } = await supabase.from("trip_days")
      .select("id,day_number,trip_date,title,summary").eq("trip_id", trip.id).eq("day_number", 1).maybeSingle();
    if (dayError || !day) return denied("preview_day_not_found", 404);
    const { data: items, error: itemError } = await supabase.from("itinerary_items")
      .select("id,trip_day_id,place_id,start_time,end_time,title,item_type,description,status,sort_order,metadata")
      .eq("trip_day_id", day.id).order("sort_order", { ascending: true });
    if (itemError) throw itemError;
    const placeIds = [...new Set((items || []).map((item: any) => item.place_id).filter(Boolean))];
    let rawPlaces: any[] = [];
    if (placeIds.length) {
      const { data, error } = await supabase.from("places")
        .select("id,name,category,city,country,address,latitude,longitude,website,google_maps_url,waze_url,booking_url,metadata")
        .in("id", placeIds);
      if (error) throw error;
      rawPlaces = data || [];
    }
    const registry = registryFor(trip);
    const destination = destinationFor(trip, registry, language);
    const preferences = trip.preferences || {};
    const hero = safeUrl(preferences.preview_hero_image_url) || safeUrl(registry?.images?.hero);
    const splash = safeUrl(preferences.preview_splash_image_url) || safeUrl(registry?.images?.splash) || hero;
    const chooseImage = imageSelector(hero, splash);
    const byId = new Map(rawPlaces.map(place => [place.id, publicPlace(place, registry, language, chooseImage)]));
    const enriched = (items || []).map((item: any) => ({ ...item, metadata: publicMetadata(item.metadata), place: item.place_id ? byId.get(item.place_id) || null : null }));
    const places: any[] = [...byId.values()];
    for (const recommendation of registry?.recommendations || []) {
      if (byId.has(recommendation.id)) continue;
      const result = recommendedPlace(recommendation, destination, language, chooseImage);
      byId.set(result.id, result);
      places.push(result);
    }
    const days = datePlan(trip, day, enriched, language);
    const party = normalizedParty(preferences);
    // Expiry remains authoritative even if processing crossed the boundary.
    if (expired(link)) return denied("preview_expired", 401, { expires_at: link.expires_at || null });
    const serverNow = new Date().toISOString();
    return json(req, {
      ok: true, schema_version: 2, engine: "NAVIGAM_PREMIUM_V2", code, language,
      server_now: serverNow, expires_at: link.expires_at,
      authorization: { authorized: true, checked_at: serverNow, expires_at: link.expires_at, revalidate_after_seconds: 60 },
      customer: { language, party }, destination,
      trip: {
        id: trip.id, title: trip.title, destination: trip.destination,
        destination_meta: destination, start_date: trip.start_date, end_date: trip.end_date,
        dates: { start: trip.start_date, end: trip.end_date }, party,
        hero_image_url: hero, splash_image_url: splash,
      },
      day, items: enriched, days, places, hotels: [],
      preview: { open_days: [1], locked_days: days.filter(value => value.locked).map(value => value.day) },
      images: { destinationHero: hero, splash, itineraryDayHero: hero, places: Object.fromEntries(places.map(place => [place.id, place.image])), hotels: {} },
      features: { avia: true, translate: !!destination.language, weather: destination.latitude !== null, map: true, currency: !!destination.currency, checklist: true, offline: true },
      feature_config: {
        avia: { mode: "trip_data", live_assistance: false },
        translate: { source_language: language, target_language: destination.language, target_speech_locale: destination.speech_locale, requires_internet: true },
        weather: { latitude: destination.latitude, longitude: destination.longitude, timezone: destination.timezone, forecast_horizon_days: 7 },
        offline: { shell_and_preferences: true, preview_requires_server_authorization: true, live_services_require_internet: true },
      },
      review_status: text(link.metadata.review_status, 80) || null,
      customer_sent: link.metadata.customer_sent === true,
    });
  } catch (error: any) {
    console.error("navigam-preview-app", text(error?.code || "unhandled", 80));
    return denied("internal_error", 500);
  }
}

Deno.serve(handler);
