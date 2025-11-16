"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, limit, query, where } from "firebase/firestore"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { db } from "@/lib/firebase"
import { useLeaves } from "@/hooks/useLeaves"
import { useComments, createComment, deleteComment, updateComment, Comment } from "@/hooks/useComments"
import { useAuth } from "@/contexts/AuthContext"
import { WritebookBook } from "@/types/writebook"
import { timestampToDate } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ConfirmDialog"

type PageProps = {
  params: { slug: string }
}

const ReaderPage = ({ params }: PageProps) => {
  const slug = decodeURIComponent(params.slug)
  const [book, setBook] = useState<WritebookBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const { firebaseUser, profile } = useAuth()

  useEffect(() => {
    const loadBook = async () => {
      const booksRef = collection(db, "writebook_books")
      const snapshot = await getDocs(query(booksRef, where("slug", "==", slug), limit(1)))
      if (!snapshot.empty) {
        setBook({
          id: snapshot.docs[0].id,
          ...(snapshot.docs[0].data() as Omit<WritebookBook, "id">),
        })
      } else {
        setBook(null)
      }
      setLoading(false)
    }

    loadBook()
  }, [slug])

  const { leaves } = useLeaves(book?.id)
  const { comments } = useComments(book?.id)

  const toc = useMemo(() => leaves.map((leaf) => ({ id: leaf.id, title: leaf.title })), [leaves])

  const handleCommentSubmit = async () => {
    if (!firebaseUser || !book || !commentText.trim()) return
    await createComment(book.id, {
      text: commentText.trim(),
      userId: firebaseUser.uid,
      userName: profile?.name ?? "Researcher",
      parentCommentId: undefined,
      depth: 0,
      deleted: false,
    })
    setCommentText("")
  }

  const handleEdit = async () => {
    if (!book || !editingComment) return
    await updateComment(book.id, editingComment, commentText.trim())
    setEditingComment(null)
    setCommentText("")
  }

  const startEditing = (id: string, text: string) => {
    setEditingComment(id)
    setCommentText(text)
  }

  const handleReplySubmit = async (parentId: string) => {
    const replyBody = replyDrafts[parentId]?.trim()
    if (!replyBody || !firebaseUser || !book) return
    await createComment(book.id, {
      text: replyBody,
      userId: firebaseUser.uid,
      userName: profile?.name ?? "Researcher",
      parentCommentId: parentId,
      depth: 1,
      deleted: false,
    })
    setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }))
  }

  const commentsByParent = useMemo(() => {
    const map: Record<string, Comment[]> = {}
    comments.forEach((comment) => {
      if (comment.parentCommentId) {
        map[comment.parentCommentId] = map[comment.parentCommentId] || []
        map[comment.parentCommentId].push(comment)
      }
    })
    return map
  }, [comments])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p>Loading paper…</p>
      </main>
    )
  }

  if (!book || !book.published) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 text-center">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Paper unavailable</h1>
          <p className="mt-2 text-neutral-500">This slug doesn&apos;t exist or the paper is still a draft.</p>
        </div>
      </main>
    )
  }

  // Update meta tags for SEO and social sharing
  useEffect(() => {
    if (book) {
      const description = book.subtitle || `Research paper by ${book.author}`
      document.title = `${book.title} - Writebook`

      // Update or create meta tags
      const updateMetaTag = (property: string, content: string, isProperty = true) => {
        const attr = isProperty ? 'property' : 'name'
        let tag = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement
        if (!tag) {
          tag = document.createElement('meta')
          tag.setAttribute(attr, property)
          document.head.appendChild(tag)
        }
        tag.content = content
      }

      updateMetaTag('description', description, false)
      updateMetaTag('og:type', 'article')
      updateMetaTag('og:title', book.title)
      updateMetaTag('og:description', description)
      updateMetaTag('og:url', window.location.href)
      if (book.coverUrl) updateMetaTag('og:image', book.coverUrl)

      updateMetaTag('twitter:card', 'summary_large_image', false)
      updateMetaTag('twitter:title', book.title, false)
      updateMetaTag('twitter:description', description, false)
      if (book.coverUrl) updateMetaTag('twitter:image', book.coverUrl, false)

      if (book.author) updateMetaTag('article:author', book.author)
      if (book.publishedAt) {
        updateMetaTag('article:published_time', timestampToDate(book.publishedAt)?.toISOString() || '')
      }
    }
  }, [book])

  return (
      <main className="min-h-screen bg-neutral-50">
        <article className="mx-auto max-w-5xl px-6 py-12">
        <header className="rounded-3xl border border-neutral-200 bg-white p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Writebook paper</p>
          <h1 className="mt-4 text-4xl font-semibold text-neutral-900">{book.title}</h1>
          {book.subtitle && <p className="mt-3 text-lg text-neutral-600">{book.subtitle}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            <span>Author: {book.author}</span>
            <span>Published: {timestampToDate(book.publishedAt)?.toLocaleDateString() ?? "Live"}</span>
            <button
              className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              Copy link
            </button>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-3xl border border-neutral-200 bg-white p-6">
            <p className="text-sm font-semibold text-neutral-600">Table of contents</p>
            <ol className="mt-4 space-y-3 text-sm text-neutral-600">
              {toc.map((item, index) => (
                <li key={item.id}>
                  <a href={`#leaf-${item.id}`} className="hover:text-neutral-900">
                    {index + 1}. {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <section className="space-y-12">
            {leaves.map((leaf, index) => (
              <div key={leaf.id} id={`leaf-${leaf.id}`} className="rounded-3xl border border-neutral-200 bg-white p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Section {index + 1}</p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-900">{leaf.title}</h2>
                <div className="prose prose-neutral mt-6 max-w-none text-neutral-800 prose-pre:bg-neutral-900 prose-pre:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{leaf.body?.content ?? ""}</ReactMarkdown>
                </div>
              </div>
            ))}
          </section>
        </div>

        <section className="mt-12 rounded-3xl border border-neutral-200 bg-white p-10">
          <header className="flex flex-col gap-3 border-b border-neutral-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">Comments</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </p>
            </div>
            {!firebaseUser && (
              <p className="text-sm text-neutral-500">
                <a href="/signin" className="font-semibold underline">
                  Sign in
                </a>{" "}
                to participate in the discussion.
              </p>
            )}
          </header>

          {firebaseUser && (
            <div className="mt-8 space-y-4">
              <textarea
                placeholder="Share your thoughts (max 2000 chars)…"
                maxLength={2000}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                className="w-full rounded-2xl border border-neutral-200 p-4 text-sm focus:border-neutral-900 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={editingComment ? handleEdit : handleCommentSubmit}
                  className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!commentText.trim()}
                >
                  {editingComment ? "Save edit" : "Post comment"}
                </button>
                {editingComment && (
                  <button
                    className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-500"
                    type="button"
                    onClick={() => {
                      setEditingComment(null)
                      setCommentText("")
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 space-y-6">
            {comments
              .filter((comment) => comment.depth === 0)
              .map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-neutral-100 p-6">
                  <CommentHeader
                    comment={comment}
                    bookAuthorId={book.createdBy}
                    firebaseUserId={firebaseUser?.uid}
                    onEdit={() => startEditing(comment.id, comment.text)}
                    onDelete={() => deleteComment(book.id, comment.id)}
                  />
                  <p className="mt-3 text-neutral-800">{comment.text}</p>
                  {firebaseUser && !comment.deleted && (
                    <div className="mt-4 flex gap-3 text-sm text-neutral-500">
                      <button
                        type="button"
                        className="font-semibold underline"
                        onClick={() => setReplyDrafts((prev) => ({ ...prev, [comment.id]: prev[comment.id] ?? "" }))}
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  {replyDrafts[comment.id] !== undefined && (
                    <div className="mt-4 space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <textarea
                        className="w-full rounded-2xl border border-neutral-200 p-3 text-sm focus:border-neutral-900 focus:outline-none"
                        placeholder="Reply with constructive feedback…"
                        value={replyDrafts[comment.id]}
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [comment.id]: event.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          disabled={!replyDrafts[comment.id]?.trim()}
                          onClick={() => handleReplySubmit(comment.id)}
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-500"
                          onClick={() =>
                            setReplyDrafts((prev) => {
                              const next = { ...prev }
                              delete next[comment.id]
                              return next
                            })
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {commentsByParent[comment.id]?.length ? (
                    <div className="mt-6 space-y-4 border-l border-neutral-100 pl-6">
                      {commentsByParent[comment.id].map((reply) => (
                        <article key={reply.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                          <CommentHeader
                            comment={reply}
                            bookAuthorId={book.createdBy}
                            firebaseUserId={firebaseUser?.uid}
                            onEdit={() => startEditing(reply.id, reply.text)}
                            onDelete={() => deleteComment(book.id, reply.id)}
                          />
                          <p className="mt-2 text-sm text-neutral-800">{reply.text}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            {!comments.filter((comment) => comment.depth === 0).length && (
              <p className="text-sm text-neutral-500">No comments yet. Start the discussion.</p>
            )}
          </div>
        </section>
      </article>
    </main>
  )
}

type CommentHeaderProps = {
  comment: Comment
  bookAuthorId: string
  firebaseUserId?: string
  onEdit: () => void
  onDelete: () => void
}

const CommentHeader = ({ comment, bookAuthorId, firebaseUserId, onEdit, onDelete }: CommentHeaderProps) => (
  <>
    <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
      <span className="font-semibold text-neutral-900">{comment.userName}</span>
      {comment.userId === bookAuthorId && (
        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Author
        </span>
      )}
      <span>
        {comment.createdAt?.toDate().toLocaleString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </span>
      {comment.edited && <span className="text-xs uppercase tracking-wide text-neutral-400">Edited</span>}
    </div>
    {firebaseUserId && !comment.deleted && (
      <div className="mt-2 flex gap-3 text-xs text-neutral-500">
        {comment.userId === firebaseUserId && (
          <button type="button" className="font-semibold underline" onClick={onEdit}>
            Edit
          </button>
        )}
        {(comment.userId === firebaseUserId || bookAuthorId === firebaseUserId) && (
          <ConfirmDialog
            title="Delete Comment"
            message="Are you sure you want to delete this comment? This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={onDelete}
          >
            {({ open }) => (
              <button type="button" className="font-semibold underline hover:text-red-600" onClick={open}>
                Delete
              </button>
            )}
          </ConfirmDialog>
        )}
      </div>
    )}
  </>
)

export default ReaderPage
