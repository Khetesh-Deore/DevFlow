import { Link } from 'react-router-dom';
import { Trophy, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Contest } from '@/store/contestStore';

interface ContestCardProps {
  contest: Contest;
}

const statusStyles: Record<string, string> = {
  upcoming: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  ended: 'bg-muted text-muted-foreground border-border',
};

const ContestCard = ({ contest }: ContestCardProps) => {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 30px -8px hsl(142 71% 45% / 0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group rounded-lg border border-border bg-card p-4 md:p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary shrink-0" />
          <Badge variant="outline" className={statusStyles[contest.status]}>
            {contest.status}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{contest.problems.length} problems</span>
      </div>

      <h3 className="font-semibold text-foreground mb-1.5 md:mb-2 group-hover:text-primary transition-colors text-sm md:text-base">
        {contest.title}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">{contest.description}</p>

      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground mb-3 md:mb-4">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatDate(contest.startTime)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {contest.participantCount}
        </span>
        <span>{contest.duration} min</span>
      </div>

      <Link to={`/contest/${contest.id}`}>
        <Button size="sm" className={contest.status === 'active' ? 'bg-primary text-primary-foreground hover:bg-primary/90 w-full' : 'w-full'} variant={contest.status === 'active' ? 'default' : 'outline'}>
          {contest.status === 'active' ? 'Enter Contest' : contest.status === 'upcoming' ? 'View Details' : 'View Results'}
        </Button>
      </Link>
    </motion.div>
  );
};

export default ContestCard;
