import { useState, useEffect, useRef } from 'react';

function pad(n) { return String(n).padStart(2, '0'); }

export default function ContestTimer({ endTime, onEnd, size = 'small' }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, new Date(endTime) - Date.now()));
  const intervalRef = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, new Date(endTime) - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0 && !endedRef.current) {
        endedRef.current = true;
        clearInterval(intervalRef.current);
        onEnd?.();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [endTime]);

  const hours   = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isRed    = timeLeft <= 600000;
  const isPulse  = timeLeft <= 300000 && timeLeft > 0;

  const colorClass = timeLeft === 0
    ? 'text-gray-500'
    : isRed
    ? 'text-red-400'
    : 'text-white';

  const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  if (size === 'large') {
    return (
      <div className={`font-mono font-bold tabular-nums ${colorClass} ${isPulse ? 'animate-pulse' : ''} text-4xl`}>
        {display}
      </div>
    );
  }

  return (
    <span className={`font-mono font-bold tabular-nums text-sm ${colorClass} ${isPulse ? 'animate-pulse' : ''}`}>
      {display}
    </span>
  );
}
