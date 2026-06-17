export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

export function normalizeUsername(value: string) {
  return value
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20)
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value))
}

export function usernameGuidance(value: string) {
  const username = normalizeUsername(value)

  if (!username) return "Choose a username."
  if (username.length < 3) return "Username must be at least 3 characters."
  if (username.length > 20) return "Username must be 20 characters or fewer."
  if (!USERNAME_PATTERN.test(username)) {
    return "Use lowercase letters, numbers, and underscores only."
  }

  return ""
}
