import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
function serviceKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const x=JSON.parse(modern);if(x?.default)return x.default}catch{}}return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??''}
const SERVICE_KEY = serviceKey();
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUMIT_COMPANY_ID = (Deno.env.get("SUMIT_COMPANY_ID") || "").trim();
const SUMIT_PRIVATE_KEY = (Deno.env.get("SUMIT_PRIVATE_KEY") || "").trim();
const SUMIT_PUBLIC_KEY = (Deno.env.get("SUMIT_PUBLIC_KEY") || "").trim();
const SUMIT_URL = "https://api.sumit.co.il/accounting/documents/create/";
const VERSION = "1.2.0-atomic-invoice-claim";

const service = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = new Set(["https://mytriply.co.il","https://www.mytriply.co.il","https://triply-triply2.vercel.app"]);

function cors(origin: string | null) {const o = origin && allowedOrigins.has(origin) ? origin : "https://mytriply.co.il";return {"Access-Control-Allow-Origin":o,"Vary":"Origin","Access-Control-Allow-Headers":"authorization, content-type, apikey","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};}
function json(body: unknown, status = 200, origin: string | null = null) {return new Response(JSON.stringify(body), { status, headers: cors(origin) });}
function str(v: unknown) { return typeof v === "string" && v.trim() ? v.trim() : null; }
function idstr(v: unknown){if(typeof v==='number'&&Number.isFinite(v))return String(v);return str(v)}
function validEmail(v: string | null) { return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function daysInclusive(start: string, end: string) {const parse = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? Date.UTC(+m[1], +m[2]-1, +m[3]) : NaN; };const a = parse(start), b = parse(end);if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) throw new Error("invalid_trip_dates");return Math.floor((b-a)/86400000)+1;}
function launchAmount(days: number) { return 169 + Math.max(0, days - 5) * 25; }
function responseLanguage(profile: any) {const l = String(profile?.language || profile?.locale || "he").toLowerCase();if (l.startsWith("ar")) return 2;if (l.startsWith("ru")) return 1;return 0;}
function safeError(body: any, fallback: string) {const raw = str(body?.UserErrorMessage) || str(body?.TechnicalErrorDetails) || str(body?.StatusDescription) || str(body?.Message) || fallback;return String(raw).replace(/([A-Za-z0-9_-]{24,})/g, "[redacted]").slice(0, 500);}
async function authorize(req: Request) {const auth = req.headers.get("authorization") || "";const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";if (!token) return { ok: false as const, token: "", userId: "" };const { data, error } = await service.auth.getUser(token);if (error || !data?.user?.id) return { ok: false as const, token: "", userId: "" };const { data: admin } = await service.from("admin_users").select("user_id,role").eq("user_id", data.user.id).in("role", ["owner","editor"]).maybeSingle();return admin?.user_id ? { ok: true as const, token, userId: data.user.id } : { ok: false as const, token: "", userId: "" };}
async function contextForLead(leadId: string) {const { data: lead, error: leadError } = await service.from("triply_whatsapp_leads").select("*").eq("id", leadId).maybeSingle();if (leadError || !lead) throw new Error("whatsapp_lead_not_found");const { data: ready } = await service.rpc("triply_questionnaire_ready", { p_profile: lead.profile || {} });if (ready !== true) throw new Error("questionnaire_incomplete");let email = str(lead.profile?.customer_email);let customer: any = null;if (lead.customer_id) {const r = await service.from("customers").select("id,full_name,email,phone").eq("id", lead.customer_id).maybeSingle();customer = r.data;email = email || str(customer?.email);}if (!validEmail(email)) throw new Error("missing_customer_email");let tripId = str(lead.trip_id);if (!tripId) {const m = await service.rpc("triply_whatsapp_materialize_trip", { p_lead_id: leadId });if (m.error || !m.data?.trip_id) throw new Error("trip_materialization_failed");tripId = String(m.data.trip_id);}const { data: trip, error: tripError } = await service.from("trips").select("id,trip_code,title,start_date,end_date,destination,preferences").eq("id", tripId).maybeSingle();if (tripError || !trip) throw new Error("trip_not_found");const days = daysInclusive(String(trip.start_date), String(trip.end_date));const amount = launchAmount(days);const name = str(lead.customer_name) || str(lead.profile?.customer_name) || str(customer?.full_name) || "TRIPLY Customer";const phone = str(lead.customer_phone) || str(customer?.phone);const externalReference = `TRIPLY-${trip.trip_code}-${lead.id}`;return { lead, trip, email: email!, name, phone, days, amount, externalReference };}
function previewPayload(ctx: any) {return {document_type:"InvoiceAndReceipt",document_type_code:1,payment_type:"Digital",payment_type_code:6,payment_method:"PayBox",amount:ctx.amount,currency:"ILS",vat_included:true,customer_name:ctx.name,customer_email:ctx.email,trip_code:ctx.trip.trip_code,trip_days:ctx.days,external_reference:ctx.externalReference};}
function sumitPayload(ctx: any) {const lang = responseLanguage(ctx.lead.profile || {});return {
  Credentials: { CompanyID: Number(SUMIT_COMPANY_ID), APIKey: SUMIT_PRIVATE_KEY },
  Details: {
    Type: "InvoiceAndReceipt",
    IsDraft: false,
    Date: new Date().toISOString(),
    Customer: {SearchMode: 2,ExternalIdentifier: `triply-customer-${ctx.lead.id}`,Name: ctx.name,EmailAddress: ctx.email,...(ctx.phone ? { Phone: ctx.phone } : {})},
    Currency: "ILS",
    Language: lang,
    Description: `TRIPLY Premium - Trip ${ctx.trip.trip_code}`,
    ExternalReference: ctx.externalReference,
    SendByEmail: { EmailAddress: ctx.email, Original: true, SendAsPaymentRequest: false }
  },
  Items: [{Quantity: 1,UnitPrice: ctx.amount,TotalPrice: ctx.amount,Item: {Name: "TRIPLY Premium",Description: `Personal travel app - Trip ${ctx.trip.trip_code}`,ExternalIdentifier: "triply-premium",SearchMode: 2}}],
  Payments: [{Amount: ctx.amount,DocumentCurrency_Amount: ctx.amount,Type: "Digital",Details_Digital: { DigitalWalletType: "PayBox", AdditionalData: { source: "TRIPLY", trip_code: ctx.trip.trip_code } }}],
  VATIncluded: true,
  ResponseLanguage: lang
};}
async function finalizePayment(token: string, leadId: string) {const userClient = createClient(SUPABASE_URL, ANON_KEY, {global: { headers: { Authorization: `Bearer ${token}` } },auth: { persistSession: false, autoRefreshToken: false }});const { data, error } = await userClient.rpc("triply_admin_confirm_whatsapp_payment", { p_lead_id: leadId });if (error) throw new Error(`payment_finalize_failed:${error.message}`);return data;}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method === "GET") {const companyIdValid = /^\d+$/.test(SUMIT_COMPANY_ID) && Number(SUMIT_COMPANY_ID) > 0;return json({ok:true,service:"TRIPLY SUMIT invoicing",version:VERSION,configured:companyIdValid && !!SUMIT_PRIVATE_KEY,company_id_present:!!SUMIT_COMPANY_ID,company_id_valid:companyIdValid,private_key_present:!!SUMIT_PRIVATE_KEY,public_key_present:!!SUMIT_PUBLIC_KEY,live_admin_wiring:true},200,origin);}
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ ok: false, error: "origin_not_allowed" }, 403, origin);
  const authz = await authorize(req);if (!authz.ok) return json({ ok: false, error: "unauthorized" }, 401, origin);
  let body: any = {};try { body = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400, origin); }
  const leadId = str(body?.lead_id);const action = str(body?.action) || "preview";if (!leadId) return json({ ok: false, error: "missing_lead_id" }, 400, origin);if (!['preview','issue_and_confirm'].includes(action)) return json({ ok: false, error: "invalid_action" }, 400, origin);
  try {
    const ctx = await contextForLead(leadId);
    if (action === "preview") return json({ ok: true, preview: previewPayload(ctx), configured: /^\d+$/.test(SUMIT_COMPANY_ID) && !!SUMIT_PRIVATE_KEY }, 200, origin);
    if (!/^\d+$/.test(SUMIT_COMPANY_ID) || Number(SUMIT_COMPANY_ID) <= 0 || !SUMIT_PRIVATE_KEY) return json({ ok: false, error: "sumit_not_configured" }, 503, origin);
    if (!['pending_verification','verified'].includes(String(ctx.lead.payment_status || ''))) return json({ ok: false, error: "payment_not_pending_verification" }, 409, origin);

    const { data: existing } = await service.from("triply_accounting_documents").select("*").eq("lead_id", leadId).eq("document_type", "invoice_and_receipt").maybeSingle();let ledger: any = existing;
    if (!ledger) {const ins = await service.from("triply_accounting_documents").insert({lead_id:leadId,trip_id:ctx.trip.id,provider:"sumit",document_type:"invoice_and_receipt",status:"pending",amount:ctx.amount,currency:"ILS",customer_name:ctx.name,customer_email:ctx.email,external_reference:ctx.externalReference}).select("*").single();if (ins.error) throw new Error(`ledger_insert_failed:${ins.error.message}`);ledger = ins.data;}
    if (['issued','emailed'].includes(ledger.status)) {const finalized = String(ctx.lead.payment_status) === 'verified' ? null : await finalizePayment(authz.token, leadId);return json({ ok: true, duplicate_prevented: true, document_id: ledger.provider_document_id, document_number: ledger.provider_document_number, document_url: ledger.provider_download_url, payment: finalized }, 200, origin);}
    if (ledger.status === 'uncertain') return json({ ok: false, error: "manual_sumit_reconciliation_required" }, 409, origin);
    if (ledger.status === 'issuing') {const age = Date.now() - new Date(ledger.updated_at).getTime();if (age > 10 * 60 * 1000) {await service.from("triply_accounting_documents").update({ status: "uncertain", last_error: "stale issuing state; verify SUMIT before retry", updated_at: new Date().toISOString() }).eq("id", ledger.id).eq("status", "issuing").eq("updated_at", ledger.updated_at);return json({ ok: false, error: "manual_sumit_reconciliation_required" }, 409, origin);}return json({ ok: false, error: "invoice_issue_in_progress" }, 409, origin);}
    const up = await service.from("triply_accounting_documents").update({status:"issuing",attempts:Number(ledger.attempts || 0)+1,amount:ctx.amount,customer_name:ctx.name,customer_email:ctx.email,last_error:null,updated_at:new Date().toISOString()}).eq("id", ledger.id).in("status", ["pending", "failed"]).eq("updated_at", ledger.updated_at).select("id").maybeSingle();if (up.error) throw new Error(`ledger_lock_failed:${up.error.message}`);if (!up.data) return json({ ok: false, error: "invoice_issue_in_progress" }, 409, origin);

    let response: Response;try {response = await fetch(SUMIT_URL, {method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(sumitPayload(ctx)),signal:AbortSignal.timeout(20000)});} catch {await service.from("triply_accounting_documents").update({ status: "uncertain", last_error: "SUMIT network/timeout; verify provider before retry", updated_at: new Date().toISOString() }).eq("id", ledger.id);return json({ ok: false, error: "sumit_result_uncertain", detail: "No automatic retry will be attempted." }, 502, origin);}
    const result = await response.json().catch(() => ({}));const data = result?.Data || result || {};const documentId = idstr(result?.DocumentID) || idstr(data?.DocumentID) || idstr(data?.Document?.ID);const documentNumber = idstr(result?.DocumentNumber) || idstr(data?.DocumentNumber) || idstr(data?.Document?.Number);const documentUrl = str(result?.DocumentDownloadURL) || str(data?.DocumentDownloadURL) || str(data?.Document?.DownloadURL);const providerCustomerId = idstr(result?.CustomerID) || idstr(data?.CustomerID) || idstr(data?.Customer?.ID);const providerError = str(result?.UserErrorMessage) || str(result?.TechnicalErrorDetails);
    if (!response.ok || providerError || !documentId) {const err = safeError(result, `SUMIT HTTP ${response.status}`);await service.from("triply_accounting_documents").update({ status: "uncertain", last_error: err, updated_at: new Date().toISOString() }).eq("id", ledger.id);return json({ ok: false, error: "manual_sumit_reconciliation_required", detail: err }, 502, origin);}
    const now = new Date().toISOString();const saved = await service.from("triply_accounting_documents").update({status:"issued",provider_document_id:documentId,provider_document_number:documentNumber,provider_customer_id:providerCustomerId,provider_download_url:documentUrl,issued_at:now,email_requested_at:now,last_error:null,updated_at:now}).eq("id", ledger.id).eq("status", "issuing").select("id").maybeSingle();
    if (saved.error || !saved.data) return json({ ok: false, error: "invoice_issued_ledger_save_failed", document_id: documentId }, 500, origin);
    let payment: any;try {payment = await finalizePayment(authz.token, leadId);} catch (e) {return json({ ok: false, error: "invoice_issued_payment_finalize_failed", document_id: documentId, document_number: documentNumber, detail: String(e).slice(0,300) }, 500, origin);}
    await service.from("security_audit_events").insert({event_type:"sumit_invoice_issued",trip_id:ctx.trip.id,target_type:"accounting_document",target_id:ledger.id,actor_user_id:authz.userId,metadata:{provider:"sumit",document_type:"invoice_and_receipt",amount:ctx.amount,currency:"ILS",email_requested:true}});
    return json({ ok: true, document_id: documentId, document_number: documentNumber, document_url: documentUrl, email_requested: true, payment }, 200, origin);
  } catch (e) {const msg = e instanceof Error ? e.message : String(e);const known = ['whatsapp_lead_not_found','questionnaire_incomplete','missing_customer_email','trip_materialization_failed','trip_not_found','invalid_trip_dates'];return json({ ok: false, error: known.includes(msg) ? msg : 'internal_error', detail: known.includes(msg) ? undefined : msg.slice(0,250) }, known.includes(msg) ? 400 : 500, origin);}
});
