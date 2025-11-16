"use client"

import { useEffect, useState } from "react"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { WritebookLeaf } from "@/types/writebook"
import { generateSlug } from "@/lib/utils"

export const useLeaves = (bookId?: string) => {
  const [leaves, setLeaves] = useState<WritebookLeaf[]>([])

  useEffect(() => {
    if (!bookId) return

    const leavesRef = collection(db, "writebook_books", bookId, "leaves")
    const q = query(leavesRef, orderBy("position", "asc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaves(
        snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<WritebookLeaf, "id">),
            }) satisfies WritebookLeaf,
        ),
      )
    })

    return () => unsubscribe()
  }, [bookId])

  return { leaves }
}

export const createLeaf = async (bookId: string, data: { title: string; content: string; position: number }) => {
  const leavesRef = collection(db, "writebook_books", bookId, "leaves")
  await addDoc(leavesRef, {
    title: data.title,
    type: "page",
    body: { content: data.content },
    slug: generateSlug(data.title || "untitled"),
    position: data.position,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

export const updateLeaf = async (
  bookId: string,
  leafId: string,
  data: Partial<{ title: string; content: string; position: number }>,
) => {
  const docRef = doc(db, "writebook_books", bookId, "leaves", leafId)
  await updateDoc(docRef, {
    ...(data.title ? { title: data.title, slug: generateSlug(data.title) } : {}),
    ...(data.content ? { "body.content": data.content } : {}),
    ...(typeof data.position === "number" ? { position: data.position } : {}),
    updatedAt: new Date(),
  })
}

export const deleteLeaf = async (bookId: string, leafId: string) => {
  await deleteDoc(doc(db, "writebook_books", bookId, "leaves", leafId))
}
