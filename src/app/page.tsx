import Link from "next/link"
import { ArrowRight, Eye, GitBranch, Ticket, Zap, Bot, PackagePlus, Send, Search } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-600">
            Tiny<span className="text-gray-900">Desk</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#agent-integration" className="text-sm text-gray-600 hover:text-gray-900">
              Agent API
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-4 h-4" /> Transparent support tracking
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 text-balance">
          See exactly where<br />your ticket is.<br />
          <span className="text-emerald-600">Every step.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          TinyDesk shows you the full journey of your support ticket — from submission
          to code fix to deployment. No more &quot;we&apos;ll get back to you.&quot;
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-emerald-600 text-white px-8 py-3.5 rounded-lg text-lg font-medium hover:bg-emerald-700 transition flex items-center gap-2"
          >
            Admin Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#agent-integration"
            className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg text-lg font-medium hover:border-emerald-600 hover:text-emerald-600 transition flex items-center gap-2"
          >
            <Bot className="w-5 h-5" /> Agent API
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">The 8-stage pipeline</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Received", desc: "Ticket submitted via form or API", icon: Ticket },
              { step: "2", title: "Issue Created", desc: "Linked to a GitHub issue", icon: GitBranch },
              { step: "3-6", title: "Fix & Review", desc: "In progress, PR open, reviewed, merged", icon: GitBranch },
              { step: "7-8", title: "Deployed & Closed", desc: "Live in production, ticket resolved", icon: Eye },
            ].map((item) => (
              <div key={item.step} className="text-center bg-white rounded-xl border p-6">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Integration */}
      <section id="agent-integration" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm px-4 py-1.5 rounded-full mb-4">
              <Bot className="w-4 h-4" /> Agent Integration
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrate your product with TinyDesk</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              AI agents and automated systems can submit and track support tickets programmatically.
              Follow these three steps to get your product connected.
            </p>
            <div className="mt-4">
              <a
                href="https://github.com/zenithventure/tinydesk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-4 py-2 rounded-lg transition font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub — zenithventure/tinydesk
              </a>
            </div>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-14">
            {/* Step 1 */}
            <div className="bg-white rounded-xl border p-6">
              <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center mb-4">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">Step 1</div>
              <h3 className="text-lg font-semibold mb-2">Register your product</h3>
              <p className="text-gray-600 text-sm mb-4">
                A TinyDesk admin registers your product via the dashboard and provides you with a unique{" "}
                <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">productSlug</code>.
                This slug identifies your product in every API call.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700">
                <div className="text-gray-400 mb-1"># Example product slug</div>
                <span className="text-violet-600">&quot;productSlug&quot;</span>: <span className="text-emerald-600">&quot;my-saas-app&quot;</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl border p-6">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center mb-4">
                <Send className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Step 2</div>
              <h3 className="text-lg font-semibold mb-2">Submit a ticket</h3>
              <p className="text-gray-600 text-sm mb-4">
                POST to the tickets endpoint with your product slug, submitter details, and issue description.
                The response includes a <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">publicId</code> for tracking.
              </p>
              <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-100 space-y-0.5">
                <div><span className="text-yellow-400">POST</span> <span className="text-gray-300">/api/tickets</span></div>
                <div className="text-gray-500">Content-Type: application/json</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl border p-6">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Step 3</div>
              <h3 className="text-lg font-semibold mb-2">Track the ticket</h3>
              <p className="text-gray-600 text-sm mb-4">
                Use the returned <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">publicId</code> to
                poll ticket status and view the full 8-stage pipeline progress at any time.
              </p>
              <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-100 space-y-0.5">
                <div><span className="text-green-400">GET</span> <span className="text-gray-300">/api/tickets/<span className="text-blue-300">:publicId</span></span></div>
                <div className="text-gray-500">No auth required</div>
              </div>
            </div>
          </div>

          {/* API Reference */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-gray-400 text-sm font-mono">POST /api/tickets — example request</span>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6 text-sm font-mono">
              {/* Request */}
              <div className="min-w-0 overflow-hidden">
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-3">Request body</div>
                <div className="overflow-x-auto rounded">
                  <pre className="text-gray-100 leading-6 whitespace-pre">{`{
  "productSlug": "my-saas-app",
  "submitterEmail": "agent@example.com",
  "submitterName": "AI Agent v2",
  "subject": "Login button unresponsive on Safari",
  "body": "Reproducible steps:\\n1. Open Safari 17\\n2. Navigate to /login\\n3. Click Sign In\\n\\nExpected: form submits\\nActual: nothing happens",
  "screenshots": [
    "https://cdn.example.com/bug-01.png"
  ]
}`}</pre>
                </div>
                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-red-400">required</span>
                    <span className="text-gray-400">productSlug, submitterEmail, subject, body</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">optional</span>
                    <span className="text-gray-400">submitterName, screenshots (max 3 URLs)</span>
                  </div>
                </div>
              </div>
              {/* Response */}
              <div className="min-w-0 overflow-hidden">
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-3">Response <span className="text-emerald-400">201 Created</span></div>
                <div className="overflow-x-auto rounded">
                  <pre className="text-gray-100 leading-6 whitespace-pre">{`{
  "publicId": "TK-00042",
  "status": "RECEIVED",
  "createdAt": "2026-03-24T08:00:00.000Z"
}`}</pre>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-gray-400">
                  <div>• <span className="text-blue-300">publicId</span> — use this to track progress</div>
                  <div>• <span className="text-blue-300">status</span> — initial status is always <span className="text-emerald-400">RECEIVED</span></div>
                  <div>• Returns <span className="text-red-400">404</span> if productSlug is not registered</div>
                  <div>• Returns <span className="text-red-400">400</span> with field errors on validation failure</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status values */}
          <div className="mt-8 bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 text-gray-900">Ticket status values</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { status: "RECEIVED", color: "bg-gray-100 text-gray-700" },
                { status: "ISSUE_CREATED", color: "bg-blue-50 text-blue-700" },
                { status: "FIX_IN_PROGRESS", color: "bg-yellow-50 text-yellow-700" },
                { status: "PR_OPEN", color: "bg-orange-50 text-orange-700" },
                { status: "CHANGES_REQUESTED", color: "bg-red-50 text-red-700" },
                { status: "MERGED", color: "bg-violet-50 text-violet-700" },
                { status: "DEPLOYED", color: "bg-emerald-50 text-emerald-700" },
                { status: "CLOSED", color: "bg-gray-100 text-gray-500" },
              ].map(({ status, color }) => (
                <div key={status} className={`rounded-lg px-3 py-2 text-xs font-mono font-medium ${color}`}>
                  {status}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            &copy; 2026 TinyDesk. Part of the Tiny product suite.
          </div>
        </div>
      </footer>
    </div>
  )
}
