export const bool = value => value === true || value === 'true' || value === 1 || value === '1';
export const blockedFlags = ['followup_opt_out', 'human_handoff', 'safety_hold', 'non_customer'];

export function dateValue(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const n = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value ? n : null;
}

export function paymentReady(profile) {
  const p = profile || {}, q = p.questionnaire || {};
  const start = dateValue(p.start_date || q.start_date), end = dateValue(p.end_date || q.end_date);
  return bool(p.app_interest) && !blockedFlags.some(k => bool(p[k])) &&
    typeof (p.destination || q.destination) === 'string' && !!(p.destination || q.destination).trim() &&
    start !== null && end !== null && end >= start;
}

export function followupBlock(row) {
  const p = row.profile || {};
  const flag = blockedFlags.find(k => bool(p[k]));
  if (flag) return flag;
  if (p.ai_enabled === false || p.ai_enabled === 'false') return 'ai_paused';
  if (['closed', 'converted'].includes(row.status)) return 'closed';
  if (bool(p.payment_claimed) || !['not_started', 'link_available', '', null, undefined].includes(row.payment_status)) return 'payment_complete';
  return null;
}

export function languageOf(profile) {
  const p = profile || {};
  for (const value of [p.language, p.routing_language, p.campaign_language]) {
    const language = String(value || '').toLowerCase().split('-')[0];
    if (['he', 'ru', 'ar'].includes(language)) return language;
  }
  return null;
}

// Only customer text is language evidence; generated replies cannot select a language.
export function transcriptLanguage(transcript) {
  for (const item of [...transcript].reverse()) {
    if (item?.role !== 'user' || typeof item.content !== 'string') continue;
    const text = item.content.replace(/https?:\/\/\S+/g, '');
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0590-\u05ff]/.test(text)) return 'he';
  }
  return null;
}

export function mergeControls(oldProfile, payload, extracted) {
  const result = {};
  for (const key of blockedFlags) result[key] = bool(oldProfile?.[key]) || bool(payload?.[key]) || bool(extracted?.[key]);
  const transcript = Array.isArray(payload?.transcript) ? payload.transcript : [];
  if (payload?.ai_enabled === false || transcript.some(m => m?.role === 'system' && /AI auto-replies paused/i.test(m.content || ''))) result.human_handoff = true;
  return result;
}
