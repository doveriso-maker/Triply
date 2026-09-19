CREATE OR REPLACE FUNCTION public.triply_questionnaire_ready(p_profile jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  q jsonb := coalesce(p_profile->'questionnaire','{}'::jsonb);
  modules jsonb;
  k text;
  v text;
  required_fields text[] := array['trip_name','customer_name','destination','travelers','start_date','end_date','party_type','pace','walking','car','budget_style','hotel_status','flight_status','must_have','never'];
  rating_fields text[] := array['rate_food','rate_romance','rate_beaches','rate_nature','rate_nightlife','rate_shopping','rate_culture','rate_history','rate_spa','rate_adventure','rate_markets','rate_photo'];
  module_fields text[] := array['core','party','ratings','pace','access','drive','food','shopping','nightlife','budget','hotels','flights','documents','dna'];
begin
  if p_profile is null or jsonb_typeof(p_profile) <> 'object' then return false; end if;
  if coalesce(p_profile->>'questionnaire_version','') <> 'V9_HOTELS_END_TO_END' then return false; end if;
  if coalesce(p_profile->>'questionnaire_complete','false') <> 'true' then return false; end if;
  if jsonb_typeof(q) <> 'object' then return false; end if;
  modules := coalesce(q->'modules','{}'::jsonb);
  if jsonb_typeof(modules) <> 'object' then return false; end if;

  foreach k in array module_fields loop
    if coalesce(modules->>k,'false') <> 'true' then return false; end if;
  end loop;

  foreach k in array required_fields loop
    v := nullif(btrim(coalesce(q->>k,'')),'');
    if v is null then return false; end if;
  end loop;

  foreach k in array rating_fields loop
    v := btrim(coalesce(q->>k,''));
    if v !~ '^[1-5]$' then return false; end if;
  end loop;

  v := coalesce(nullif(btrim(q->>'customer_email'),''),nullif(btrim(p_profile->>'customer_email'),''),'');
  if v !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return false; end if;
  return true;
end;
$function$;
