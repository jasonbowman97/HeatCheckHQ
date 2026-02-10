export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: "month"
}

export const PRODUCTS: Product[] = [
  {
    id: "pro-monthly",
    name: "HeatCheck HQ Pro",
    description:
      "Full access to every dashboard, trend, and insight across MLB, NBA, and NFL.",
    priceInCents: 1200, // $12.00
    interval: "month",
  },
]
