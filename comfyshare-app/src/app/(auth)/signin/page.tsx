"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"

const SignInPage = () => {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (firebaseUser) {
      router.push("/dashboard")
    }
  }, [firebaseUser, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-white backdrop-blur">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-neutral-300">Sign in to keep shipping papers and replying to readers.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm text-neutral-300">Email address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          {error && <p className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-white px-4 py-3 text-base font-semibold text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-400">
          Need an account?{" "}
          <Link href="/signup" className="font-semibold text-white underline">
            Create Writebook profile
          </Link>
        </p>
      </div>
    </main>
  )
}

export default SignInPage
