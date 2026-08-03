"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Github, Mail, ArrowLeft, ExternalLink, Code2, Globe, Heart, Layers, Sparkles, Terminal } from "lucide-react"

// Telegram Icon SVG Component
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.944 0C5.344 0 0 5.344 0 11.944c0 6.6 5.344 11.944 11.944 11.944 6.6 0 11.944-5.344 11.944-11.944C23.888 5.344 18.544 0 11.944 0zm5.836 8.358l-1.956 9.222c-.148.667-.547.83-.11.83.003 0 .007 0 .01-.002.32-.095.736-.37 1.077-.696 1.036-.967 1.83-2.072 2.37-3.298.54-1.226.79-2.527.75-3.834a3.1 3.1 0 0 0-.206-1.127c-.12-.295-.316-.548-.564-.73-.248-.182-.544-.282-.85-.292-.513-.008-1.023.1-1.498.318-1.745.8-3.486 1.61-5.23 2.413l-5.632 2.61c-.51.246-.66.577-.163.784.498.207 1.343.435 2.015.65.25.08.528.082.78.005a2.536 2.536 0 0 0 .546-.226c.71-.383 1.41-.78 2.112-1.176l5.445-3.4c.05-.03.116-.016.148.032.032.048.02.115-.027.147l-4.664 4.2c-.22.2-.423.415-.61.642a4.67 4.67 0 0 1-.773.742l-.128.096c-.347.26-.704.507-1.072.74l-.1.062c-.44.275-.812.51-1.5.5-.66-.01-1.3-.263-1.94-.5l-.06-.023c-.76-.282-1.503-.6-2.24-.93a1.442 1.442 0 0 1-.952-1.134 1.412 1.412 0 0 1 .632-1.258l5.63-2.61c3.568-1.637 7.135-3.275 10.703-4.912.44-.2.915-.226 1.36-.075.443.15.823.447 1.08.843z" />
    </svg>
  )
}

const SKILLS = [
  { category: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "GSAP"] },
  { category: "Backend & DB", items: ["Python", "FastAPI", "Node.js", "PostgreSQL", "Prisma", "Alembic"] },
  { category: "DevOps & Cloud", items: ["Docker", "GitHub Actions", "CI/CD", "Vercel", "AWS / Render"] },
]

const PROJECTS = [
  {
    title: "Veltro",
    tagline: "Engineering Team Health Platform",
    description: "An analytics platform that connects directly to GitHub repositories, providing insights on cycle time, review bottlenecks, and automated AI team updates powered by Google Gemini.",
    tech: ["Next.js", "FastAPI", "PostgreSQL", "Google Gemini AI"],
    liveUrl: "/",
    isCurrent: true,
  },
  {
    title: "Developer Portfolio / Projects",
    tagline: "Full-Stack Development Solutions",
    description: "A showcase of custom full-stack templates, dashboard UI integrations, and API architectures designed for performance and scale.",
    tech: ["TypeScript", "Docker", "TailwindCSS", "Prisma"],
    githubUrl: "https://github.com/Milkessa97",
  }
]

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-foreground relative overflow-hidden font-sans pb-24 selection:bg-primary/20">
      {/* Ambient background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[150px]" />
        <div className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[150px]" />
      </div>

      <div className="max-w-[800px] mx-auto px-6 relative z-10 pt-12 md:pt-20">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-12"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Veltro
        </Link>

        {/* Hero Section */}
        <header className="flex flex-col gap-6 mb-16">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold w-fit mb-2">
              <Sparkles className="h-3 w-3" />
              Creator of Veltro
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Milkessa Habtamu
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Full-Stack Software Engineer
            </p>
          </div>

          <p className="text-base md:text-lg text-muted-foreground/90 leading-relaxed max-w-[65ch]">
            Hello! I'm Milkessa, a solo full-stack developer dedicated to building performance-driven, beautifully crafted web platforms. I specialize in designing seamless user experiences combined with solid backend architectures and integrations.
          </p>

          {/* Socials / Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a 
              href="mailto:milkessahabtamukebu@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-all shadow-lg shadow-primary/10"
            >
              <Mail className="h-4 w-4" />
              Email Me
            </a>
            <a 
              href="https://github.com/Milkessa97"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:text-white transition-all text-sm font-medium"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <a 
              href="https://t.me/milkessa04"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:text-white transition-all text-sm font-medium"
            >
              <TelegramIcon className="h-4 w-4" />
              Telegram
            </a>
          </div>
        </header>

        <hr className="border-white/5 my-12" />

        {/* Skills Grid */}
        <section className="mb-16">
          <div className="flex items-center gap-2 text-lg font-semibold text-white mb-6">
            <Terminal className="h-5 w-5 text-primary" />
            <h2>Technical Stack</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SKILLS.map((skillGroup, idx) => (
              <div 
                key={idx}
                className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm"
              >
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-muted-foreground/60">
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, sIdx) => (
                    <span 
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Projects */}
        <section className="mb-16">
          <div className="flex items-center gap-2 text-lg font-semibold text-white mb-6">
            <Layers className="h-5 w-5 text-primary" />
            <h2>Projects</h2>
          </div>
          <div className="flex flex-col gap-6">
            {PROJECTS.map((project, idx) => (
              <div 
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8 backdrop-blur-sm hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      {project.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary/80 font-medium mt-0.5">{project.tagline}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {project.liveUrl && (
                      <Link 
                        href={project.liveUrl}
                        className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                      </Link>
                    )}
                    {project.githubUrl && (
                      <a 
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((t, tIdx) => (
                    <span 
                      key={tIdx} 
                      className="text-[11px] font-medium text-muted-foreground/60 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <footer className="text-center text-xs text-muted-foreground/40 mt-20 flex items-center justify-center gap-1.5">
          <span>© 2026 Milkessa Habtamu. Built with</span>
          <Heart className="h-3 w-3 fill-red-500/80 text-red-500/80" />
          <span>& Next.js</span>
        </footer>
      </div>
    </div>
  )
}
