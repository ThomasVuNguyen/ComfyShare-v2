"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { createBook } from "@/hooks/useBooks"

const NewPaperPage = () => {
  const { firebaseUser, profile } = useAuth()
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    author: profile?.name ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setForm((prev) => ({ ...prev, author: profile?.name ?? prev.author }))
  }, [profile?.name])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!firebaseUser) return

    try {
      setCreating(true)
      const bookId = await createBook({
        title: form.title,
        subtitle: form.subtitle,
        author: form.author,
        createdBy: firebaseUser.uid,
      })
      router.push(`/papers/${bookId}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create paper.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-3xl border border-neutral-200 bg-white p-8">
          <h1 className="text-3xl font-semibold text-neutral-900">New paper</h1>
          <p className="mt-2 text-neutral-500">
            Give your paper a working title. You can edit it later, add sections, and publish instantly.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-neutral-600">Title</label>
              <input
                className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                required
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-600">Subtitle</label>
              <input
                className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                value={form.subtitle}
                onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-600">Author</label>
              <input
                className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                value={form.author}
                onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-base font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create paper"}
            </button>
          </form>
        </section>
      </AppShell>
    </ProtectedRoute>
  )
}

export default NewPaperPage
