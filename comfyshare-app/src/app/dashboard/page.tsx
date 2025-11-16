"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppShell } from "@/components/AppShell"
import { useAuth } from "@/contexts/AuthContext"
import { useBooks } from "@/hooks/useBooks"
import { fetchCommentCount } from "@/lib/stats"
import { formatDate, formatNumber, timestampToDate } from "@/lib/utils"

const DashboardPage = () => {
  const { firebaseUser } = useAuth()
  const { books } = useBooks(firebaseUser?.uid)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!books.length) return

    const loadCounts = async () => {
      const entries = await Promise.all(
        books.map(async (book) => {
          const comments = await fetchCommentCount(book.id)
          return [book.id, comments] as const
        }),
      )

      setCommentCounts(Object.fromEntries(entries))
    }

    loadCounts()
  }, [books])

  const stats = useMemo(() => {
    const total = books.length
    const published = books.filter((book) => book.published).length
    const drafts = total - published
    const totalComments = Object.values(commentCounts).reduce((acc, n) => acc + n, 0)

    return [
      { label: "Total papers", value: total },
      { label: "Published", value: published },
      { label: "Drafts", value: drafts },
      { label: "Comments", value: totalComments },
    ]
  }, [books, commentCounts])

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-10">
          <section className="rounded-3xl border border-neutral-200 bg-white p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold text-neutral-900">All your papers in one place</h1>
                <p className="mt-2 text-neutral-500">
                  Keep drafts private, publish instantly, and track comment threads in a single view.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/papers/import"
                  className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Import from DOI
                </Link>
                <Link
                  href="/papers/new"
                  className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  New paper
                </Link>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-neutral-200 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{formatNumber(stat.value)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">My papers</h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50 text-left text-sm text-neutral-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Comments</th>
                    <th className="px-6 py-4 font-medium">Updated</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-neutral-900">{book.title}</div>
                        <p className="text-xs text-neutral-500">{book.subtitle}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            book.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {book.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-5">{commentCounts[book.id] ?? 0}</td>
                      <td className="px-6 py-5 text-neutral-500">
                        {formatDate(timestampToDate(book.updatedAt) ?? timestampToDate(book.createdAt))}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-3">
                          <Link href={`/papers/${book.id}/edit`} className="text-sm font-semibold text-neutral-900 underline">
                            Edit
                          </Link>
                          {book.published && (
                            <Link
                              href={`/papers/${book.slug}`}
                              className="text-sm font-semibold text-neutral-500 underline"
                              target="_blank"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!books.length && (
                    <tr>
                      <td className="px-6 py-10 text-center text-neutral-500" colSpan={5}>
                        You haven&apos;t created any papers yet. Start with a blank page or import via DOI.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default DashboardPage
