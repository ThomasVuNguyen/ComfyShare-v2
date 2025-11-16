"use client"

import { ReactNode } from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import { ErrorBoundary } from "./ErrorBoundary"

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  )
}
