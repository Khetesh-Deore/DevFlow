export default function TagBadge({ tag, onClick }) {
  return (
    <span
      onClick={onClick}
      className={`text-xs bg-gray-800 text-gray-400 px-2.5 py-0.5 rounded-full border border-gray-700
        ${onClick ? 'cursor-pointer hover:border-blue-500 hover:text-blue-400 transition-colors' : ''}`}
    >
      {tag}
    </span>
  );
}
