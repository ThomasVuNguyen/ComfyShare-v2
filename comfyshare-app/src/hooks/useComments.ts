"use client"

import { useEffect, useState } from "react"
import { Timestamp, addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type Comment = {
  id: string
  text: string
  userId: string
  userName: string
  parentCommentId?: string
  depth: number
  edited: boolean
  deleted: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export const useComments = (bookId?: string) => {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    if (!bookId) return
    const commentsRef = collection(db, "writebook_books", bookId, "comments")
    const q = query(commentsRef, orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(
        snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<Comment, "id">),
            }) satisfies Comment,
        ),
      )
    })

    return () => unsubscribe()
  }, [bookId])

  return { comments }
}

export const createComment = async (bookId: string, data: Omit<Comment, "id" | "createdAt" | "updatedAt" | "edited">) => {
  const commentsRef = collection(db, "writebook_books", bookId, "comments")
  await addDoc(commentsRef, {
    ...data,
    edited: false,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateComment = async (bookId: string, commentId: string, text: string) => {
  await updateDoc(doc(db, "writebook_books", bookId, "comments", commentId), {
    text,
    edited: true,
    updatedAt: serverTimestamp(),
  })
}

export const deleteComment = async (bookId: string, commentId: string) => {
  await updateDoc(doc(db, "writebook_books", bookId, "comments", commentId), {
    deleted: true,
    text: "[deleted]",
    updatedAt: serverTimestamp(),
  })
}
