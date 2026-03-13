import Link from "next/link"
import { ArrowRight, Eye, GitBranch, Ticket, Zap } from "lucide-react"

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
