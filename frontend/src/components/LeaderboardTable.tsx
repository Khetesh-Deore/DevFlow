import { Trophy, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  username: string;
  problemsSolved: number;
  score: number;
  penalty: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const LeaderboardTable = ({ entries }: LeaderboardTableProps) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-muted-foreground font-mono">{rank}</span>;
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/50">
              <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">Rank</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Username</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Solved</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Score</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Penalty</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <motion.tr
                key={entry.rank}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className={`border-b border-border transition-colors hover:bg-accent/30 ${
                  entry.rank <= 3 ? 'bg-primary/5' : ''
                }`}
              >
                <td className="text-center px-4 py-3">{getRankIcon(entry.rank)}</td>
                <td className="px-4 py-3 font-medium text-foreground">{entry.username}</td>
                <td className="text-center px-4 py-3 text-foreground">{entry.problemsSolved}</td>
                <td className="text-center px-4 py-3 font-mono text-primary font-semibold">{entry.score}</td>
                <td className="text-center px-4 py-3 font-mono text-muted-foreground">{entry.penalty}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileHover={{ scale: 1.01 }}
            className={`rounded-lg border border-border bg-card p-3 flex items-center gap-3 ${
              entry.rank <= 3 ? 'bg-primary/5 border-primary/20' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              {getRankIcon(entry.rank)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm truncate">{entry.username}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{entry.problemsSolved} solved</span>
                <span className="font-mono text-primary font-semibold">{entry.score} pts</span>
                <span className="font-mono">penalty {entry.penalty}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
};

export default LeaderboardTable;
