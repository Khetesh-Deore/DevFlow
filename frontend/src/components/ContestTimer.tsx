import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContestTimerProps {
  endTime: string;
}

const ContestTimer = ({ endTime }: ContestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal');

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Contest Ended');
        setUrgency('danger');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

      const totalMinutes = diff / 60000;
      if (totalMinutes < 5) setUrgency('danger');
      else if (totalMinutes < 10) setUrgency('warning');
      else setUrgency('normal');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-md transition-colors',
        urgency === 'danger' && 'bg-destructive/10 border border-destructive/20',
        urgency === 'warning' && 'bg-warning/10 border border-warning/20',
        urgency === 'normal' && 'bg-accent'
      )}
    >
      <Clock
        className={cn(
          'h-4 w-4',
          urgency === 'danger' && 'text-destructive',
          urgency === 'warning' && 'text-warning',
          urgency === 'normal' && 'text-warning'
        )}
      />
      <span
        className={cn(
          'font-semibold',
          urgency === 'danger' && 'text-destructive',
          urgency === 'warning' && 'text-warning',
          urgency === 'normal' && 'text-foreground'
        )}
      >
        {timeLeft}
      </span>
    </div>
  );
};

export default ContestTimer;
