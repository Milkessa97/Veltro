"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [docked, setDocked] = useState(false)

  useEffect(() => {
    const handleScrollEvent = () => {
      const y = window.scrollY
      // Gradient activates shortly after top of page
      setScrolled(y > 80)
      // Pill/border state activates after scrolling past the dashboard preview (~70% of viewport height)
      setDocked(y > window.innerHeight * 0.7)
    }

    handleScrollEvent()
    window.addEventListener("scroll", handleScrollEvent, { passive: true })
    return () => window.removeEventListener("scroll", handleScrollEvent)
  }, [])

  const navItems = [
    { name: "Features", href: "#features-section" },
    { name: "Contact", href: "#contact-section" },
    { name: "Docs", href: "/docs" },
  ]

  const isAnchorLink = (href: string) => href.startsWith("#")

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.substring(1)
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[45] transition-all duration-500 px-6 md:px-8 py-4 ${
        docked
          ? "rounded-b-2xl border-b border-l border-r border-white/8 bg-background/60 backdrop-blur-md shadow-lg shadow-black/10"
          : ""
      }`}
    >
      {/* Full-bleed gradient — only visible in the hero section before docking */}
      <div
        className={`absolute inset-0 rounded-b-2xl bg-gradient-to-b from-primary/25 via-primary/5 to-transparent transition-opacity duration-500 pointer-events-none -z-10 ${
          scrolled && !docked ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center pb-2 gap-2">
            <img src="/veltro-logo-dark-bg.svg" alt="Company Logo" width="70" height="70" />
          </Link>
          <nav className="hidden md:flex items-center">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (isAnchorLink(item.href)) {
                    handleScroll(e, item.href)
                  }
                }}
                className="text-muted-foreground hover:text-foreground px-4 py-1.5 rounded-full font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-full font-medium shadow-sm">
              Connect with GitHub
            </Button>
          </Link>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-t border-border text-foreground">
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-semibold text-foreground">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      if (isAnchorLink(item.href)) {
                        handleScroll(e, item.href)
                      }
                      setIsOpen(false)
                    }}
                    className="text-muted-foreground hover:text-foreground justify-start text-lg py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link href="/login" className="w-full mt-4" onClick={() => setIsOpen(false)}>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-full font-medium shadow-sm w-full">
                    Connect with GitHub
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
