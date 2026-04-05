import { useState, useEffect } from 'react';

export default function useContestTimer(endTime) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setTimeLeft(Math.max(0, new Date(endTime) - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return { timeLeft, hours, minutes, seconds, ended: timeLeft === 0 };
}
