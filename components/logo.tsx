export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bar chart base - three ascending bars */}
      <rect
        x="2"
        y="16"
        width="4"
        height="6"
        rx="1"
        className="fill-primary/60"
      />
      <rect
        x="9"
        y="12"
        width="4"
        height="10"
        rx="1"
        className="fill-primary/80"
      />
      <rect
        x="16"
        y="14"
        width="4"
        height="8"
        rx="1"
        className="fill-primary"
      />

      {/* Flame on the tallest bar */}
      <path
        d="M18 14c0 0-2.5-3-2.5-5.5c0-1.5 0.8-2.8 1.5-3.5c0.3 1.2 1.2 2 2 2.8c0.8 0.8 1.5 1.8 1.5 3.2c0 2-1.2 3-2.5 3z"
        className="fill-primary"
      />
      <path
        d="M18 14c0 0-1.2-1.5-1.2-2.8c0-0.8 0.4-1.4 0.7-1.7c0.15 0.6 0.6 1 1 1.4c0.4 0.4 0.7 0.9 0.7 1.6c0 1-0.6 1.5-1.2 1.5z"
        className="fill-primary-foreground"
        opacity="0.9"
      />
    </svg>
  )
}
