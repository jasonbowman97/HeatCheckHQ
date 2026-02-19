export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ascending bars — data/analytics */}
      <rect x="3" y="17" width="4" height="5" rx="1" className="fill-primary/40" />
      <rect x="10" y="13" width="4" height="9" rx="1" className="fill-primary/65" />
      <rect x="17" y="10" width="4" height="12" rx="1" className="fill-primary/90" />
      {/* Flame crest — rising from tallest bar */}
      <path
        d="M19 10c0 0-2.8-3.5-2.8-6.3c0-1.5 0.8-2.7 1.5-3.3c0.3 1.1 1.1 2 1.9 2.7c0.8 0.8 1.5 1.7 1.5 3c0 2-1.2 3.9-2.1 3.9z"
        className="fill-primary"
      />
      {/* Inner flame highlight */}
      <path
        d="M19 10c0 0-1.2-1.5-1.2-2.8c0-0.7 0.35-1.2 0.6-1.5c0.13 0.5 0.5 0.9 0.85 1.2c0.35 0.35 0.65 0.8 0.65 1.5c0 0.9-0.5 1.6-0.9 1.6z"
        className="fill-background"
        opacity="0.85"
      />
    </svg>
  )
}
