"use client"

import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  User,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  updateProfile,
  signOut,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore"

export type WritebookRole = "member" | "administrator"

export type WritebookUserProfile = {
  userId: string
  name: string
  emailAddress: string
  role: WritebookRole
  createdAt?: Date
  updatedAt?: Date
}

type AuthContextValue = {
  firebaseUser: User | null
  profile: WritebookUserProfile | null
  loading: boolean
  signOutUser: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfileDetails: (input: {
    name?: string
    emailAddress?: string
    password?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<WritebookUserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const hydrateProfile = useCallback(async (user: User) => {
    const profileRef = doc(collection(db, "writebook_users"), user.uid)
    const snap = await getDoc(profileRef)

    if (snap.exists()) {
      const data = snap.data()
      setProfile({
        userId: user.uid,
        name: data.name,
        emailAddress: data.emailAddress,
        role: data.role ?? "member",
        createdAt: data.createdAt?.toDate?.(),
        updatedAt: data.updatedAt?.toDate?.(),
      })
    } else {
      const defaultProfile: WritebookUserProfile = {
        userId: user.uid,
        name: user.displayName || "Researcher",
        emailAddress: user.email || "",
        role: "member",
      }
      await setDoc(profileRef, {
        ...defaultProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true,
      })
      setProfile(defaultProfile)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        await hydrateProfile(user)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [hydrateProfile])

  const signOutUser = useCallback(async () => {
    await signOut(auth)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      await hydrateProfile(firebaseUser)
    }
  }, [firebaseUser, hydrateProfile])

  const updateProfileDetails = useCallback<AuthContextValue["updateProfileDetails"]>(
    async ({ name, emailAddress, password }) => {
      if (!firebaseUser) return
      const profileRef = doc(collection(db, "writebook_users"), firebaseUser.uid)

      if (name && name !== profile?.name) {
        await updateProfile(firebaseUser, { displayName: name })
      }

      if (emailAddress && emailAddress !== firebaseUser.email) {
        await updateEmail(firebaseUser, emailAddress)
      }

      if (password) {
        await updatePassword(firebaseUser, password)
      }

      await updateDoc(profileRef, {
        ...(name ? { name } : {}),
        ...(emailAddress ? { emailAddress } : {}),
        updatedAt: serverTimestamp(),
      })

      await refreshProfile()
    },
    [firebaseUser, profile?.name, refreshProfile],
  )

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      signOutUser,
      refreshProfile,
      updateProfileDetails,
    }),
    [firebaseUser, profile, loading, signOutUser, refreshProfile, updateProfileDetails],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
