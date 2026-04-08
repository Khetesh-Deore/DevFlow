export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hexagon */}
      <path
        d="M50 5 L85 27.5 L85 72.5 L50 95 L15 72.5 L15 27.5 Z"
        fill="url(#gradient1)"
        stroke="url(#gradient2)"
        strokeWidth="3"
      />
      
      {/* Code brackets */}
      <path
        d="M35 35 L25 50 L35 65"
        stroke="#60A5FA"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M65 35 L75 50 L65 65"
        stroke="#60A5FA"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Forward slash */}
      <path
        d="M55 30 L45 70"
        stroke="#A78BFA"
        strokeWidth="5"
        strokeLinecap="round"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}
