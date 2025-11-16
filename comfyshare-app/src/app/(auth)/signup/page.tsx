"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore"

const SignUpPage = () => {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(credential.user, { displayName: form.name })

      const profileRef = doc(collection(db, "writebook_users"), credential.user.uid)
      await setDoc(profileRef, {
        userId: credential.user.uid,
        name: form.name,
        emailAddress: form.email,
        role: "member",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-white backdrop-blur">
        <h1 className="text-3xl font-semibold">Create your Writebook</h1>
        <p className="mt-2 text-sm text-neutral-300">Publish instantly, import via DOI, and start conversations.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm text-neutral-300">Name</label>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>
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
              minLength={8}
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
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

export default SignUpPage
