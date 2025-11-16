"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const { firebaseUser } = useAuth()

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Writebook</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">
              Publish research instantly. Share the link. Start the discussion.
            </h1>
          </div>
          <div className="flex gap-3">
            {firebaseUser ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium hover:bg-white hover:text-black"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium hover:bg-white hover:text-black"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
                >
                  Create free account
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-10 shadow-2xl shadow-blue-500/10">
          <p className="text-lg text-neutral-300">Mission</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            Researchers shouldn&apos;t wait 6-18 months for feedback.
          </h2>
          <p className="mt-4 text-lg text-neutral-300">
            Writebook gives you a Markdown-first editor, DOI import, clean reader experience, and threaded comments so
            you can ship ideas fast and talk directly with your audience.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-base text-neutral-200">
            {[
              "Instant publishing",
              "Clean reading experience",
              "Comment threads",
              "Shareable slug links",
              "Dark-light aware UI",
              "Free for unlimited papers",
            ].map((chip) => (
              <span key={chip} className="rounded-2xl border border-white/10 px-4 py-2">
                ✅ {chip}
              </span>
            ))}
          </div>
          {!firebaseUser && (
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="flex-1 rounded-2xl bg-white px-6 py-4 text-center text-base font-semibold text-black hover:bg-neutral-200"
              >
                Start writing
              </Link>
              <Link
                href="/signin"
                className="flex-1 rounded-2xl border border-white/20 px-6 py-4 text-center text-base font-semibold hover:bg-white hover:text-black"
              >
                I already have an account
              </Link>
            </div>
          )}
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 p-8 sm:grid-cols-3">
          {[
            {
              title: "Write or import",
              body: "Use the Markdown editor from the legacy Rails app or paste a DOI to auto-populate title, authors, and abstract.",
            },
            {
              title: "Publish instantly",
              body: "Flip drafts live, copy the clean `/papers/{slug}` URL, and share it anywhere with rich link previews.",
            },
            {
              title: "Discuss openly",
              body: "Readers leave comments and one-level replies. Authors moderate, pin, and respond inside their dashboard.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-300">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
