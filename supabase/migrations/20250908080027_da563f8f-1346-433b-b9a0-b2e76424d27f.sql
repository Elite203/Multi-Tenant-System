-- Fix remaining functions without search_path
CREATE OR REPLACE FUNCTION public.create_notification(target_user_id uuid, notification_type notification_type, notification_title text, notification_message text, notification_metadata jsonb DEFAULT '{}'::jsonb, notification_priority notification_priority DEFAULT 'medium'::notification_priority, entity_type text DEFAULT NULL::text, entity_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message, 
    metadata, 
    priority,
    related_entity_type,
    related_entity_id
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    notification_metadata,
    notification_priority,
    entity_type,
    entity_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(notification_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.notifications 
  SET read_at = now(), updated_at = now()
  WHERE id = ANY(notification_ids) 
    AND user_id = auth.uid()
    AND read_at IS NULL;
    
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications 
  WHERE user_id = auth.uid() 
    AND read_at IS NULL;
$function$;

CREATE OR REPLACE FUNCTION public.generate_document_hash(content_text text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT md5(content_text);
$function$;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;