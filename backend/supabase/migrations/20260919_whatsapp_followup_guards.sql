CREATE OR REPLACE FUNCTION public.triply_schedule_whatsapp_followup()
RETURNS trigger LANGUAGE plpgsql SET search_path TO public AS $function$
BEGIN
  -- A late webhook cannot undo an administrator's payment confirmation.
  IF TG_OP = 'UPDATE' THEN
    IF OLD.payment_status = 'verified' AND NEW.payment_status IN ('not_started','link_available','pending_verification') THEN
      NEW.payment_status := OLD.payment_status;
      NEW.status := OLD.status;
    END IF;
  END IF;
  -- Evaluate cancellation even when only the profile changed.
  IF COALESCE(NEW.profile->>'followup_opt_out','false') IN ('true','1')
     OR COALESCE(NEW.profile->>'human_handoff','false') IN ('true','1')
     OR COALESCE(NEW.profile->>'safety_hold','false') IN ('true','1')
     OR COALESCE(NEW.profile->>'non_customer','false') IN ('true','1')
     OR COALESCE(NEW.profile->>'ai_enabled','true') = 'false'
     OR NEW.status IN ('closed','converted')
     OR COALESCE(NEW.profile->>'payment_claimed','false') IN ('true','1')
     OR COALESCE(NEW.payment_status,'not_started') NOT IN ('not_started','link_available') THEN
    NEW.followup_due_at := NULL;
    NEW.followup_status := CASE WHEN COALESCE(NEW.profile->>'followup_opt_out','false') IN ('true','1') THEN 'opted_out' ELSE 'complete' END;
  ELSIF TG_OP = 'INSERT' OR NEW.last_synced_at IS DISTINCT FROM OLD.last_synced_at THEN
    IF TG_OP = 'UPDATE' AND OLD.followup_status = 'sent' AND OLD.followup_sent_at IS NOT NULL
       AND NEW.last_synced_at <= OLD.followup_sent_at + INTERVAL '5 minutes' THEN
      NEW.followup_due_at := NULL;
      NEW.followup_status := 'sent';
    ELSE
      -- Autocalls posts after one minute of inactivity: 1 + 119 ~= two hours.
      NEW.followup_due_at := NEW.last_synced_at + INTERVAL '119 minutes';
      NEW.followup_sent_at := NULL;
      NEW.followup_status := 'scheduled';
      NEW.followup_attempts := 0;
      NEW.followup_last_error := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
