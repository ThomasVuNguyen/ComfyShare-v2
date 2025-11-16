"use client"

import { useEffect, useState } from "react"
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { generateSlug } from "@/lib/utils"
import { WritebookBook } from "@/types/writebook"

type BookUpdateInput = Partial<Omit<WritebookBook, "id">> & Record<string, unknown>

export const useBooks = (userId?: string) => {
  const [books, setBooks] = useState<WritebookBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const booksRef = collection(db, "writebook_books")
    const q = query(booksRef, where("createdBy", "==", userId), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<WritebookBook, "id">),
          }) satisfies WritebookBook,
      )
      setBooks(next)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  return { books, loading }
}

export const ensureUniqueSlug = async (title: string) => {
  const baseSlug = generateSlug(title)
  const booksRef = collection(db, "writebook_books")
  const existing = await getDocs(query(booksRef, where("slug", "==", baseSlug), limit(1)))

  if (existing.empty) return baseSlug

  let suffix = 2
  let slugCandidate = `${baseSlug}-${suffix}`

  while (!(await getDocs(query(booksRef, where("slug", "==", slugCandidate), limit(1)))).empty) {
    suffix += 1
    slugCandidate = `${baseSlug}-${suffix}`
  }

  return slugCandidate
}

export const createBook = async ({
  title,
  subtitle,
  author,
  createdBy,
}: {
  title: string
  subtitle?: string
  author?: string
  createdBy: string
}) => {
  const slug = await ensureUniqueSlug(title)
  const booksRef = collection(db, "writebook_books")
  const result = await addDoc(booksRef, {
    title,
    subtitle,
    author,
    createdBy,
    slug,
    published: false,
    everyoneAccess: true,
    theme: "blue",
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return result.id
}

export const updateBook = async (bookId: string, data: BookUpdateInput) => {
  await updateDoc(doc(db, "writebook_books", bookId), {
    ...data,
    updatedAt: new Date(),
  })
}
