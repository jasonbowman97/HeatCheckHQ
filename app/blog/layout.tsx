import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-16">
        {children}
      </div>
      <Footer />
    </>
  )
}
