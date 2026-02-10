import type { SVGProps } from "react"

export function BaseballIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93c4.08 2.38 4.08 11.76 0 14.14" />
      <path d="M19.07 4.93c-4.08 2.38-4.08 11.76 0 14.14" />
    </svg>
  )
}

export function BasketballIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2v20" />
      <path d="M5.15 5.15c3.5 3.5 3.5 10.2 0 13.7" />
      <path d="M18.85 5.15c-3.5 3.5-3.5 10.2 0 13.7" />
    </svg>
  )
}

export function FootballIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
      <path d="M9 9l6 6" />
      <path d="M9 12l3 3" />
      <path d="M12 9l3 3" />
    </svg>
  )
}


