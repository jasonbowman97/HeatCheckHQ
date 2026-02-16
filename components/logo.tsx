export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flame — stylized upward fire shape */}
      <path
        d="M12 2C12 2 7 8.5 7 13a5 5 0 0 0 10 0c0-4.5-5-11-5-11z"
        className="fill-primary"
      />
      {/* Inner flame highlight */}
      <path
        d="M12 8c0 0-2.5 3.5-2.5 5.5a2.5 2.5 0 0 0 5 0c0-2-2.5-5.5-2.5-5.5z"
        className="fill-primary-foreground"
        opacity="0.85"
      />
      {/* Checkmark at the base of the flame */}
      <path
        d="M9.5 14l1.75 1.75L14.5 12.5"
        className="stroke-primary"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom bar — data/analytics accent */}
      <rect x="6" y="20" width="12" height="2" rx="1" className="fill-primary/50" />
    </svg>
  )
}
