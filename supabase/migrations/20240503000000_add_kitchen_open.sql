
-- Add kitchen_open column to seller_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'seller_profiles' 
                AND column_name = 'kitchen_open') THEN
    ALTER TABLE public.seller_profiles ADD COLUMN kitchen_open BOOLEAN DEFAULT false;
  END IF;
END $$;
