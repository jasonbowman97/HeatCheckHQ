import { notFound } from "next/navigation"
import Link from "next/link"
import { MDXRemote } from "next-mdx-remote/rsc"
import { ArrowLeft } from "lucide-react"
import { getAllSlugs, getPostBySlug } from "@/lib/blog"
import { generateSEO } from "@/lib/seo"

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return generateSEO({
    title: `${post.title} | HeatCheck HQ Blog`,
    description: post.description,
    path: `/blog/${slug}`,
    keywords: post.tags,
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "HeatCheck HQ",
      logo: {
        "@type": "ImageObject",
        url: "https://heatcheckhq.io/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://heatcheckhq.io/blog/${slug}`,
    },
  }

  return (
    <main className="mx-auto max-w-3xl px-6">
      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All posts
      </Link>

      {/* Article header */}
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span className="text-border">|</span>
          <span>{post.author}</span>
        </div>
      </header>

      {/* MDX content */}
      <article className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-li:text-muted-foreground prose-code:text-primary prose-hr:border-border">
        <MDXRemote source={post.content} />
      </article>

      {/* Footer CTA */}
      <div className="mt-16 rounded-xl border border-border p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Ready to find your edge?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Explore 13 dashboards across MLB, NBA, and NFL — free to start.
        </p>
        <Link
          href="/auth/sign-up"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign Up Free
        </Link>
      </div>
    </main>
  )
}
