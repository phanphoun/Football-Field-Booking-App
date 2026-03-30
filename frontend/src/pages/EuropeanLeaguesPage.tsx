import { Trophy, Clock, TrendingUp, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Match {
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'finished' | 'upcoming';
}

interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export function EuropeanLeaguesPage() {
  const [selectedLeague, setSelectedLeague] = useState<'premier-league' | 'la-liga' | 'serie-a' | 'champions-league'>('premier-league');
  
  const leagues = [
    { id: 'premier-league', name: 'Premier League', flag: '🇬🇧', color: 'from-purple-500 to-indigo-600' },
    { id: 'la-liga', name: 'La Liga', flag: '🇪🇸', color: 'from-red-500 to-orange-600' },
    { id: 'serie-a', name: 'Serie A', flag: '🇮🇹', color: 'from-blue-500 to-cyan-600' },
    { id: 'champions-league', name: 'Champions League', flag: '🇪🇺', color: 'from-emerald-500 to-teal-600' },
  ];

  const matches: Record<string, Match[]> = {
    'premier-league': [
      { time: 'Live 65\'', homeTeam: 'Manchester City', awayTeam: 'Liverpool', homeScore: 2, awayScore: 1, status: 'live' },
      { time: 'FT', homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeScore: 3, awayScore: 1, status: 'finished' },
      { time: '20:00', homeTeam: 'Manchester Utd', awayTeam: 'Tottenham', status: 'upcoming' },
    ],
    'la-liga': [
      { time: 'Live 78\'', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 2, awayScore: 2, status: 'live' },
      { time: 'FT', homeTeam: 'Atletico Madrid', awayTeam: 'Sevilla', homeScore: 1, awayScore: 0, status: 'finished' },
      { time: '21:00', homeTeam: 'Valencia', awayTeam: 'Real Sociedad', status: 'upcoming' },
    ],
    'serie-a': [
      { time: 'Live 82\'', homeTeam: 'Juventus', awayTeam: 'Inter Milan', homeScore: 1, awayScore: 1, status: 'live' },
      { time: 'FT', homeTeam: 'AC Milan', awayTeam: 'Napoli', homeScore: 2, awayScore: 1, status: 'finished' },
      { time: '19:45', homeTeam: 'Roma', awayTeam: 'Lazio', status: 'upcoming' },
    ],
    'champions-league': [
      { time: 'Live 71\'', homeTeam: 'Bayern Munich', awayTeam: 'PSG', homeScore: 3, awayScore: 2, status: 'live' },
      { time: 'FT', homeTeam: 'Real Madrid', awayTeam: 'Man City', homeScore: 1, awayScore: 1, status: 'finished' },
      { time: '20:00', homeTeam: 'Barcelona', awayTeam: 'Liverpool', status: 'upcoming' },
    ],
  };

  const standings: Record<string, Standing[]> = {
    'premier-league': [
      { position: 1, team: 'Liverpool', played: 28, won: 20, drawn: 5, lost: 3, gf: 68, ga: 28, gd: 40, points: 65 },
      { position: 2, team: 'Manchester City', played: 28, won: 19, drawn: 4, lost: 5, gf: 65, ga: 30, gd: 35, points: 61 },
      { position: 3, team: 'Arsenal', played: 28, won: 18, drawn: 6, lost: 4, gf: 62, ga: 32, gd: 30, points: 60 },
      { position: 4, team: 'Chelsea', played: 28, won: 16, drawn: 7, lost: 5, gf: 55, ga: 35, gd: 20, points: 55 },
      { position: 5, team: 'Tottenham', played: 28, won: 15, drawn: 6, lost: 7, gf: 52, ga: 38, gd: 14, points: 51 },
    ],
    'la-liga': [
      { position: 1, team: 'Barcelona', played: 28, won: 21, drawn: 4, lost: 3, gf: 70, ga: 25, gd: 45, points: 67 },
      { position: 2, team: 'Real Madrid', played: 28, won: 20, drawn: 5, lost: 3, gf: 68, ga: 28, gd: 40, points: 65 },
      { position: 3, team: 'Atletico Madrid', played: 28, won: 17, drawn: 6, lost: 5, gf: 55, ga: 30, gd: 25, points: 57 },
      { position: 4, team: 'Real Sociedad', played: 28, won: 15, drawn: 7, lost: 6, gf: 48, ga: 32, gd: 16, points: 52 },
      { position: 5, team: 'Sevilla', played: 28, won: 14, drawn: 8, lost: 6, gf: 45, ga: 35, gd: 10, points: 50 },
    ],
    'serie-a': [
      { position: 1, team: 'Inter Milan', played: 28, won: 22, drawn: 4, lost: 2, gf: 72, ga: 22, gd: 50, points: 70 },
      { position: 2, team: 'AC Milan', played: 28, won: 19, drawn: 5, lost: 4, gf: 60, ga: 28, gd: 32, points: 62 },
      { position: 3, team: 'Juventus', played: 28, won: 18, drawn: 6, lost: 4, gf: 58, ga: 30, gd: 28, points: 60 },
      { position: 4, team: 'Napoli', played: 28, won: 17, drawn: 5, lost: 6, gf: 55, ga: 32, gd: 23, points: 56 },
      { position: 5, team: 'Roma', played: 28, won: 16, drawn: 6, lost: 6, gf: 52, ga: 35, gd: 17, points: 54 },
    ],
    'champions-league': [
      { position: 1, team: 'Bayern Munich', played: 6, won: 5, drawn: 1, lost: 0, gf: 18, ga: 6, gd: 12, points: 16 },
      { position: 2, team: 'Man City', played: 6, won: 4, drawn: 2, lost: 0, gf: 15, ga: 5, gd: 10, points: 14 },
      { position: 3, team: 'Real Madrid', played: 6, won: 4, drawn: 1, lost: 1, gf: 14, ga: 8, gd: 6, points: 13 },
      { position: 4, team: 'PSG', played: 6, won: 3, drawn: 2, lost: 1, gf: 12, ga: 7, gd: 5, points: 11 },
      { position: 5, team: 'Barcelona', played: 6, won: 3, drawn: 1, lost: 2, gf: 11, ga: 9, gd: 2, points: 10 },
    ],
  };

  const currentLeague = leagues.find(l => l.id === selectedLeague)!;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 mb-2">European Leagues</h1>
        <p className="text-slate-600">Live scores, standings, and match schedules</p>
      </motion.div>

      {/* League Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leagues.map((league, index) => (
          <motion.button
            key={league.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedLeague(league.id as any)}
            className={`relative rounded-2xl p-6 text-center transition-all overflow-hidden ${
              selectedLeague === league.id
                ? 'shadow-2xl scale-105'
                : 'shadow-lg hover:shadow-xl hover:scale-102 opacity-70'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${league.color}`} />
            <div className="relative z-10">
              <div className="text-4xl mb-2">{league.flag}</div>
              <div className="text-white font-bold">{league.name}</div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Live Matches */}
      <motion.div
        key={selectedLeague}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
      >
        <div className={`bg-gradient-to-r ${currentLeague.color} p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">{currentLeague.flag}</span>
              {currentLeague.name} - Matches
            </h2>
            <Clock className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {matches[selectedLeague].map((match, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border-2 ${
                match.status === 'live' 
                  ? 'bg-emerald-50 border-emerald-300' 
                  : match.status === 'finished'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-blue-50 border-blue-300'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Time/Status */}
                <div className="w-24 flex-shrink-0">
                  {match.status === 'live' && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-bold text-red-600">{match.time}</span>
                    </div>
                  )}
                  {match.status === 'finished' && (
                    <span className="text-sm font-semibold text-slate-600">{match.time}</span>
                  )}
                  {match.status === 'upcoming' && (
                    <span className="text-sm font-semibold text-blue-600">{match.time}</span>
                  )}
                </div>

                {/* Teams & Score */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{match.homeTeam}</span>
                    {match.homeScore !== undefined && (
                      <span className="text-2xl font-bold text-slate-900">{match.homeScore}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{match.awayTeam}</span>
                    {match.awayScore !== undefined && (
                      <span className="text-2xl font-bold text-slate-900">{match.awayScore}</span>
                    )}
                  </div>
                </div>

                {/* Badge */}
                <div>
                  {match.status === 'live' && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      LIVE
                    </span>
                  )}
                  {match.status === 'finished' && (
                    <span className="px-3 py-1 bg-slate-500 text-white text-xs font-bold rounded-full">
                      FT
                    </span>
                  )}
                  {match.status === 'upcoming' && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      UPCOMING
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Standings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
      >
        <div className={`bg-gradient-to-r ${currentLeague.color} p-6`}>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Standings
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Pos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Team</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">P</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">W</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">D</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">L</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">GF</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">GA</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">GD</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {standings[selectedLeague].map((standing, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`hover:bg-slate-50 transition-colors ${
                    standing.position <= 4 ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        standing.position === 1 ? 'bg-amber-500 text-white' :
                        standing.position <= 4 ? 'bg-emerald-500 text-white' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {standing.position}
                      </div>
                      {standing.position === 1 && <Trophy className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">{standing.team}</div>
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-slate-700">{standing.played}</td>
                  <td className="px-4 py-4 text-center font-semibold text-green-600">{standing.won}</td>
                  <td className="px-4 py-4 text-center font-semibold text-slate-600">{standing.drawn}</td>
                  <td className="px-4 py-4 text-center font-semibold text-red-600">{standing.lost}</td>
                  <td className="px-4 py-4 text-center font-medium text-slate-700">{standing.gf}</td>
                  <td className="px-4 py-4 text-center font-medium text-slate-700">{standing.ga}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-semibold ${standing.gd > 0 ? 'text-green-600' : standing.gd < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {standing.gd > 0 ? '+' : ''}{standing.gd}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">
                      {standing.points}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div className="text-white">
            <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
            <p className="text-slate-300">
              Follow your favorite European leagues with live scores, real-time updates, and comprehensive standings. 
              All data is updated regularly to keep you informed.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default EuropeanLeaguesPage;
