import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Game {
  id: string;
  season: number;
  week: number;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  venue: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

export interface Prediction {
  id: string;
  game_id: string;
  market_type: string;
  predicted_value: number;
  confidence: number;
  uncertainty_band: any;
  predicted_at: string;
}

export interface OddsSnapshot {
  id: string;
  game_id: string;
  snapshot_time: string;
  bookmaker: string;
  market_type: string;
  odds_data: any;
}

export interface Signal {
  id: string;
  game_id: string;
  signal_type: string;
  source: string;
  content: any;
  confidence: number | null;
  timestamp: string;
}

export interface GameWithData extends Game {
  predictions: Prediction[];
  odds_snapshots: OddsSnapshot[];
  signals: Signal[];
}

export const useTodaysGames = () => {
  return useQuery({
    queryKey: ['games', 'today'],
    queryFn: async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          predictions(*),
          odds_snapshots(*),
          signals(*)
        `)
        .gte('kickoff_time', today.toISOString())
        .lte('kickoff_time', tomorrow.toISOString())
        .order('kickoff_time');

      if (error) throw error;
      return data as GameWithData[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useGame = (gameId: string) => {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          predictions(*),
          odds_snapshots(*),
          signals(*),
          features(*)
        `)
        .eq('id', gameId)
        .single();

      if (error) throw error;
      return data as GameWithData & { features: any[] };
    },
    enabled: !!gameId,
  });
};

export const useHistoricalMetrics = () => {
  return useQuery({
    queryKey: ['historical-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          predictions(*)
        `)
        .order('evaluated_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Calculate aggregate metrics
      const brierScores = data.map(e => e.brier_score).filter(s => s !== null);
      const logLosses = data.map(e => e.log_loss).filter(l => l !== null);
      const errors = data.map(e => e.error).filter(e => e !== null);

      const avgBrier = brierScores.reduce((a, b) => a + b, 0) / (brierScores.length || 1);
      const avgLogLoss = logLosses.reduce((a, b) => a + b, 0) / (logLosses.length || 1);
      const avgError = errors.reduce((a, b) => a + b, 0) / (errors.length || 1);

      // Calculate accuracy (predictions within 0.1 of actual)
      const accurate = data.filter(e => 
        e.actual_value !== null && 
        Math.abs(e.predictions?.predicted_value - e.actual_value) < 0.1
      ).length;
      const accuracy = accurate / (data.length || 1);

      return {
        avgBrier,
        avgLogLoss,
        avgError,
        accuracy,
        totalPredictions: data.length,
        evaluations: data,
      };
    },
  });
};