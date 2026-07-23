"use client"

import { useState, useEffect, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Link from "next/link"
import {
  LayoutDashboard,
  GitPullRequest,
  Users2,
  Sparkles,
  History,
  Settings,
  ShieldCheck,
  Key,
  BookOpen,
  ChevronRight,
  Clock,
  GitMerge,
  Eye,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Zap,
  Lock,
  Info,
  ArrowLeft,
  Menu,
  X,
  Star,
  BarChart3,
  Timer,
  Rocket,
  Hourglass,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Sidebar Structure ─────────────────────────────────────────────────────────

const sections = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    items: [
      { id: "what-is-veltro", label: "What is Veltro?" },
      { id: "connecting-github", label: "Connecting GitHub" },
      { id: "selecting-repos", label: "Selecting Repositories" },
      { id: "first-sync", label: "Running Your First Sync" },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { id: "overview-metrics", label: "Overview Metrics" },
      { id: "cycle-time", label: "Cycle Time" },
      { id: "review-latency", label: "Time to First Review" },
      { id: "open-prs", label: "Open PRs" },
      { id: "deploy-frequency", label: "Deploy Frequency" },
      { id: "trend-chart", label: "Cycle Time Trend Chart" },
      { id: "contributor-rings", label: "Contributor Activity" },
    ],
  },
  {
    id: "pr-timeline",
    label: "PR Timeline",
    icon: GitPullRequest,
    items: [
      { id: "timeline-overview", label: "How to Read the Timeline" },
      { id: "timeline-segments", label: "Lifecycle Segments" },
    ],
  },
  {
    id: "contributors",
    label: "Contributors",
    icon: Users2,
    items: [
      { id: "contributors-table", label: "Contributors Table" },
      { id: "bottleneck-detection", label: "Bottleneck Detection" },
      { id: "ai-bottleneck", label: "AI Bottleneck Explanation" },
    ],
  },
  {
    id: "ai-digests",
    label: "AI Digests",
    icon: Sparkles,
    items: [
      { id: "what-are-digests", label: "What Are Digests?" },
      { id: "gemini-key", label: "Setting Up Your Gemini Key" },
      { id: "digest-cache", label: "Cache & Staleness" },
      { id: "digest-history", label: "Digest History" },
    ],
  },
  {
    id: "sync-history",
    label: "Sync History",
    icon: History,
    items: [
      { id: "sync-logs", label: "Reading Sync Logs" },
      { id: "sync-triggers", label: "What Triggers a Sync" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    items: [
      { id: "token-storage", label: "Token Storage" },
      { id: "github-scopes", label: "GitHub Permissions" },
      { id: "data-isolation", label: "Data Isolation" },
      { id: "encryption", label: "Encryption" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      { id: "api-key-settings", label: "Gemini API Key" },
      { id: "preferences", label: "Dashboard Preferences" },
    ],
  },
]

// ─── Utility Components ────────────────────────────────────────────────────────

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "indigo" | "amber" | "green" | "red" }) {
  const variants = {
    default: "bg-white/5 text-white/70 border-white/10",
    indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    red: "bg-red-500/10 text-red-300 border-red-500/20",
  }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border", variants[variant])}>
      {children}
    </span>
  )
}

function Callout({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warning" | "security" | "tip" }) {
  const styles = {
    info: { border: "border-indigo-500/30", bg: "bg-indigo-500/5", icon: <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" /> },
    warning: { border: "border-amber-500/30", bg: "bg-amber-500/5", icon: <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" /> },
    security: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" /> },
    tip: { border: "border-purple-500/30", bg: "bg-purple-500/5", icon: <Star className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" /> },
  }
  const s = styles[type]
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 my-6 text-sm leading-relaxed text-white/70", s.border, s.bg)}>
      {s.icon}
      <div>{children}</div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, formula, color }: { icon: any; label: string; formula: string; color: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className={cn("p-2.5 rounded-lg flex-shrink-0", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <code className="text-xs text-white/40 font-mono mt-1 block">{formula}</code>
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 pb-8 relative">
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-sm font-bold z-10">
          {n}
        </div>
        <div className="flex-1 w-px bg-white/8 mt-2" />
      </div>
      <div className="pt-1 pb-4">
        <h4 className="text-sm font-semibold text-white mb-2">{title}</h4>
        <div className="text-sm text-white/60 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-bold text-white tracking-tight mb-6 pb-4 border-b border-white/8">
        {title}
      </h2>
      {children}
    </section>
  )
}

function SubSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 mb-10">
      <h3 className="text-base font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ─── Preview Components ────────────────────────────────────────────────────────

function PreviewFrame({ children, label = "Preview" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d0d13] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── 1: KPI Cards ──────────────────────────────────────────────────────────────
const mockKpis = [
  { icon: Clock,    label: "Avg PR Cycle Time",    value: "18.4h", subtitle: "Open → merge, all merged PRs",              sentiment: "good" as const },
  { icon: Timer,    label: "Time to First Review",  value: "4.2h",  subtitle: "Open → first reviewer activity",            sentiment: "good" as const },
  { icon: Hourglass,label: "Avg Open PR Age",       value: "51.3h", subtitle: "How long open PRs have been waiting",       sentiment: "warn" as const },
  { icon: Rocket,   label: "Deploy Frequency",      value: "3.1/wk",subtitle: "Merged PRs per week over 30d",              sentiment: "good" as const },
]

function DemoKPICards() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {mockKpis.map((kpi) => {
        const Icon = kpi.icon
        const iconClass =
          kpi.sentiment === "good"
            ? "bg-emerald-900/30 text-emerald-400"
            : "bg-amber-900/30 text-amber-400"
        return (
          <div key={kpi.label} className="p-4 rounded-xl bg-[#0F0F12] border border-white/8">
            <div className={cn("inline-flex p-2 rounded-lg mb-3", iconClass)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-400 truncate">{kpi.label}</p>
            <p className="text-2xl font-semibold text-white mt-1">{kpi.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{kpi.subtitle}</p>
          </div>
        )
      })}
    </div>
  )
}

// ── 2: Cycle Time & Review Latency Trend Chart ────────────────────────────────
const mockTrendData = [
  { week: "Jun 9",  avgCycleTime: 32.1, avgReviewLatency: 9.4  },
  { week: "Jun 16", avgCycleTime: 28.5, avgReviewLatency: 7.8  },
  { week: "Jun 23", avgCycleTime: 24.0, avgReviewLatency: 6.2  },
  { week: "Jun 30", avgCycleTime: 21.3, avgReviewLatency: 5.5  },
  { week: "Jul 7",  avgCycleTime: 19.8, avgReviewLatency: 4.9  },
  { week: "Jul 14", avgCycleTime: 18.4, avgReviewLatency: 4.2  },
]

function DemoCycleChart() {
  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/8 p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-white">Cycle Time &amp; Review Latency Trends</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={mockTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `${v}h`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={35} />
          <RechartTooltip
            contentStyle={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
          />
          <Legend iconType="plainline" iconSize={12} wrapperStyle={{ fontSize: "11px", paddingTop: "8px", color: "#9ca3af" }} />
          <Line type="monotone" dataKey="avgCycleTime" name="Avg Cycle Time" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="avgReviewLatency" name="Time to First Review" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 3: Contributor Activity (bars + table) ────────────────────────────────────
const mockContributors = [
  { name: "sarah-k",    avatar: "S", opened: 12, reviewed: 18, cycle: "14.2h", activity: 30 },
  { name: "jdoe",       avatar: "J", opened: 9,  reviewed: 11, cycle: "22.1h", activity: 20 },
  { name: "alex-m",     avatar: "A", opened: 7,  reviewed: 8,  cycle: "19.8h", activity: 15 },
  { name: "priya-s",    avatar: "P", opened: 5,  reviewed: 6,  cycle: "31.0h", activity: 11 },
  { name: "marco-b",    avatar: "M", opened: 3,  reviewed: 4,  cycle: "28.5h", activity: 7  },
]
const maxActivity = 30

function DemoContributorBars() {
  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/8 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-white">Contributor Activity</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {mockContributors.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-100 truncate">@{c.name}</span>
                  <span className="text-xs text-gray-400">{c.activity}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-100 rounded-full" style={{ width: `${(c.activity / maxActivity) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-500">
                <th className="font-medium pb-2">Contributor</th>
                <th className="font-medium pb-2 text-right">Opened</th>
                <th className="font-medium pb-2 text-right">Reviewed</th>
                <th className="font-medium pb-2 text-right">Avg Cycle</th>
              </tr>
            </thead>
            <tbody>
              {mockContributors.map((c) => (
                <tr key={c.name} className="border-t border-zinc-800">
                  <td className="py-2 text-xs text-gray-100">@{c.name}</td>
                  <td className="py-2 text-right text-xs text-gray-300">{c.opened}</td>
                  <td className="py-2 text-right text-xs text-gray-300">{c.reviewed}</td>
                  <td className="py-2 text-right text-xs text-gray-300">{c.cycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── 4: PR Timeline bars ────────────────────────────────────────────────────────
const mockPRs = [
  { number: 247, title: "feat: add webhook retry logic",       author: "sarah-k", state: "merged" as const, waiting: 15, review: 28, merge: 4 },
  { number: 251, title: "fix: resolve race condition in sync", author: "jdoe",    state: "merged" as const, waiting: 6,  review: 12, merge: 2 },
  { number: 255, title: "chore: upgrade Gemini SDK",           author: "alex-m",  state: "open"   as const, waiting: 39, review: 0,  merge: 0 },
  { number: 258, title: "feat: bottleneck score chart",        author: "priya-s", state: "merged" as const, waiting: 3,  review: 8,  merge: 1 },
]
const stateDot: Record<string, string> = {
  open: "bg-violet-500",
  merged: "bg-zinc-500",
  closed: "bg-red-500",
}

function DemoPRTimeline() {
  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/8 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
        <GitPullRequest className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-white">PR Timeline</span>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-300/60 inline-block" /> Waiting</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" /> In Review</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" /> Ready/Merge</span>
        </div>
      </div>
      <div className="divide-y divide-white/6">
        {mockPRs.map((pr) => {
          const total = pr.waiting + pr.review + pr.merge || 1
          const wPct = (pr.waiting / total) * 100
          const rPct = (pr.review  / total) * 100
          const mPct = (pr.merge   / total) * 100
          return (
            <div key={pr.number} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", stateDot[pr.state])} />
                <span className="text-xs font-medium text-gray-100 truncate flex-1">{pr.title}</span>
                <span className="text-[11px] text-gray-500 flex-shrink-0">#{pr.number}</span>
                <span className="text-[11px] text-gray-500 flex-shrink-0">@{pr.author}</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {wPct > 0 && <div className="bg-violet-300/60 rounded-full" style={{ width: `${wPct}%` }} />}
                {rPct > 0 && <div className="bg-violet-500 rounded-full" style={{ width: `${rPct}%` }} />}
                {mPct > 0 && <div className="bg-indigo-600 rounded-full" style={{ width: `${mPct}%` }} />}
                {pr.state === "open" && <div className="flex-1 bg-violet-300/20 rounded-full" />}
              </div>
              <div className="flex gap-4 mt-1 text-[10px] text-gray-500">
                {pr.waiting > 0 && <span>{pr.waiting}h waiting</span>}
                {pr.review  > 0 && <span>{pr.review}h in review</span>}
                {pr.merge   > 0 && <span>{pr.merge}h merge</span>}
                {pr.state === "open" && <span className="text-violet-400">still open</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 5: Contributors Table ──────────────────────────────────────────────────────
const mockContribRows = [
  { name: "sarah-k",  avatar: "S", opened: 12, reviewed: 18, cycle: "14.2h", bottleneck: null },
  { name: "jdoe",     avatar: "J", opened: 9,  reviewed: 4,  cycle: "22.1h", bottleneck: "review" },
  { name: "alex-m",   avatar: "A", opened: 7,  reviewed: 8,  cycle: "19.8h", bottleneck: null },
  { name: "marco-b",  avatar: "M", opened: 6,  reviewed: 2,  cycle: "68.0h", bottleneck: "merge" },
]

function DemoContribTable() {
  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/8 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            {["Contributor", "PRs Opened", "PRs Reviewed", "Avg Cycle", "Status"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/6">
          {mockContribRows.map((c) => (
            <tr key={c.name} className={cn("transition-colors", c.bottleneck ? "bg-amber-500/[0.03]" : "")}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[11px] font-bold flex-shrink-0">{c.avatar}</div>
                  <span className="text-xs font-medium text-gray-100">@{c.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-gray-300">{c.opened}</td>
              <td className="px-4 py-3 text-xs text-gray-300">{c.reviewed}</td>
              <td className="px-4 py-3 text-xs text-gray-300">{c.cycle}</td>
              <td className="px-4 py-3">
                {c.bottleneck === "review" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/30 text-amber-400">Review bottleneck</span>
                )}
                {c.bottleneck === "merge" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-900/30 text-red-400">Merge bottleneck</span>
                )}
                {!c.bottleneck && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/30 text-emerald-400">Healthy</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 6: Bottleneck Score ring ───────────────────────────────────────────────────
function DemoBottleneck() {
  const score = 42
  const r = 30
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/8 p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-white">Bottleneck Score</span>
      </div>
      <div className="flex items-center gap-6">
        <svg className="w-20 h-20 -rotate-90 flex-shrink-0" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} strokeWidth="7" className="stroke-zinc-800" fill="none" />
          <circle cx="40" cy="40" r={r} strokeWidth="7" fill="none" className="stroke-amber-400"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div>
          <p className="text-3xl font-bold text-amber-400 tabular-nums">{score}.0%</p>
          <p className="text-xs text-gray-400 mt-1">Moderate — some PRs need attention</p>
          <p className="text-[11px] text-gray-500 mt-2">6 open PRs · 3 unreviewed</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Review Coverage</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-indigo-900/20 p-3">
            <p className="text-lg font-bold text-indigo-400 tabular-nums">14</p>
            <p className="text-[11px] text-indigo-400/80 mt-0.5">Assigned reviews</p>
            <p className="text-[10px] text-gray-500 mt-0.5">via CODEOWNERS / manual</p>
          </div>
          <div className="rounded-lg bg-teal-900/20 p-3">
            <p className="text-lg font-bold text-teal-400 tabular-nums">9</p>
            <p className="text-[11px] text-teal-400/80 mt-0.5">Proactive reviews</p>
            <p className="text-[10px] text-gray-500 mt-0.5">no assignment needed</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 7: AI Digest card ─────────────────────────────────────────────────────────
const mockDigestText = `This week your team merged 11 pull requests with an average cycle time of 18.4 hours — a 22% improvement over the previous period. Three PRs spent over 48 hours waiting for review, with #255 currently sitting open for 39 hours.

@sarah-k led review activity with 18 submissions this month, while @marco-b's PRs are averaging 68 hours to merge — worth a quick check-in on branch scope. No severe review bottlenecks detected this cycle.`

function DemoDigestCard() {
  const [expanded, setExpanded] = useState(true)
  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/8 overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">Jun 30 – Jul 7, 2025</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-900/30 text-blue-400">
              <Sparkles className="w-2.5 h-2.5" /> Weekly Summary
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Generated 2h ago</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-400 hover:bg-white/5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/8 pt-4 text-sm leading-relaxed text-gray-300 whitespace-pre-line">
          {mockDigestText}
        </div>
      )}
    </div>
  )
}

// ── 8: Sync Log rows ──────────────────────────────────────────────────────────
const mockLogs = [
  { status: "completed", trigger: "manual",    prs: 47, reviews: 112, commits: 203, duration: "18s",  started: "Jul 7, 2025, 09:14 AM", error: null },
  { status: "running",   trigger: "webhook",   prs: 0,  reviews: 0,   commits: 0,   duration: "—",    started: "Jul 7, 2025, 11:32 AM", error: null },
  { status: "failed",    trigger: "scheduled", prs: 0,  reviews: 0,   commits: 0,   duration: "3s",   started: "Jul 6, 2025, 08:00 AM", error: "GitHub rate limit exceeded. Retry in 60 s." },
]

const syncStatusCfg = {
  completed: { label: "Completed", iconClass: "text-emerald-400", badgeClass: "bg-emerald-900/30 text-emerald-400" },
  running:   { label: "Running",   iconClass: "text-blue-400 animate-spin", badgeClass: "bg-blue-900/30 text-blue-400" },
  failed:    { label: "Failed",    iconClass: "text-red-400",     badgeClass: "bg-red-900/30 text-red-400" },
}
const triggerLabel: Record<string, string> = { manual: "Manual", webhook: "Webhook", scheduled: "Scheduled" }

function DemoSyncLogs() {
  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/8 divide-y divide-white/6 overflow-hidden">
      {mockLogs.map((log, i) => {
        const cfg = syncStatusCfg[log.status as keyof typeof syncStatusCfg]
        const StatusIcon = log.status === "completed" ? CheckCircle2 : log.status === "running" ? Loader2 : AlertTriangle
        return (
          <div key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 flex-shrink-0", cfg.iconClass)}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.badgeClass)}>{cfg.label}</span>
                  <span className="text-[11px] text-gray-500">{log.started}</span>
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded bg-white/5 text-gray-400">{triggerLabel[log.trigger]}</span>
                </div>
                {log.status !== "running" && !log.error && (
                  <div className="flex gap-4 mt-2 text-[11px] text-gray-400">
                    <span>{log.prs} PRs</span>
                    <span>{log.reviews} reviews</span>
                    <span>{log.commits} commits</span>
                    <span>{log.duration}</span>
                  </div>
                )}
                {log.error && (
                  <p className="mt-2 text-[11px] text-red-400 bg-red-900/10 rounded px-2 py-1">{log.error}</p>
                )}
                {log.status === "running" && (
                  <p className="mt-2 text-[11px] text-blue-400">Fetching PR and review data from GitHub…</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Documentation() {
  const [activeSection, setActiveSection] = useState<string>("what-is-veltro")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Intersection observer to track active section
  useEffect(() => {
    const allIds = sections.flatMap((s) => [s.id, ...s.items.map((i) => i.id)])
    const observers: IntersectionObserver[] = []

    allIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
    setActiveSection(id)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 border-b border-white/8 bg-[#0a0a0f]/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-white/60"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
        <div className="flex items-end gap-2">
          <img src="/veltro-logo-dark-bg.svg" alt="Veltro" className="h-7 mb-0.5 w-auto" />
          <span className="text-white/40 text-md mt-2 hidden sm:inline">Documentation</span>
        </div>
        <div className="w-[120px] hidden sm:block" />
      </header>

      <div className="flex">
        {/* Sidebar Overlay (Mobile) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={cn(
            "fixed top-14 bottom-0 left-0 z-40 w-64 bg-[#0d0d13] border-r border-white/8 overflow-y-auto",
            "lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] transition-transform duration-300",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <nav className="p-4 space-y-6">
            {sections.map((section) => {
              const SectionIcon = section.icon
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(section.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors mb-1",
                      activeSection === section.id
                        ? "text-indigo-400"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    <SectionIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    {section.label}
                  </button>
                  <div className="space-y-0.5 ml-2 pl-3 border-l border-white/6">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className={cn(
                          "block w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                          activeSection === item.id
                            ? "text-white bg-indigo-500/10"
                            : "text-white/50 hover:text-white hover:bg-white/4"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 py-10 lg:px-12 xl:px-16 max-w-4xl">

          {/* ── Getting Started ── */}
          <Section id="getting-started" title="Getting Started">

            <SubSection id="what-is-veltro" title="What is Veltro?">
              <p className="text-white/60 leading-relaxed mb-4">
                Veltro is an engineering team health dashboard. It connects directly to your GitHub repositories and turns pull request activity into clear, measurable metrics — without any manual reporting.
              </p>
              <p className="text-white/60 leading-relaxed mb-6">
                Instead of guessing how fast your team ships, how long PRs sit waiting for review, or who is currently a bottleneck, Veltro calculates these from your actual GitHub data and presents them in a visual dashboard. An AI digest powered by Google Gemini writes a plain-English summary of your team's health every week.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Clock, color: "bg-indigo-500/15 text-indigo-300", title: "Cycle Time", desc: "How long PRs take from open to merge" },
                  { icon: Eye, color: "bg-blue-500/15 text-blue-300", title: "Review Latency", desc: "Time between PR creation and first review" },
                  { icon: AlertTriangle, color: "bg-amber-500/15 text-amber-300", title: "Bottlenecks", desc: "Reviewers with too many pending PRs" },
                  { icon: Sparkles, color: "bg-purple-500/15 text-purple-300", title: "AI Digest", desc: "Weekly Gemini-generated team summary" },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <div className={cn("p-2 rounded-lg flex-shrink-0", f.color)}>
                      <f.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{f.title}</p>
                      <p className="text-xs text-white/50 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection id="connecting-github" title="Connecting GitHub">
              <p className="text-white/60 leading-relaxed mb-6">
                Veltro uses a <strong className="text-white font-medium">GitHub App</strong> for authorization — not OAuth. This means you authorize the app once and explicitly choose which repositories it can access. No blanket access to your entire GitHub account.
              </p>
              <div className="relative">
                <Step n={1} title="Click Sign In with GitHub">
                  On the login page, click the <strong className="text-white">Connect with GitHub</strong> button. You will be redirected to GitHub's authorization screen.
                </Step>
                <Step n={2} title="Install the Veltro App">
                  GitHub shows you the App installation screen. Choose whether to install on your personal account or an organization. You can select specific repositories here.
                </Step>
                <Step n={3} title="Authorize access">
                  After selecting repositories, authorize Veltro to read PR data. GitHub redirects you back with a code and installation ID.
                </Step>
                <Step n={4} title="Land on your dashboard">
                  Veltro exchanges the code for tokens, creates your account, and you are dropped directly into your dashboard. No email, no password needed.
                </Step>
              </div>
              <Callout type="security">
                <strong className="text-white">GitHub App scopes are read-only.</strong> Veltro requests only <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">pull_requests: read</code>, <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">metadata: read</code>, and <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">members: read</code>. Veltro cannot create, edit, or close any resource on your behalf.
              </Callout>
            </SubSection>

            <SubSection id="selecting-repos" title="Selecting Repositories">
              <p className="text-white/60 leading-relaxed mb-4">
                After connecting GitHub, your authorized repositories appear in the left sidebar under <strong className="text-white">Repositories</strong>. Clicking a repository makes it the active context — all metrics on the dashboard will reflect that repository.
              </p>
              <Callout type="info">
                A repository with a grey activity icon has not been synced yet. Click <strong className="text-white">Sync</strong> on the Overview page to pull its PR data for the first time. This usually takes 15–60 seconds depending on repository size.
              </Callout>
            </SubSection>

            <SubSection id="first-sync" title="Running Your First Sync">
              <p className="text-white/60 leading-relaxed mb-4">
                On the Overview dashboard, click the <strong className="text-white">Sync Repository</strong> button in the top-right area. The sidebar will show a spinning indicator next to the repository name while the sync is running.
              </p>
              <p className="text-white/60 leading-relaxed">
                Syncing fetches all pull requests, reviews, commits, and contributor data from GitHub using your installation token. It runs in the background — you can keep using the dashboard while it runs. After completion, all metrics update automatically.
              </p>
            </SubSection>
          </Section>

          {/* ── Dashboard ── */}
          <Section id="dashboard" title="Dashboard Metrics">

            <SubSection id="overview-metrics" title="Overview Metrics">
              <p className="text-white/60 leading-relaxed mb-6">
                The Overview page displays <strong className="text-white">four headline metric cards</strong> and <strong className="text-white">four visualization panels</strong>. Every metric is calculated from raw PR timestamps in the database, scoped to your selected date range (7d, 30d, or 90d).
              </p>
              <PreviewFrame>
                <DemoKPICards />
              </PreviewFrame>
            </SubSection>

            <SubSection id="cycle-time" title="Cycle Time">
              <p className="text-white/60 leading-relaxed mb-4">
                <strong className="text-white">Average PR Cycle Time</strong> measures how long it takes from when a pull request is opened to when it is merged. This is the single most important velocity signal for engineering teams.
              </p>
              <MetricCard
                icon={Clock}
                label="Average Cycle Time"
                formula="AVG(merged_at − opened_at) across merged PRs in date range"
                color="bg-indigo-500/15 text-indigo-300"
              />
              <div className="mt-4 space-y-2 text-sm text-white/60">
                <p><strong className="text-white">What's healthy?</strong> Most high-performing teams target under 24 hours. Over 72 hours often indicates review process problems.</p>
                <p>Only <Badge variant="green">merged</Badge> pull requests are included. Open and closed-without-merge PRs are excluded.</p>
              </div>
            </SubSection>

            <SubSection id="review-latency" title="Time to First Review">
              <p className="text-white/60 leading-relaxed mb-4">
                <strong className="text-white">Average Time to First Review</strong> measures the gap between when a PR is opened and when it receives its first code review. Long review latency means PRs sit idle waiting for someone to look at them.
              </p>
              <MetricCard
                icon={Eye}
                label="Time to First Review"
                formula="AVG(first_review_at − opened_at) across PRs with at least one review"
                color="bg-blue-500/15 text-blue-300"
              />
              <Callout type="tip">
                If cycle time is low but review latency is high, your team reviews quickly once they start — but PRs wait too long before anyone picks them up. This suggests a workload or prioritization issue rather than a review quality issue.
              </Callout>
            </SubSection>

            <SubSection id="open-prs" title="Avg Open PR Age">
              <p className="text-white/60 leading-relaxed mb-4">
                The <strong className="text-white">Avg Open PR Age</strong> card shows the average time currently open pull requests have been waiting — from when they were opened to now. It is a leading indicator of accumulated review debt.
              </p>
              <MetricCard
                icon={Timer}
                label="Avg Open PR Age"
                formula="AVG(NOW() − opened_at) across all currently open PRs"
                color="bg-amber-500/15 text-amber-300"
              />
              <div className="mt-4 text-sm text-white/60 space-y-2">
                <p><strong className="text-white">What's healthy?</strong> Under 48 hours is considered good. Over 48 hours signals PRs are sitting idle and may need prioritisation.</p>
                <p>Only <Badge variant="indigo">open</Badge> pull requests are included. Merged and closed PRs are excluded from this calculation.</p>
              </div>
            </SubSection>

            <SubSection id="deploy-frequency" title="Deploy Frequency">
              <p className="text-white/60 leading-relaxed mb-4">
                <strong className="text-white">Deploy Frequency</strong> is a throughput proxy — it shows the average number of pull requests merged per week over your selected date range. It is displayed as <Badge>N.N/wk</Badge>.
              </p>
              <MetricCard
                icon={GitMerge}
                label="Deploy Frequency"
                formula="COUNT(merged PRs in date range) ÷ (date range in days ÷ 7)"
                color="bg-emerald-500/15 text-emerald-300"
              />
              <div className="mt-4 text-sm text-white/60">
                <p><strong className="text-white">What's healthy?</strong> Two or more merges per week is considered a good cadence for most teams. The metric respects the 7d, 30d, and 90d selectors — all three windows are calculated as a weekly rate.</p>
              </div>
            </SubSection>

            <SubSection id="trend-chart" title="Cycle Time & Review Latency Trend Chart">
              <p className="text-white/60 leading-relaxed mb-4">
                The trend chart plots two weekly averages over your selected date range, overlaid as separate lines:
              </p>
              <div className="flex flex-col gap-3 my-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-4 h-0.5 bg-violet-500 flex-shrink-0 rounded-full" />
                  <span className="text-white font-medium">Avg Cycle Time</span>
                  <span className="text-white/55">— mean open-to-merge time for PRs merged that week</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-4 h-0.5 bg-blue-500 flex-shrink-0 rounded-full" />
                  <span className="text-white font-medium">Time to First Review</span>
                  <span className="text-white/55">— mean time from PR open to first reviewer activity that week</span>
                </div>
              </div>
              <p className="text-white/60 leading-relaxed">
                Use the <Badge>7d</Badge>, <Badge>30d</Badge>, <Badge>90d</Badge> date selectors at the top of the dashboard to change the visible window. Both lines and all metric cards update simultaneously.
              </p>
              <PreviewFrame>
                <DemoCycleChart />
              </PreviewFrame>
            </SubSection>

            <SubSection id="contributor-rings" title="Contributor Activity">
              <p className="text-white/60 leading-relaxed mb-4">
                The Contributor Activity panel shows the <strong className="text-white">top 5 contributors</strong> by combined PR authorship and review activity for the selected date range. It is split into two parts:
              </p>
              <div className="space-y-3 my-4">
                {[
                  { label: "Activity Bars", desc: "Horizontal bars ranked by total activity (PRs opened + PRs reviewed). The longest bar is the most active contributor in the period." },
                  { label: "Summary Table", desc: "Columns show PRs Opened, PRs Reviewed, and Avg Cycle Time for each contributor. Useful for spotting contributors who review heavily but author little, or vice versa." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{item.label}</p>
                      <p className="text-sm text-white/55">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <PreviewFrame>
                <DemoContributorBars />
              </PreviewFrame>
            </SubSection>
          </Section>

          {/* ── PR Timeline ── */}
          <Section id="pr-timeline" title="PR Timeline">

            <SubSection id="timeline-overview" title="How to Read the Timeline">
              <p className="text-white/60 leading-relaxed mb-4">
                The PR Timeline presents a Gantt-style view of each pull request's lifecycle. Each row is one PR, and the horizontal bar shows how time was spent at each stage of the review process.
              </p>
              <p className="text-white/60 leading-relaxed">
                The timeline is sorted by PR age — oldest at the top. You can click any PR row to expand details showing the PR title, author, and direct link to GitHub.
              </p>
            </SubSection>

            <SubSection id="timeline-segments" title="Lifecycle Segments">
              <p className="text-white/60 leading-relaxed mb-6">Each PR bar is divided into three colored segments:</p>
              <div className="space-y-4">
                {[
                  {
                    color: "bg-violet-300 dark:bg-violet-900/60",
                    label: "Waiting for Review",
                    formula: "first_review_at − opened_at",
                    desc: "Time the PR sat open before anyone submitted a review. This is where review latency lives.",
                  },
                  {
                    color: "bg-violet-500",
                    label: "In Review",
                    formula: "last_review_event_at − first_review_at",
                    desc: "Time between the first review submission and the end of review activity. This includes back-and-forth, change requests, and re-reviews.",
                  },
                  {
                    color: "bg-indigo-600",
                    label: "Ready / Merge",
                    formula: "merged_at − end_of_review",
                    desc: "Tail period between the end of review activity and the actual merge commit. Typically short — minutes to a few hours.",
                  },
                ].map((s) => (
                  <div key={s.label} className="flex gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <div className={cn("w-1 rounded-full flex-shrink-0", s.color)} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("w-3 h-3 rounded-sm flex-shrink-0", s.color)} />
                        <span className="text-sm font-semibold text-white">{s.label}</span>
                        <code className="text-xs text-white/30 font-mono">{s.formula}</code>
                      </div>
                      <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Callout type="info">
                PRs that are still open show an extended <strong className="text-white">Waiting</strong> segment stretching to <code className="text-xs bg-white/8 px-1.5 py-0.5 rounded">NOW()</code>. Closed-without-merge PRs are excluded from the timeline.
              </Callout>
              <PreviewFrame>
                <DemoPRTimeline />
              </PreviewFrame>
            </SubSection>
          </Section>

          {/* ── Contributors ── */}
          <Section id="contributors" title="Contributors">

            <SubSection id="contributors-table" title="Contributors Table">
              <p className="text-white/60 leading-relaxed mb-4">
                The Contributors table lists every GitHub user who has authored, committed, or reviewed pull requests in the active repository. The table is sortable by any column header.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-white/8 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/[0.03]">
                      {["Column", "Description"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {[
                      ["PRs Authored", "Total PRs opened by this contributor"],
                      ["PRs Reviewed", "Total review submissions (any verdict)"],
                      ["Avg Cycle Time", "Average time to merge for their PRs"],
                      ["Pending Reviews", "Active review requests not yet submitted"],
                      ["Bottleneck Flag", "Shown if 3+ pending reviews older than 48 hours"],
                    ].map(([col, desc]) => (
                      <tr key={col} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{col}</td>
                        <td className="px-4 py-3 text-white/55">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PreviewFrame>
                <DemoContribTable />
              </PreviewFrame>
            </SubSection>

            <SubSection id="bottleneck-detection" title="Bottleneck Detection">
              <p className="text-white/60 leading-relaxed mb-4">
                Veltro automatically flags contributors under two distinct rules. Expand any contributor row to see the exact reason:
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/70">
                    <strong className="text-red-300">Merge bottleneck</strong> — the contributor's own PRs have an average cycle time over <strong className="text-red-300">60 hours</strong> and they opened more than <strong className="text-red-300">5 PRs</strong> in the period. Their work is landing slowly.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/70">
                    <strong className="text-amber-300">Review bottleneck</strong> — the contributor had <strong className="text-amber-300">3 or more formal review assignments</strong> (via CODEOWNERS or manual request) but completed fewer than <strong className="text-amber-300">50%</strong> of them. Unreviewed assignments block other contributors.
                  </div>
                </div>
              </div>
              <p className="text-white/60 leading-relaxed">
                Contributors who only open PRs and are never assigned as reviewers are never flagged — they can't review their own work and may simply not be in a review rotation.
              </p>
              <PreviewFrame>
                <DemoBottleneck />
              </PreviewFrame>
            </SubSection>

            <SubSection id="ai-bottleneck" title="AI Bottleneck Explanation">
              <p className="text-white/60 leading-relaxed mb-4">
                For each flagged bottleneck contributor, you can request an <strong className="text-white">AI Explanation</strong> — a per-contributor analysis written by Google Gemini explaining:
              </p>
              <ul className="space-y-2 text-sm text-white/60 mb-4">
                {[
                  "Which specific PRs are waiting on this reviewer",
                  "How long each request has been outstanding",
                  "Context about their review load relative to the team",
                  "Suggested actions for the team lead",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Callout type="tip">
                Bottleneck explanations are always generated fresh — they are not cached. Each click requests a new Gemini response so the context is current.
              </Callout>
            </SubSection>
          </Section>

          {/* ── AI Digests ── */}
          <Section id="ai-digests" title="AI Digests">

            <SubSection id="what-are-digests" title="What Are Digests?">
              <p className="text-white/60 leading-relaxed mb-4">
                AI Digests are plain-English weekly summaries of your repository's engineering health, generated by <strong className="text-white">Google Gemini</strong>. Instead of reading metrics, you read a paragraph:
              </p>
              <div className="p-5 rounded-xl border border-white/8 bg-white/[0.02] text-sm text-white/60 leading-relaxed italic my-6">
                "This week your team merged 14 pull requests with an average cycle time of 18 hours — a 22% improvement over last week. Three PRs spent over 72 hours waiting for review. @username had the highest review load with 8 submissions, while @username2 authored 5 of the 6 largest diffs. No major bottlenecks detected."
              </div>
              <p className="text-white/60 leading-relaxed">
                Digests are generated automatically every Monday at 08:00 UTC via a GitHub Actions cron job. You can also request a fresh digest manually at any time using the <strong className="text-white">Regenerate</strong> button.
              </p>
              <PreviewFrame label="Live Preview — AI Digest">
                <DemoDigestCard />
              </PreviewFrame>
            </SubSection>

            <SubSection id="gemini-key" title="Setting Up Your Gemini API Key">
              <p className="text-white/60 leading-relaxed mb-6">
                Veltro supports two modes for AI features:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-indigo-300" />
                    <span className="text-sm font-semibold text-white">System Key (Default)</span>
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed">Works immediately after sign-up. Shared rate limit across all users. Best for low-volume teams getting started.</p>
                </div>
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4 text-indigo-300" />
                    <span className="text-sm font-semibold text-white">Your Own Key <Badge variant="indigo">Recommended</Badge></span>
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed">Dedicated rate limits. Gemini free tier provides 1,500 requests/day with no credit card. Best for active teams.</p>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-white mb-4">How to add your Gemini API key</h4>
              <div className="relative">
                <Step n={1} title="Get your key from Google AI Studio">
                  Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">aistudio.google.com/app/apikey</a>. Sign in with your Google account and click <strong className="text-white">Create API Key</strong>. Copy the key — it starts with <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">AIza...</code>
                </Step>
                <Step n={2} title="Open Settings in your dashboard">
                  Click <strong className="text-white">Settings</strong> in the bottom of the left sidebar.
                </Step>
                <Step n={3} title="Paste your key and save">
                  In the <strong className="text-white">AI Configuration</strong> section, paste your key into the input field and click <strong className="text-white">Save API Key</strong>. The field will confirm it is set without showing the value.
                </Step>
              </div>
              <Callout type="security">
                Your Gemini API key is encrypted with <strong className="text-white">Fernet symmetric encryption</strong> before being stored in the database. The key value is never returned to the frontend after saving — Veltro only confirms whether a key is set via a boolean flag (<code className="text-xs bg-white/10 px-1 rounded">gemini_api_key_set: true</code>).
              </Callout>
            </SubSection>

            <SubSection id="digest-cache" title="Cache & Staleness">
              <p className="text-white/60 leading-relaxed mb-4">
                Digests are cached for <strong className="text-white">24 hours</strong> to avoid repeated Gemini API calls. A cached digest is returned instantly when you open the AI Digests page.
              </p>
              <p className="text-white/60 leading-relaxed mb-4">
                A digest is automatically marked <Badge variant="amber">Stale</Badge> when GitHub sends Veltro a webhook event indicating significant activity — a PR is opened or merged, or a review is submitted. The next digest request after that will generate a fresh summary.
              </p>
              <p className="text-white/60 leading-relaxed">
                You can always bypass the cache by clicking <strong className="text-white">Regenerate Digest</strong>. This forces a fresh Gemini API call regardless of cache state.
              </p>
            </SubSection>

            <SubSection id="digest-history" title="Digest History">
              <p className="text-white/60 leading-relaxed">
                Every generated digest is saved automatically. Below the current digest, click the <strong className="text-white">View digest history</strong> toggle button to expand an inline list of all previous digests, ordered newest first. Each entry shows its generation timestamp, period coverage (e.g. "Jun 30 – Jul 7"), and the full generated text.
              </p>
            </SubSection>
          </Section>

          {/* ── Sync History ── */}
          <Section id="sync-history" title="Sync History">

            <SubSection id="sync-logs" title="Reading Sync Logs">
              <p className="text-white/60 leading-relaxed mb-4">
                The Sync History page shows a complete log of every synchronization attempt for the active repository.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-white/8 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/[0.03]">
                      {["Field", "Description"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {[
                      ["Status", "completed, running, or failed"],
                      ["Triggered By", "manual (you clicked Sync), webhook (GitHub event), or scheduled"],
                      ["PRs Fetched", "Number of pull request records inserted or updated"],
                      ["Reviews Fetched", "Number of review records inserted or updated"],
                      ["Commits Fetched", "Number of commit records inserted or updated"],
                      ["Duration", "Total time from start to completion"],
                      ["Error", "Stack trace shown if status is failed"],
                    ].map(([field, desc]) => (
                      <tr key={field} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{field}</td>
                        <td className="px-4 py-3 text-white/55">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>
              <PreviewFrame>
                <DemoSyncLogs />
              </PreviewFrame>

            <SubSection id="sync-triggers" title="What Triggers a Sync">
              <p className="text-white/60 leading-relaxed mb-4">Repository data is kept current through two complementary mechanisms:</p>
              <div className="space-y-3">
                {[
                  { icon: RefreshCw, label: "Manual Sync", badge: "manual", desc: "Triggered when you click the Sync button on the Overview page. Runs a full paginated fetch of all PRs, reviews, and commits." },
                  { icon: Zap, label: "GitHub Webhooks", badge: "webhook", desc: "GitHub POSTs an event to Veltro in real-time when a PR is opened, merged, closed, or a review is submitted. Webhook ingestion is immediate and targeted." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-300 flex-shrink-0">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-white">{item.label}</span>
                        <Badge>{item.badge}</Badge>
                      </div>
                      <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          {/* ── Security ── */}
          <Section id="security" title="Security">

            <SubSection id="token-storage" title="Token Storage & Authentication">
              <p className="text-white/60 leading-relaxed mb-6">
                Veltro is designed so that authentication credentials never touch JavaScript-accessible memory.
              </p>
              <div className="space-y-4">
                {[
                  { title: "JWT Access Token", desc: "Short-lived (30 minutes). Stored in an HTTP-only, Secure, SameSite=Lax cookie. Invisible to the browser's JavaScript environment." },
                  { title: "JWT Refresh Token", desc: "Long-lived (7 days). Also stored as an HTTP-only cookie. Used to silently issue a new access token without requiring re-login." },
                  { title: "Token Revocation", desc: "Every JWT includes a unique jti (JWT ID) UUID. Logout writes this jti to a database blocklist. Every API request checks the blocklist. Tokens are immediately dead on logout." },
                  { title: "GitHub OAuth Token", desc: "Encrypted with Fernet symmetric encryption before being written to the database. Decrypted only at the moment it's needed (e.g. to call GitHub's API)." },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-emerald-400" />{item.title}</p>
                    <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection id="github-scopes" title="GitHub Permissions Requested">
              <p className="text-white/60 leading-relaxed mb-4">
                Veltro requests the minimum permissions required to calculate metrics. All scopes are read-only.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-white/8 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/[0.03]">
                      {["Permission", "Access Level", "Used For"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {[
                      ["Pull Requests", "Read-only", "Fetching PR data, reviews, lifecycle timestamps"],
                      ["Repository Metadata", "Read-only", "Repository names, branch names, commit hashes"],
                      ["Organization Members", "Read-only", "Contributor identities and public avatars"],
                    ].map(([perm, level, use]) => (
                      <tr key={perm} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{perm}</td>
                        <td className="px-4 py-3"><Badge variant="green">{level}</Badge></td>
                        <td className="px-4 py-3 text-white/55">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection id="data-isolation" title="Data Isolation">
              <p className="text-white/60 leading-relaxed mb-4">
                Every piece of data in Veltro traces back to the authenticated user through a foreign key chain enforced at the database level:
              </p>
              <div className="flex items-center flex-wrap gap-2 my-6 text-sm font-mono">
                {["users", "repositories", "pull_requests", "reviews / commits"].map((t, i, arr) => (
                  <>
                    <span key={t+i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">{t}</span>
                    {i < arr.length - 1 && <ChevronRight key={`arrow-${i}`} className="h-4 w-4 text-white/20" />}
                  </>
                ))}
              </div>
              <p className="text-white/60 leading-relaxed">
                All analytics endpoints verify that the <code className="text-xs bg-white/8 px-1.5 py-0.5 rounded">repository_id</code> in the request belongs to the authenticated user before executing any query. It is structurally impossible for one user to read another user's data.
              </p>
            </SubSection>

            <SubSection id="encryption" title="Encryption">
              <p className="text-white/60 leading-relaxed mb-4">
                Sensitive fields stored in PostgreSQL are encrypted using <strong className="text-white">Fernet symmetric encryption</strong> (AES-128 in CBC mode with HMAC-SHA256 authentication). The encryption key is stored as the <code className="text-xs bg-white/8 px-1.5 py-0.5 rounded">ENCRYPTION_KEY</code> environment variable on the server and never transmitted to the client.
              </p>
              <p className="text-white/60 leading-relaxed">
                Fields encrypted at rest: <Badge>github_token</Badge> <Badge>gemini_api_key</Badge>
              </p>
            </SubSection>
          </Section>

          {/* ── Settings ── */}
          <Section id="settings" title="Settings">

            <SubSection id="api-key-settings" title="Gemini API Key">
              <p className="text-white/60 leading-relaxed mb-4">
                The Settings page has an <strong className="text-white">AI Configuration</strong> panel where you can save or replace your Gemini API key.
              </p>
              <Callout type="security">
                <strong className="text-white">Write-only by design.</strong> Once saved, your API key cannot be read back. The UI shows only <strong className="text-white">API key is set ✓</strong> or <strong className="text-white">No API key configured</strong>. To change your key, simply paste a new one and save — it will replace the previous encrypted value.
              </Callout>
            </SubSection>

            <SubSection id="preferences" title="Dashboard Preferences">
              <p className="text-white/60 leading-relaxed mb-4">
                From the Settings page you can configure:
              </p>
              <div className="space-y-3 mb-4">
                {[
                  { label: "Default Repository", desc: "The repository that is automatically selected when you open the dashboard." },
                  { label: "Default Analysis Period", desc: "Sets the rolling date window (7 Days, 30 Days, or 90 Days) that loads by default on the dashboard." },
                  { label: "Expand Digest Panel", desc: "When enabled, the AI digest section is always shown expanded when the page loads. Toggle it off to collapse it by default." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{item.label}</p>
                      <p className="text-sm text-white/55">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Callout type="tip">
                All preferences — including the Gemini API Key field — are saved together when you click <strong className="text-white">Save Settings</strong> at the bottom of the form.
              </Callout>
            </SubSection>
          </Section>

          {/* Footer */}
          <footer className="pt-8 pb-16 border-t border-white/8 text-center">
            <p className="text-xs text-white/25">
              Built by <a href="https://github.com/Milkessa97" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Milkessa Kebu</a> · <a href="mailto:milkessahabtamukebu@gmail.com" className="text-indigo-400 hover:underline">milkessahabtamukebu@gmail.com</a>
            </p>
          </footer>
        </main>

        {/* Right Rail — visible only on xl+ */}
        <div className="hidden xl:block w-52 flex-shrink-0" />
      </div>
    </div>
  )
}
