export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  stripePriceId: string
  interval: "month" | "year"
  label: string
  savings?: string
}

export const PRODUCTS: Product[] = [
  {
    id: "pro-monthly",
    name: "HeatCheck.io Pro",
    description:
      "Full access to every dashboard, trend, and insight across MLB, NBA, and NFL.",
    priceInCents: 1200, // $12.00
    stripePriceId: "price_1SzJrERn1HmfixUe6yZ76QeI",
    interval: "month",
    label: "$12 / month",
  },
  {
    id: "pro-annual",
    name: "HeatCheck.io Pro",
    description:
      "Full access to every dashboard, trend, and insight across MLB, NBA, and NFL.",
    priceInCents: 10000, // $100.00
    stripePriceId: "price_1SzJrZRn1HmfixUerOLlVeAr",
    interval: "year",
    label: "$100 / year",
    savings: "Save $44",
  },
]
