

-- Function to create a notification for a captain using their captain_id
CREATE OR REPLACE FUNCTION public.create_captain_notification(
  p_captain_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_related_entity_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Get the user_id from the captain profile
  SELECT user_id INTO v_user_id
  FROM public.captain_profiles
  WHERE id = p_captain_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Captain not found with ID %', p_captain_id;
  END IF;
  
  -- Insert the notification
  INSERT INTO public.notifications(
    user_id,
    title,
    message,
    type,
    related_entity_id,
    is_read
  )
  VALUES(
    v_user_id,
    p_title,
    p_message,
    'delivery',
    p_related_entity_id,
    FALSE
  )
  RETURNING to_json(notifications.*) INTO v_result;
  
  RETURN v_result;
END;
$$;
