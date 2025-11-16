"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { createBook } from "@/hooks/useBooks"
import { createLeaf } from "@/hooks/useLeaves"
import { DoiMetadata, fetchDoiMetadata } from "@/lib/doi"

const cleanAbstract = (input?: string) => {
  if (!input) return ""
  return input.replace(/<[^>]+>/g, "").trim()
}

const ImportPaperPage = () => {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [doi, setDoi] = useState("")
  const [result, setResult] = useState<DoiMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const metadata = await fetchDoiMetadata(doi)
      if (!metadata) {
        throw new Error("Unable to find DOI")
      }
      setResult(metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch DOI data.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!firebaseUser || !result) return
    setCreating(true)
    try {
      const bookId = await createBook({
        title: result.title,
        subtitle: cleanAbstract(result.abstract).slice(0, 120),
        author: result.authors?.[0],
        createdBy: firebaseUser.uid,
      })

      const abstractContent = cleanAbstract(result.abstract)
      if (abstractContent) {
        await createLeaf(bookId, {
          title: "Abstract",
          content: abstractContent,
          position: 1,
        })
      }

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
          <h1 className="text-3xl font-semibold text-neutral-900">Import from DOI</h1>
          <p className="mt-2 text-neutral-500">
            Paste a DOI and we&apos;ll pull metadata from Crossref/DataCite. Edit anything before publishing.
          </p>

          <form className="mt-6 flex flex-col gap-4 md:flex-row" onSubmit={handleLookup}>
            <input
              value={doi}
              onChange={(event) => setDoi(event.target.value)}
              placeholder="10.1101/2024.01.001"
              required
              className="flex-1 rounded-2xl border border-neutral-200 px-4 py-3 focus:border-neutral-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-neutral-900 px-6 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Fetching…" : "Lookup"}
            </button>
          </form>
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          {result && (
            <div className="mt-10 space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Title</p>
                <p className="mt-2 text-xl font-semibold text-neutral-900">{result.title}</p>
              </div>
              {result.authors?.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Authors</p>
                  <p className="mt-2 text-neutral-700">{result.authors.join(", ")}</p>
                </div>
              ) : null}
              {result.abstract && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Abstract</p>
                  <p className="mt-2 text-neutral-700">{cleanAbstract(result.abstract)}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500">
                {result.published && <span>Published: {result.published}</span>}
                {result.url && (
                  <a href={result.url} target="_blank" className="underline">
                    Source link
                  </a>
                )}
                <span>Source: {result.source}</span>
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create paper with this metadata"}
              </button>
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedRoute>
  )
}

export default ImportPaperPage
