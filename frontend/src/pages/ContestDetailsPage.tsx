import { useParams, Link } from 'react-router-dom';
import { mockContests } from '@/utils/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

const statusStyles: Record<string, string> = {
  upcoming: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  ended: 'bg-muted text-muted-foreground border-border',
};

const difficultyStyles: Record<string, string> = {
  Easy: 'text-success',
  Medium: 'text-warning',
  Hard: 'text-destructive',
};

const ContestDetailsPage = () => {
  const { contestId } = useParams();
  const contest = mockContests.find(c => c.id === contestId) || mockContests[0];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className={statusStyles[contest.status]}>{contest.status}</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-3">{contest.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">{contest.description}</p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 text-sm text-muted-foreground mb-6 md:mb-8">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {formatDate(contest.startTime)}</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {contest.duration} minutes</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" /> {contest.participantCount} participants</span>
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0" /> {contest.problems.length} problems</span>
          </div>

          {contest.status !== 'ended' && (
            <Link to={`/contest/${contest.id}/arena`}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                {contest.status === 'active' ? 'Enter Contest' : 'Join Contest'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Problems</h2>
          <div className="space-y-2">
            {contest.problems.map((problem, i) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <span className="text-sm text-muted-foreground font-mono w-6 shrink-0">{i + 1}</span>
                  <span className="font-medium text-foreground text-sm md:text-base truncate">{problem.title}</span>
                </div>
                <span className={`text-sm font-medium shrink-0 ml-2 ${difficultyStyles[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-6 md:mt-8">
          <Link to={`/contest/${contest.id}/leaderboard`}>
            <Button variant="outline" className="w-full sm:w-auto">View Leaderboard</Button>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default ContestDetailsPage;
