import slugify from "slugify"
import { Timestamp } from "firebase/firestore"

export const generateSlug = (input: string) => {
  return slugify(input, {
    lower: true,
    strict: true,
  })
}

export const formatNumber = (value: number) => new Intl.NumberFormat().format(value)

export const formatDate = (value?: Date) => {
  if (!value) return ""
  return value.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export const timestampToDate = (value?: Timestamp | Date | null) => {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (value instanceof Timestamp) return value.toDate()
  return undefined
}
