/**
 * Validation utilities for user inputs
 */

/**
 * Validates DOI format
 * DOI format: 10.XXXX/suffix
 */
export function isValidDOI(doi: string): boolean {
  if (!doi || typeof doi !== 'string') return false

  // Trim whitespace
  const trimmed = doi.trim()

  // DOI must start with "10."
  if (!trimmed.startsWith('10.')) return false

  // Must have a slash separator
  if (!trimmed.includes('/')) return false

  // Basic pattern: 10.XXXX/YYYY where XXXX is 4+ digits and YYYY is any suffix
  const doiPattern = /^10\.\d{4,}(\.\d+)*\/[^\s]+$/
  return doiPattern.test(trimmed)
}

/**
 * Validates file size (max 5MB for images)
 */
export function isValidImageSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validates if file is an image
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Validates slug format (URL-safe string)
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false

  // Slug should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with hyphen
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugPattern.test(slug)
}

/**
 * Validates title (not empty, reasonable length)
 */
export function isValidTitle(title: string): boolean {
  if (!title || typeof title !== 'string') return false

  const trimmed = title.trim()
  return trimmed.length > 0 && trimmed.length <= 500
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!password || typeof password !== 'string') {
    errors.push('Password is required')
    return { isValid: false, errors }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
