"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { doc, onSnapshot } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppShell } from "@/components/AppShell"
import { db, storage } from "@/lib/firebase"
import { useLeaves, createLeaf, updateLeaf, deleteLeaf } from "@/hooks/useLeaves"
import { ensureUniqueSlug, updateBook } from "@/hooks/useBooks"
import { WritebookBook } from "@/types/writebook"

type PageProps = {
  params: { bookId: string }
}

type EditableMetadataField = "title" | "subtitle" | "author"
type EditableFieldKey = EditableMetadataField | "everyoneAccess" | "theme"

const metadataInputs: Array<{ label: string; field: EditableMetadataField; placeholder: string }> = [
  { label: "Title", field: "title", placeholder: "Paper title" },
  { label: "Subtitle", field: "subtitle", placeholder: "Optional subtitle" },
  { label: "Author", field: "author", placeholder: "Author name" },
]

const PaperEditorPage = ({ params }: PageProps) => {
  const router = useRouter()
  const bookId = params.bookId
  const { leaves } = useLeaves(bookId)
  const [book, setBook] = useState<WritebookBook | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  const [editingLeaves, setEditingLeaves] = useState<Record<string, { title: string; content: string }>>({})

  useEffect(() => {
    const bookRef = doc(db, "writebook_books", bookId)
    const unsubscribe = onSnapshot(bookRef, (snapshot) => {
      if (snapshot.exists()) {
        setBook({
          id: snapshot.id,
          ...(snapshot.data() as Omit<WritebookBook, "id">),
        })
      } else {
        router.push("/dashboard")
      }
    })

    return () => unsubscribe()
  }, [bookId, router])

  useEffect(() => {
    if (!leaves.length) return
    setEditingLeaves((prev) => {
      const next = { ...prev }
      leaves.forEach((leaf) => {
        const existing = prev[leaf.id]
        const content = leaf.body?.content ?? ""
        if (!existing || existing.title !== leaf.title || existing.content !== content) {
          next[leaf.id] = {
            title: leaf.title,
            content,
          }
        }
      })
      return next
    })
  }, [leaves])

  const handleMetadataChange = (field: EditableFieldKey, value: string | boolean) => {
    setBook((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const saveMetadata = async () => {
    if (!book) return
    await updateBook(bookId, {
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      everyoneAccess: book.everyoneAccess ?? true,
      theme: book.theme ?? "blue",
    })
    setStatusMessage("Saved metadata")
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const handleAddPage = async () => {
    const nextPosition = leaves.length ? leaves[leaves.length - 1].position + 1 : 1
    await createLeaf(bookId, { title: "Untitled section", content: "", position: nextPosition })
  }

  const handleLeafChange = (leafId: string, field: "title" | "content", value: string) => {
    setEditingLeaves((prev) => ({ ...prev, [leafId]: { ...prev[leafId], [field]: value } }))
  }

  const saveLeaf = async (leafId: string) => {
    const payload = editingLeaves[leafId]
    if (!payload) return
    await updateLeaf(bookId, leafId, { title: payload.title, content: payload.content })
    setStatusMessage("Saved section")
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const moveLeaf = async (leafId: string, direction: "up" | "down") => {
    const leafIndex = leaves.findIndex((leaf) => leaf.id === leafId)
    if (leafIndex < 0) return
    const swapIndex = direction === "up" ? leafIndex - 1 : leafIndex + 1
    if (swapIndex < 0 || swapIndex >= leaves.length) return

    const current = leaves[leafIndex]
    const target = leaves[swapIndex]
    await updateLeaf(bookId, current.id, { position: target.position })
    await updateLeaf(bookId, target.id, { position: current.position })
  }

  const handlePublishToggle = async () => {
    if (!book) return
    setIsPublishing(true)
    try {
      let slug = book.slug
      if (!book.slug || book.slug.length < 4) {
        slug = await ensureUniqueSlug(book.title)
      }

      await updateBook(bookId, {
        published: !book.published,
        slug,
        publishedAt: !book.published ? new Date() : null,
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCoverUpload = async (file: File) => {
    const storageRef = ref(storage, `writebook/books/${bookId}/cover-${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    await updateBook(bookId, { coverUrl: url })
  }

  const previewUrl = useMemo(() => (book?.slug ? `/papers/${book.slug}` : null), [book?.slug])

  if (!book) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p>Loading paper…</p>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8">
          <section className="rounded-3xl border border-neutral-200 bg-white p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">Editor</p>
                <h1 className="mt-2 text-3xl font-semibold text-neutral-900">{book.title}</h1>
                {previewUrl && (
                  <a className="text-sm text-neutral-500 underline" href={previewUrl} target="_blank">
                    View public page
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={handlePublishToggle}
                className={`rounded-full px-5 py-3 text-sm font-semibold ${
                  book.published ? "bg-red-100 text-red-700" : "bg-neutral-900 text-white"
                }`}
                disabled={isPublishing}
              >
                {isPublishing
                  ? "Updating…"
                  : book.published
                    ? "Unpublish"
                    : "Publish and get shareable link"}
              </button>
            </div>
            <form
              className="mt-8 grid gap-6 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                saveMetadata()
              }}
            >
              {metadataInputs.map((input) => (
                <div key={input.field}>
                  <label className="text-sm font-semibold text-neutral-600">{input.label}</label>
                  <input
                    required={input.field === "title"}
                    value={book[input.field] ?? ""}
                    onChange={(event) => handleMetadataChange(input.field, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                    placeholder={input.placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-semibold text-neutral-600">Cover image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full rounded-2xl border border-dashed border-neutral-200 px-4 py-10 text-sm text-neutral-500"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleCoverUpload(file)
                  }}
                />
                {book.coverUrl && (
                  <Image
                    src={book.coverUrl}
                    alt="Cover"
                    width={128}
                    height={160}
                    className="mt-4 h-40 w-32 rounded-xl object-cover"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-600">Share access</label>
                <div className="mt-2 flex gap-4 rounded-2xl border border-neutral-200 p-4">
                  <label className="flex items-center gap-2 text-sm text-neutral-600">
                    <input
                      type="checkbox"
                      checked={book.everyoneAccess ?? true}
                      onChange={(event) => handleMetadataChange("everyoneAccess", event.target.checked)}
                    />
                    Everyone with link has reader access
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Save metadata
                </button>
              </div>
            </form>
            {statusMessage && <p className="mt-4 text-sm text-emerald-600">{statusMessage}</p>}
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Sections</h2>
              <button
                type="button"
                onClick={handleAddPage}
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add section
              </button>
            </div>
            <div className="mt-8 space-y-8">
              {leaves.map((leaf) => (
                <article key={leaf.id} className="rounded-3xl border border-neutral-200 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input
                      value={editingLeaves[leaf.id]?.title ?? ""}
                      onChange={(event) => handleLeafChange(leaf.id, "title", event.target.value)}
                      className="w-full flex-1 rounded-2xl border border-neutral-200 px-4 py-3 text-lg font-semibold focus:border-neutral-900 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveLeaf(leaf.id, "up")}
                        className="rounded-full border border-neutral-200 px-4 py-2 text-xs uppercase tracking-wide text-neutral-500"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLeaf(leaf.id, "down")}
                        className="rounded-full border border-neutral-200 px-4 py-2 text-xs uppercase tracking-wide text-neutral-500"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLeaf(bookId, leaf.id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <textarea
                      value={editingLeaves[leaf.id]?.content ?? ""}
                      onChange={(event) => handleLeafChange(leaf.id, "content", event.target.value)}
                      className="h-64 w-full rounded-2xl border border-neutral-200 p-4 font-mono text-sm text-neutral-700 focus:border-neutral-900 focus:outline-none"
                      placeholder="Write in Markdown…"
                    />
                    <div className="h-64 overflow-y-auto rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-700">
                      <div className="prose max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {editingLeaves[leaf.id]?.content ?? ""}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveLeaf(leaf.id)}
                      className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white"
                    >
                      Save section
                    </button>
                  </div>
                </article>
              ))}
              {!leaves.length && (
                <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                  No sections yet. Click &ldquo;Add section&rdquo; to start writing or import via DOI.
                </p>
              )}
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default PaperEditorPage
