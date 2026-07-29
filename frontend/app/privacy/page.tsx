import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Veltro",
  description: "Learn how Veltro collects, uses, stores, and protects your data.",
}

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground flex flex-col items-center py-16 px-5 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-backdrop" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 glow-spot opacity-40" />

      <div className="relative z-10 w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-12 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to home
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500">Effective date: July 29, 2026 &nbsp;·&nbsp; Last updated: July 29, 2026</p>
          <p className="text-sm text-zinc-500 mt-2">
            This Privacy Policy explains how Veltro (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, stores, shares, and protects your personal information when you use our Service. By using Veltro, you agree to the practices described in this Policy.
          </p>
        </header>

        <div className="prose prose-invert max-w-none space-y-10 text-zinc-300">

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">1. Information We Collect</h2>
            <p className="leading-relaxed text-zinc-400">
              When you connect Veltro to your GitHub account via OAuth, we collect and store the following data:
            </p>
            <h3 className="text-base font-semibold text-white/80">Account Information</h3>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>GitHub username (login handle) and display name</li>
              <li>GitHub user ID (numeric identifier)</li>
              <li>Public avatar URL</li>
              <li>GitHub App Installation ID (required to access repository data on your behalf)</li>
            </ul>
            <h3 className="text-base font-semibold text-white/80">Repository Metadata</h3>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Repository names, owner names, visibility status (public/private)</li>
              <li>Pull request details: titles, lifecycle timestamps (opened, reviewed, merged, closed), state, additions, deletions, labels</li>
              <li>Code review records: reviewer identities, review timestamps</li>
              <li>Commit references: SHA hashes and commit timestamps (not file contents)</li>
              <li>Contributor identities: GitHub login, display name, and public avatar URL</li>
            </ul>
            <p className="leading-relaxed text-zinc-400">
              We do <strong className="text-white">not</strong> collect or store raw source code, file contents, commit messages, issue body text, or any private communications.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">2. How We Use Your Information</h2>
            <p className="leading-relaxed text-zinc-400">
              We use the collected information exclusively to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Authenticate and maintain your user session</li>
              <li>Synchronize and store repository metadata to generate engineering metrics</li>
              <li>Compute and display analytics (PR cycle times, review latencies, contributor performance)</li>
              <li>Generate AI-powered engineering digests using the Google Gemini API</li>
              <li>Persist your dashboard preferences (e.g., active repository, date range)</li>
              <li>Maintain sync history and audit logs for your repositories</li>
            </ul>
            <p className="leading-relaxed text-zinc-400">
              We do <strong className="text-white">not</strong> use your data for advertising, marketing profiling, or sell it to any third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">3. Data Isolation and Security</h2>
            <p className="leading-relaxed text-zinc-400">
              All data stored by Veltro is strictly isolated at the database level per authenticated user. Every record traces back to your user account through an enforced relational foreign key chain. Every API request independently verifies ownership of the requested resource before executing any query — it is architecturally impossible for one user to access another user&apos;s data.
            </p>
            <p className="leading-relaxed text-zinc-400">
              Sensitive credentials (GitHub installation tokens and API keys) are encrypted at rest using Fernet symmetric encryption (AES-128 in CBC mode with HMAC-SHA256 authentication). The encryption key is stored exclusively as a server-side environment variable and is never transmitted to the client.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">4. Session Cookies</h2>
            <p className="leading-relaxed text-zinc-400">
              We use the following session cookies:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong className="text-white">Access Token Cookie</strong> — A short-lived JWT (30 minutes). Stored as an HTTP-only, Secure, SameSite=Lax cookie. Never accessible to browser-side JavaScript.</li>
              <li><strong className="text-white">Refresh Token Cookie</strong> — A longer-lived JWT (7 days). Also HTTP-only. Used to silently renew your access token without requiring re-login.</li>
            </ul>
            <p className="leading-relaxed text-zinc-400">
              All tokens are immediately revoked and written to a server-side blocklist upon logout. We do not use advertising cookies, analytics cookies, tracking pixels, or any third-party cookie services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">5. Third-Party Services</h2>
            <p className="leading-relaxed text-zinc-400">
              Veltro uses the following third-party services to operate:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong className="text-white">GitHub API</strong> — To authenticate you and retrieve authorized repository metadata. Review <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-white transition-colors">GitHub&apos;s Privacy Statement</a>.</li>
              <li><strong className="text-white">Google Gemini API</strong> — To generate AI engineering digests. Repository metadata (PR titles, timestamps, and contributor usernames) is sent to the Gemini API endpoint. Google&apos;s use of API data is governed by their <a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-white transition-colors">Gemini API Terms</a>. Your data is not used to train Google&apos;s public models under the API usage terms.</li>
            </ul>
            <p className="leading-relaxed text-zinc-400">
              We do not share your data with any other third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">6. Data Retention and Deletion</h2>
            <p className="leading-relaxed text-zinc-400">
              Repository synchronization data is retained as long as you maintain your Veltro account and GitHub App installation. If you uninstall the Veltro GitHub App for a given repository or revoke its access, all locally stored metadata for that repository is automatically purged from our database during the next synchronization run.
            </p>
            <p className="leading-relaxed text-zinc-400">
              To request deletion of your account and all associated data, please contact us through the channels described in Section 9 below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">7. Your Rights</h2>
            <p className="leading-relaxed text-zinc-400">
              Depending on your jurisdiction, you may have the following rights with respect to your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong className="text-white">Access</strong> — Request a copy of the personal data we hold about you</li>
              <li><strong className="text-white">Rectification</strong> — Request correction of inaccurate data</li>
              <li><strong className="text-white">Erasure</strong> — Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
              <li><strong className="text-white">Restriction</strong> — Request that we restrict processing of your data</li>
              <li><strong className="text-white">Portability</strong> — Request your data in a portable, machine-readable format</li>
              <li><strong className="text-white">Objection</strong> — Object to certain types of data processing</li>
            </ul>
            <p className="leading-relaxed text-zinc-400">
              To exercise any of these rights, please contact us via the channels in Section 9.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">8. Changes to This Policy</h2>
            <p className="leading-relaxed text-zinc-400">
              We may update this Privacy Policy from time to time. We will indicate the effective date of the latest revision at the top of this page. Continued use of the Service after any revisions constitutes your acceptance of the updated Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">9. Contact Us</h2>
            <p className="leading-relaxed text-zinc-400">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out to us through the Veltro application feedback channels or via the project&apos;s official repository.
            </p>
          </section>

          <footer className="pt-8 border-t border-border mt-12 text-center text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Veltro. All rights reserved. &nbsp;·&nbsp;{" "}
            <Link href="/terms" className="hover:text-zinc-300 transition-colors underline underline-offset-2">
              Terms of Service
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}
