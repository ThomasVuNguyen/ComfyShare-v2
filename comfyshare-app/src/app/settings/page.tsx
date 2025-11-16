"use client"

import { FormEvent, useState } from "react"
import { AppShell } from "@/components/AppShell"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"

const SettingsPage = () => {
  const { profile, updateProfileDetails } = useAuth()
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    emailAddress: profile?.emailAddress ?? "",
    password: "",
  })
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await updateProfileDetails({
      name: form.name,
      emailAddress: form.emailAddress,
      password: form.password || undefined,
    })
    setStatus("Saved changes")
    setTimeout(() => setStatus(null), 3000)
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-3xl border border-neutral-200 bg-white p-8">
          <h1 className="text-3xl font-semibold text-neutral-900">Settings</h1>
          <p className="mt-2 text-neutral-500">Update your profile and credentials.</p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-neutral-600">Name</label>
              <input
                className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-600">Email</label>
              <input
                type="email"
                className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                value={form.emailAddress}
                onChange={(event) => setForm((prev) => ({ ...prev, emailAddress: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-600">Password</label>
              <input
                type="password"
                placeholder="Leave blank to keep current password"
                className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            <button className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white" type="submit">
              Save changes
            </button>
            {status && <p className="text-sm text-emerald-600">{status}</p>}
          </form>
        </section>
      </AppShell>
    </ProtectedRoute>
  )
}

export default SettingsPage
