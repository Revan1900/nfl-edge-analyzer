-- First, remove duplicate predictions (keep most recent)
DELETE FROM public.predictions a
USING public.predictions b
WHERE a.id < b.id 
  AND a.game_id = b.game_id 
  AND a.market_type = b.market_type;

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS predictions_game_market_unique 
  ON public.predictions(game_id, market_type);

-- Create index for performance on high-edge queries
CREATE INDEX IF NOT EXISTS idx_predictions_high_edge 
  ON public.predictions(edge_vs_implied DESC) 
  WHERE edge_vs_implied >= 5;