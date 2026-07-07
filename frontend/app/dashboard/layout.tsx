import type { ReactNode } from "react"
import Layout from "@/components/dashboard/dashboardUI/layout"
import { RepoProvider } from "@/components/dashboard/repo-context"
import { ThemeProvider } from "@/components/dashboard/theme-provider"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <RepoProvider>
        <Layout>{children}</Layout>
      </RepoProvider>
    </ThemeProvider>
  )
}
