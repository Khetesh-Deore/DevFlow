const styles = {
  Easy:   'bg-green-400/10 text-green-400',
  Medium: 'bg-yellow-400/10 text-yellow-400',
  Hard:   'bg-red-400/10 text-red-400'
};

export default function DifficultyBadge({ difficulty }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[difficulty] || 'bg-gray-700 text-gray-400'}`}>
      {difficulty}
    </span>
  );
}
