

-- Function to get captain profile by user ID
CREATE OR REPLACE FUNCTION public.get_captain_profile_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  vehicle_type TEXT,
  vehicle_registration TEXT,
  service_areas JSONB,
  availability_schedule JSONB,
  is_active BOOLEAN,
  is_available BOOLEAN,
  current_location JSONB,
  verification_status TEXT,
  average_rating NUMERIC,
  total_deliveries INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.user_id,
    cp.vehicle_type,
    cp.vehicle_registration,
    cp.service_areas,
    cp.availability_schedule,
    cp.is_active,
    cp.is_available,
    cp.current_location,
    cp.verification_status,
    cp.average_rating,
    cp.total_deliveries,
    cp.created_at,
    cp.updated_at
  FROM
    public.captain_profiles cp
  WHERE
    cp.user_id = p_user_id;
END;
$$;

-- Function to update captain availability
CREATE OR REPLACE FUNCTION public.update_captain_availability(p_user_id UUID, p_is_available BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_captain_id UUID;
BEGIN
  -- Get the captain profile ID
  SELECT id INTO v_captain_id FROM public.captain_profiles WHERE user_id = p_user_id;
  
  IF v_captain_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the availability status
  UPDATE public.captain_profiles
  SET is_available = p_is_available,
      updated_at = NOW()
  WHERE id = v_captain_id;
  
  RETURN TRUE;
END;
$$;

-- Function to update captain vehicle info
CREATE OR REPLACE FUNCTION public.update_captain_vehicle_info(
  p_user_id UUID,
  p_vehicle_type TEXT,
  p_vehicle_registration TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_captain_id UUID;
BEGIN
  -- Get the captain profile ID
  SELECT id INTO v_captain_id FROM public.captain_profiles WHERE user_id = p_user_id;
  
  IF v_captain_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the vehicle information
  UPDATE public.captain_profiles
  SET vehicle_type = COALESCE(p_vehicle_type, vehicle_type),
      vehicle_registration = COALESCE(p_vehicle_registration, vehicle_registration),
      updated_at = NOW()
  WHERE id = v_captain_id;
  
  RETURN TRUE;
END;
$$;
