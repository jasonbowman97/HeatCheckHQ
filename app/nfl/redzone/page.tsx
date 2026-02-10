import type { Metadata } from "next"
import RedzoneClient from "./redzone-client"

export const metadata: Metadata = {
  title: "HeatCheck HQ - NFL Redzone Stats",
  description:
    "NFL redzone target and efficiency data. Passing, rushing, and receiving breakdowns for redzone performance.",
}

export default function NFLRedzonePage() {
  return <RedzoneClient />
}
