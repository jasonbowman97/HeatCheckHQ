import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image?: string
  content: string
}

const BLOG_DIR = path.join(process.cwd(), "content/blog")

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8")
    const { data, content } = matter(raw)
    const slug = data.slug ?? file.replace(/\.mdx$/, "")

    return {
      slug,
      title: data.title ?? "Untitled",
      description: data.description ?? "",
      date: data.date ?? "",
      author: data.author ?? "HeatCheck HQ Team",
      tags: data.tags ?? [],
      image: data.image,
      content,
    }
  })

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8")
    const { data, content } = matter(raw)
    const fileSlug = data.slug ?? file.replace(/\.mdx$/, "")

    if (fileSlug === slug) {
      return {
        slug: fileSlug,
        title: data.title ?? "Untitled",
        description: data.description ?? "",
        date: data.date ?? "",
        author: data.author ?? "HeatCheck HQ Team",
        tags: data.tags ?? [],
        image: data.image,
        content,
      }
    }
  }

  return null
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}
