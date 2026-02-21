/** Page-specific tips for section info icons (extracted from old onboarding tooltips) */
export const SECTION_TIPS: Record<string, { title: string; tips: string[] }> = {
  "/check": {
    title: "Prop Analyzer",
    tips: [
      "Search any player to instantly see all their props analyzed at a glance.",
      "Switch between stats to see the full game log with hit rates and convergence signals.",
      "Use the L5/L10/L20/All toggle to view different sample sizes.",
    ],
  },
  "/mlb/hot-hitters": {
    title: "Hot Hitters Dashboard",
    tips: [
      "Tracks active multi-game hitting, power, and XBH streaks across all rostered MLB batters.",
      "Use the filters to narrow by streak type (hits, HR, XBH) and team.",
      "Players marked 'Today' have a game scheduled — great for same-day prop bets.",
    ],
  },
  "/mlb/hitting-stats": {
    title: "Hitter vs Pitcher Matchups",
    tips: [
      "Select a game from today's schedule, then pick a starting pitcher.",
      "See every opposing batter's career stats against that pitcher's pitch types.",
      "Filter by batter hand (LHH/RHH) and pitch type for targeted analysis.",
    ],
  },
  "/mlb/pitching-stats": {
    title: "Pitching Stats & Arsenal",
    tips: [
      "Deep dive into any pitcher's arsenal — pitch usage, velocity, movement, and results.",
      "CSW% (Called Strike + Whiff %) measures pitch deception.",
      "Compare a pitcher's recent form against their season averages.",
    ],
  },
  "/mlb/nrfi": {
    title: "No Run First Inning (NRFI)",
    tips: [
      "Shows each starting pitcher's record of allowing 0 runs in the 1st inning.",
      "Higher NRFI% = the pitcher usually keeps the 1st inning scoreless.",
      "Combine both starters' NRFI rates for today's best NRFI bet matchups.",
    ],
  },
  "/mlb/weather": {
    title: "Ballpark Weather",
    tips: [
      "Real-time weather for every MLB stadium with games today.",
      "Wind speed/direction, temperature, and humidity all affect ball flight.",
      "Hot + wind out = more home runs. Cold + wind in = pitcher-friendly.",
    ],
  },
  "/mlb/streaks": {
    title: "MLB Streak Tracker",
    tips: [
      "Set custom thresholds for H, HR, RBI, R, SB, TB, and K.",
      "Both batters and pitchers are tracked. Pitchers use strikeouts (K) as the key stat.",
      "Click any player name to open their full prop analysis.",
    ],
  },
  "/nba/first-basket": {
    title: "First Basket Picks",
    tips: [
      "Rankings based on first basket %, first shot attempt %, and tipoff win rate.",
      "Top picks ranked by calculated probability: Tip% × 1st Shot% × conversion ratio.",
      "Filter by minimum games played to remove small-sample flukes.",
    ],
  },
  "/nba/head-to-head": {
    title: "Team Head-to-Head",
    tips: [
      "Pick two teams to see their season series history and momentum.",
      "Includes injury reports for both teams — key for spread and total bets.",
      "Recent form (last 10 games) often matters more than season-long stats.",
    ],
  },
  "/nba/defense-vs-position": {
    title: "Defense vs Position",
    tips: [
      "Shows how each team defends against specific positions (PG, SG, SF, PF, C).",
      "Green = that defense is weak (good matchup). Red = tough defense.",
      "Great for player prop research — find soft matchups for points, rebounds, assists.",
    ],
  },
  "/nba/streaks": {
    title: "NBA Streak Tracker",
    tips: [
      "Set custom thresholds for PTS, REB, AST, 3PM, STL, BLK.",
      "Use the game window selector to compare last 5, 10, 15, or full season consistency.",
      "Click any player name to open their full prop analysis inline.",
    ],
  },
  "/nfl/matchup": {
    title: "NFL Matchup Analysis",
    tips: [
      "Full stat comparison between two NFL teams — offense, defense, and special teams.",
      "Player-level breakdowns for passing, rushing, and receiving leaders.",
      "Use spread/total context to frame your matchup analysis.",
    ],
  },
  "/nfl/defense-vs-position": {
    title: "NFL Defense vs Position",
    tips: [
      "See which defenses are weakest against QB, RB, and WR.",
      "Helpful for identifying soft matchups for rushing or passing props.",
      "Rankings update throughout the season as games are played.",
    ],
  },
  "/nfl/streaks": {
    title: "NFL Streak Tracker",
    tips: [
      "Set custom thresholds for Pass YD, Pass TD, Rush YD, Rush TD, Rec YD, REC, Rec TD.",
      "Top 30 QBs, RBs, and WRs by season stats are tracked with full game logs.",
      "Click any player name to open their full prop analysis inline.",
    ],
  },
  "/mlb/due-for-hr": {
    title: "Due for a Home Run",
    tips: [
      "Tracks how long each batter has gone without a home run relative to their season pace.",
      "Higher 'overdue' scores mean the player is further behind their typical HR frequency.",
      "Best used alongside matchup data — overdue + soft pitching = prime HR spot.",
    ],
  },
}
