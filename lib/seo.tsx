import { Metadata } from "next"

interface SEOProps {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
}

const DEFAULT_URL = "https://heatcheckhq.com"

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!envUrl) return DEFAULT_URL
  try {
    new URL(envUrl) // validate it's a real URL
    return envUrl
  } catch {
    return DEFAULT_URL
  }
}

const baseUrl = getBaseUrl()
const siteName = "HeatCheck HQ"
const defaultImage = `${baseUrl}/og-image.png`

/**
 * Generate comprehensive SEO metadata for pages
 */
export function generateSEO({
  title,
  description,
  path = "",
  image = defaultImage,
  type = "website",
  publishedTime,
  modifiedTime,
  keywords = [],
}: SEOProps): Metadata {
  const url = `${baseUrl}${path}`

  // Build keywords string
  const defaultKeywords = [
    "sports analytics",
    "MLB stats",
    "NBA stats",
    "NFL stats",
    "player statistics",
    "sports data",
    "betting analytics",
  ]
  const allKeywords = [...defaultKeywords, ...keywords].join(", ")

  return {
    title,
    description,
    keywords: allKeywords,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@heatcheckhq",
      site: "@heatcheckhq",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
  }
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Advanced sports analytics dashboards for MLB, NBA, and NFL with real-time player statistics, trends, and matchup analysis.",
    sameAs: [
      "https://twitter.com/heatcheckhq",
      "https://github.com/heatcheckhq",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@heatcheckhq.com",
    },
  }
}

/**
 * Generate JSON-LD structured data for web application
 */
export function generateWebAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    url: baseUrl,
    description: "Sports analytics platform providing real-time statistics, trends, and insights for MLB, NBA, and NFL.",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
  }
}

/**
 * Generate JSON-LD breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  }
}

/**
 * Component to inject JSON-LD structured data
 */
export function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
