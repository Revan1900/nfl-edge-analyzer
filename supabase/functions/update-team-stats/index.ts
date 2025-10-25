import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting team stats update...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const currentYear = new Date().getFullYear();

    // Get all completed games for current season
    const { data: completedGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('season', currentYear)
      .neq('status', 'scheduled')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);

    if (gamesError) throw gamesError;

    console.log(`Processing ${completedGames?.length || 0} completed games`);

    // Calculate stats for each team
    const teamStats: Record<string, {
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
      recentGames: string[];
    }> = {};

    for (const game of completedGames || []) {
      const homeWon = game.home_score! > game.away_score!;
      const awayWon = game.away_score! > game.home_score!;
      const tie = game.home_score === game.away_score;

      // Initialize team stats if needed
      if (!teamStats[game.home_team]) {
        teamStats[game.home_team] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, recentGames: [] };
      }
      if (!teamStats[game.away_team]) {
        teamStats[game.away_team] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, recentGames: [] };
      }

      // Update home team stats
      if (homeWon) {
        teamStats[game.home_team].wins++;
        teamStats[game.home_team].recentGames.push('W');
      } else if (tie) {
        teamStats[game.home_team].ties++;
        teamStats[game.home_team].recentGames.push('T');
      } else {
        teamStats[game.home_team].losses++;
        teamStats[game.home_team].recentGames.push('L');
      }
      teamStats[game.home_team].pointsFor += game.home_score!;
      teamStats[game.home_team].pointsAgainst += game.away_score!;

      // Update away team stats
      if (awayWon) {
        teamStats[game.away_team].wins++;
        teamStats[game.away_team].recentGames.push('W');
      } else if (tie) {
        teamStats[game.away_team].ties++;
        teamStats[game.away_team].recentGames.push('T');
      } else {
        teamStats[game.away_team].losses++;
        teamStats[game.away_team].recentGames.push('L');
      }
      teamStats[game.away_team].pointsFor += game.away_score!;
      teamStats[game.away_team].pointsAgainst += game.home_score!;
    }

    // Calculate streaks and upsert to database
    let teamsUpdated = 0;
    for (const [teamName, stats] of Object.entries(teamStats)) {
      const recentGames = stats.recentGames.slice(-5);
      const last5 = recentGames.join('-');
      
      // Calculate current streak
      let streak = '';
      if (recentGames.length > 0) {
        const lastResult = recentGames[recentGames.length - 1];
        let streakCount = 1;
        for (let i = recentGames.length - 2; i >= 0; i--) {
          if (recentGames[i] === lastResult) {
            streakCount++;
          } else {
            break;
          }
        }
        streak = `${lastResult}${streakCount}`;
      }

      const { error: upsertError } = await supabase
        .from('team_stats')
        .upsert({
          team_name: teamName,
          season: currentYear,
          wins: stats.wins,
          losses: stats.losses,
          ties: stats.ties,
          points_for: stats.pointsFor,
          points_against: stats.pointsAgainst,
          streak,
          last_5_games: last5,
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_name,season' });

      if (upsertError) {
        console.error(`Error updating stats for ${teamName}:`, upsertError);
      } else {
        teamsUpdated++;
        console.log(`Updated ${teamName}: ${stats.wins}-${stats.losses}-${stats.ties}, ${streak}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        teams_updated: teamsUpdated,
        message: 'Team stats updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Team stats update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});