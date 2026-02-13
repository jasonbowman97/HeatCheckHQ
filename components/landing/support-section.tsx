import { Mail, MessageCircle, Bug } from "lucide-react"
import { FadeIn } from "@/components/ui/fade-in"

const supportOptions = [
  {
    icon: MessageCircle,
    title: "General Questions",
    description: "Have a question about the platform, features, or your account? We're happy to help.",
    action: "support@heatcheckhq.com",
    actionLabel: "Email us",
  },
  {
    icon: Bug,
    title: "Report an Issue",
    description: "Found a bug or something not working right? Let us know and we'll get it fixed.",
    action: "support@heatcheckhq.com",
    actionLabel: "Report a bug",
  },
  {
    icon: Mail,
    title: "Feature Requests",
    description: "Have an idea for a new dashboard, stat, or feature? We'd love to hear it.",
    action: "support@heatcheckhq.com",
    actionLabel: "Share your idea",
  },
]

export function SupportSection() {
  return (
    <section id="support" className="py-20 md:py-28 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Need help?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether it&apos;s a question, bug report, or feature idea — we&apos;re here to help.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {supportOptions.map((option, i) => (
            <FadeIn key={option.title} delay={i * 0.1}>
              <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center transition-colors hover:border-primary/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{option.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
                <a
                  href={`mailto:${option.action}?subject=${encodeURIComponent(option.title)}`}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {option.actionLabel}
                  <Mail className="h-3.5 w-3.5" />
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
