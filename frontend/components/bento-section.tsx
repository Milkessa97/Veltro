import { cn } from "@/lib/utils"
import { CycleTimeIllustration } from "./LandingPage/bento/cycle-time-illustration"
import { AiDigestIllustration } from "./LandingPage/bento/ai-digest-illustration"
import { BottleneckIllustration } from "./LandingPage/bento/bottleneck-illustration"
import { ReviewFlowIllustration } from "./LandingPage/bento/review-flow-illustration"
import { ThroughputIllustration } from "./LandingPage/bento/throughput-illustration"
import { GithubSyncIllustration } from "./LandingPage/bento/github-sync-illustration"

interface BentoCardProps {
  title: string
  description: string
  Component: React.ComponentType
  className?: string
  isWide?: boolean
}

const BentoCard = ({
  title,
  description,
  Component,
  className = "",
  isWide = false,
}: BentoCardProps) => (
  <div
    className={cn(
      "overflow-hidden rounded-2xl border border-white/10 flex relative bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5",
      isWide ? "flex-col md:flex-row md:items-stretch" : "flex-col",
      className
    )}
  >
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(231, 236, 235, 0.04)",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

    <div
      className={cn(
        "p-5 md:p-6 flex flex-col justify-start items-start relative z-10",
        isWide ? "md:w-1/2 md:justify-center" : "self-stretch"
      )}
    >
      <div className="self-stretch flex flex-col justify-start items-start">
        <h3 className="self-stretch text-foreground text-base md:text-lg font-semibold tracking-tight leading-normal text-balance">
          {title}
        </h3>
        <p className="self-stretch text-muted-foreground text-xs md:text-sm font-medium leading-relaxed mt-2 text-pretty">
          {description}
        </p>
      </div>
    </div>
    <div
      className={cn(
        "relative z-10 flex items-center justify-center overflow-hidden",
        isWide ? "md:w-1/2 h-56 md:h-auto min-h-[220px]" : "self-stretch h-56 md:h-60"
      )}
    >
      <Component />
    </div>
  </div>
)

export function BentoSection() {
  const cards: BentoCardProps[] = [
    {
      title: "Cycle time tracking",
      description: "See how long changes take from first commit to merge.",
      Component: CycleTimeIllustration,
      className: "md:col-span-2",
      isWide: true,
    },
    {
      title: "AI weekly digests",
      description: "Plain-language summaries of what shipped and what stalled.",
      Component: AiDigestIllustration,
      className: "md:col-span-1",
      isWide: false,
    },
    {
      title: "Bottleneck detection",
      description: "Pinpoint the reviews and PRs blocking your team.",
      Component: BottleneckIllustration,
      className: "md:col-span-1",
      isWide: false,
    },
    {
      title: "Review flow insights",
      description: "Understand who reviews what and where handoffs slow down.",
      Component: ReviewFlowIllustration,
      className: "md:col-span-2",
      isWide: true,
    },
    {
      title: "Throughput trends",
      description: "Track merged PRs and deploy frequency over time.",
      Component: ThroughputIllustration,
      className: "md:col-span-1",
      isWide: false,
    },
    {
      title: "One-click GitHub sync",
      description: "Connect a repo and DevPulse keeps metrics up to date.",
      Component: GithubSyncIllustration,
      className: "md:col-span-2",
      isWide: true,
    },
  ]

  return (
    <section className="w-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col justify-center items-center overflow-visible bg-transparent">
      <div className="w-full py-6 md:py-12 relative flex flex-col justify-start items-start gap-6">
        <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        <div className="self-stretch py-6 md:py-10 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-3">
            <h2 className="w-full max-w-[65ch] text-center text-foreground text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight md:tracking-[-0.03em] leading-[1.1] text-balance">
              Everything you need to ship faster
            </h2>
            <p className="w-full max-w-[55ch] text-center text-muted-foreground/90 text-sm md:text-base font-medium leading-relaxed text-pretty">
              DevPulse reads your GitHub history and turns it into the metrics engineering teams actually act on.
            </p>
          </div>
        </div>
        <div className="self-stretch grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
          {cards.map((card) => (
            <BentoCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}

