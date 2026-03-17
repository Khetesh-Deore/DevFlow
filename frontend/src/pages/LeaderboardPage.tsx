import { useParams } from 'react-router-dom';
import { mockLeaderboard, mockContests } from '@/utils/mockData';
import LeaderboardTable from '@/components/LeaderboardTable';
import { Trophy } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const LeaderboardPage = () => {
  const { contestId } = useParams();
  const contest = mockContests.find(c => c.id === contestId) || mockContests[0];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">{contest.title}</p>
          </div>
        </div>
        <LeaderboardTable entries={mockLeaderboard} />
      </div>
    </PageTransition>
  );
};

export default LeaderboardPage;
