-- Fix 1: Remove public access to source_registry
DROP POLICY IF EXISTS "Source registry is viewable by everyone" ON public.source_registry;

-- Create admin-only view policy (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'source_registry' 
    AND policyname = 'Only admins can view source registry'
  ) THEN
    CREATE POLICY "Only admins can view source registry"
      ON public.source_registry FOR SELECT
      USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Fix 2: Add missing columns to predictions table
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS edge_vs_implied NUMERIC,
  ADD COLUMN IF NOT EXISTS model_probability NUMERIC,
  ADD COLUMN IF NOT EXISTS implied_probability NUMERIC;

-- Add performance index for edge filtering
CREATE INDEX IF NOT EXISTS idx_predictions_edge 
  ON public.predictions(edge_vs_implied DESC) 
  WHERE edge_vs_implied >= 5;