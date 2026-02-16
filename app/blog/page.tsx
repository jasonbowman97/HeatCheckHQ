import Link from "next/link"
import { getAllPosts } from "@/lib/blog"
import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "Blog — Sports Betting Insights & Guides | HeatCheck HQ",
  description:
    "Daily picks recaps, how-to guides, and expert analysis for MLB, NBA, and NFL sports betting.",
  path: "/blog",
  keywords: [
    "sports betting blog",
    "MLB picks",
    "NBA picks",
    "NFL picks",
    "betting guides",
    "NRFI picks",
    "first basket picks",
  ],
})

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="mx-auto max-w-3xl px-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Insights, guides, and analysis for sports bettors.
        </p>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No posts yet. Check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-border p-6 transition-colors hover:border-primary/30 hover:bg-card/50"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {post.title}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {post.description}
              </p>

              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
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
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
