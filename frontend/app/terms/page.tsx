import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Veltro",
  description: "Read the Terms of Service for Veltro, the engineering analytics platform for GitHub teams.",
}

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-500">Effective date: July 29, 2026 &nbsp;·&nbsp; Last updated: July 29, 2026</p>
          <p className="text-sm text-zinc-500 mt-2">
            Please read these Terms carefully before using Veltro. By accessing or using the Service, you agree to be legally bound by these Terms.
          </p>
        </header>

        <div className="prose prose-invert max-w-none space-y-10 text-zinc-300">

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-zinc-400">
              By creating an account, accessing, or using Veltro (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you (&quot;User&quot;, &quot;you&quot;) agree to be bound by these Terms of Service (&quot;Terms&quot;) and our <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</Link>, incorporated herein by reference.
            </p>
            <p className="leading-relaxed text-zinc-400">
              If you are accessing the Service on behalf of an organization or business, you represent and warrant that you have authority to bind that organization to these Terms, and all references to &quot;you&quot; apply to both you personally and that organization.
            </p>
            <p className="leading-relaxed text-zinc-400">
              If you do not agree to these Terms, you must immediately discontinue use of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">2. Description of Service</h2>
            <p className="leading-relaxed text-zinc-400">
              Veltro is an engineering analytics platform that integrates with GitHub via a GitHub App installation to synchronize repository metadata — including pull requests, code reviews, commit history, labels, and contributor profiles — and generate engineering performance metrics, timelines, and AI-powered summaries (&quot;Digests&quot;).
            </p>
            <p className="leading-relaxed text-zinc-400">
              The Service is provided on an &quot;as-is&quot; and &quot;as available&quot; basis. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">3. Eligibility</h2>
            <p className="leading-relaxed text-zinc-400">
              You must be at least 13 years of age (or the minimum digital age of consent in your country) to use the Service. By using the Service, you represent and warrant that you meet this requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">4. Account and Authentication</h2>
            <p className="leading-relaxed text-zinc-400">
              Access to Veltro requires authentication via GitHub OAuth. You are responsible for maintaining the security of your GitHub account. Veltro sessions are managed via secure, HTTP-only cookies containing short-lived JWT tokens (30-minute access tokens, 7-day refresh tokens). Tokens are immediately revoked and blocklisted upon logout.
            </p>
            <p className="leading-relaxed text-zinc-400">
              You agree not to share your account credentials, allow unauthorized third parties to access the Service through your account, or attempt to circumvent authentication mechanisms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">5. GitHub Permissions and Data Access</h2>
            <p className="leading-relaxed text-zinc-400">
              Veltro requests only the minimum read-only GitHub permissions necessary to deliver the Service:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Pull request lifecycle data (timestamps, labels, reviews, reviewers)</li>
              <li>Repository metadata (names, branches, commit references)</li>
              <li>Organization member identities and public profile avatars</li>
            </ul>
            <p className="leading-relaxed text-zinc-400">
              Veltro does not request, read, or store raw source code file contents. You retain full ownership of your GitHub repository content. By installing the Veltro GitHub App, you grant Veltro a limited, revocable license to read the above metadata solely for the purpose of operating the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">6. Acceptable Use</h2>
            <p className="leading-relaxed text-zinc-400">
              You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
              <li>Attempt to bypass, disable, or circumvent rate limiting, authentication, or security controls</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Introduce malicious code, automated scripts, or bots to abuse or overload the Service</li>
              <li>Use the Service to process data you are not authorized to access</li>
              <li>Resell, sublicense, or commercially exploit the Service without our written consent</li>
            </ul>
            <p className="leading-relaxed text-zinc-400">
              We reserve the right to throttle, suspend, or permanently terminate access for any violation of this section.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">7. Intellectual Property</h2>
            <p className="leading-relaxed text-zinc-400">
              The Veltro name, logo, codebase, design, and all associated materials are the exclusive intellectual property of Veltro and are protected by applicable copyright, trademark, and trade secret laws. Nothing in these Terms grants you any right, title, or interest in or to the Service or its underlying technology beyond the limited right to access the Service as described herein.
            </p>
            <p className="leading-relaxed text-zinc-400">
              Any feedback, suggestions, or ideas you provide about the Service may be used by us without restriction or compensation to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">8. Disclaimer of Warranties</h2>
            <p className="leading-relaxed text-zinc-400">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED AVAILABILITY. WE DO NOT WARRANT THAT THE SERVICE WILL BE FREE FROM ERRORS, BUGS, OR SECURITY VULNERABILITIES, OR THAT METRICS AND ANALYTICS PROVIDED ARE ACCURATE OR COMPLETE.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">9. Limitation of Liability</h2>
            <p className="leading-relaxed text-zinc-400">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, VELTRO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES — INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL — ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="leading-relaxed text-zinc-400">
              Our total aggregate liability to you shall not exceed the greater of (a) the amount paid by you, if any, to access the Service in the twelve (12) months prior to the claim, or (b) USD $50.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">10. Indemnification</h2>
            <p className="leading-relaxed text-zinc-400">
              You agree to indemnify, defend, and hold harmless Veltro and its officers, directors, employees, and agents from and against any claims, liabilities, damages, judgments, fines, and costs (including reasonable legal fees) arising out of your breach of these Terms, misuse of the Service, or violation of any third-party rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">11. Termination</h2>
            <p className="leading-relaxed text-zinc-400">
              Either party may terminate this agreement at any time. You may stop using the Service and uninstall the Veltro GitHub App at any time. We reserve the right to suspend or terminate your access immediately and without prior notice if we determine that you have violated these Terms or that your continued access poses a risk to the Service or other users.
            </p>
            <p className="leading-relaxed text-zinc-400">
              Upon termination, all provisions of these Terms that by their nature should survive (including disclaimers, limitations of liability, indemnification, and governing law) shall continue to remain in effect.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">12. Governing Law and Dispute Resolution</h2>
            <p className="leading-relaxed text-zinc-400">
              These Terms shall be governed by and construed in accordance with applicable law. Any dispute arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved, the parties may pursue arbitration or legal proceedings as permitted by applicable local law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">13. Changes to Terms</h2>
            <p className="leading-relaxed text-zinc-400">
              We may update these Terms from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page. Continued use of the Service after any such changes constitutes your acceptance of the updated Terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">14. Contact</h2>
            <p className="leading-relaxed text-zinc-400">
              If you have any questions about these Terms, please contact us through the feedback channels available in the Veltro application or via the project&apos;s official repository.
            </p>
          </section>

          <footer className="pt-8 border-t border-border mt-12 text-center text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Veltro. All rights reserved. &nbsp;·&nbsp;{" "}
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors underline underline-offset-2">
              Privacy Policy
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}
