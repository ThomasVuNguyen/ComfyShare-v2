"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { firebaseUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push("/signin")
    }
  }, [firebaseUser, loading, router])

  if (loading || !firebaseUser) {
    return <div className="flex min-h-screen items-center justify-center">Loading account…</div>
  }

  return <>{children}</>
}
