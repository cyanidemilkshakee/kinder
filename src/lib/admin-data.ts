import {
  formatRelationshipIntent,
  normalizeRelationshipIntents,
  type RelationshipIntent,
} from "@/lib/profile-options"

export type AdminProfile = {
  id: string
  email: string | null
  username: string | null
  real_name: string | null
  department: string | null
  year: string | null
  gender: string | null
  bio: string | null
  relationship_intent: string | null
  relationship_intents: string[] | null
  avatar_url: string | null
  photos: string[] | null
  role: string | null
  is_visible: boolean | null
  is_suspended: boolean | null
  ban_expires_at: string | null
  interest_tags: string[] | null
  food_preference: string | null
  drinking_habit: string | null
  smoking_habit: string | null
  created_at: string | null
}

export type IntentBucket = "friendship" | "dating" | "both" | "unknown"

export function getProfileIntents(profile: Pick<AdminProfile, "relationship_intent" | "relationship_intents">): RelationshipIntent[] {
  return normalizeRelationshipIntents(profile.relationship_intents, profile.relationship_intent || "friendship")
}

export function getIntentBucket(profile: Pick<AdminProfile, "relationship_intent" | "relationship_intents">): IntentBucket {
  const intents = getProfileIntents(profile)
  const hasFriendship = intents.includes("friendship")
  const hasDating = intents.includes("dating")

  if (hasFriendship && hasDating) return "both"
  if (hasFriendship) return "friendship"
  if (hasDating) return "dating"
  return "unknown"
}

export function formatIntentBucket(bucket: IntentBucket) {
  if (bucket === "both") return "Both"
  if (bucket === "unknown") return "Unknown"
  return formatRelationshipIntent(bucket)
}

export function getDisplayName(profile?: Partial<AdminProfile> | null) {
  return profile?.real_name || profile?.username || profile?.email || "Unknown profile"
}

export function getProfileAvatar(profile?: Partial<AdminProfile> | null) {
  return profile?.avatar_url || (profile?.id ? `https://api.dicebear.com/9.x/micah/svg?seed=${profile.id}` : "")
}

export function toPostProfile(profile: AdminProfile) {
  return {
    id: profile.id,
    username: profile.username || "unknown",
    real_name: getDisplayName(profile),
    department: profile.department || "Unknown department",
    year: profile.year || "Unknown",
    gender: profile.gender || "Unspecified",
    bio: profile.bio,
    relationship_intent: profile.relationship_intent || "friendship",
    relationship_intents: profile.relationship_intents || [],
    avatar_url: getProfileAvatar(profile),
    photos: profile.photos || [],
    interest_tags: profile.interest_tags || [],
    food_preference: profile.food_preference,
    drinking_habit: profile.drinking_habit,
    smoking_habit: profile.smoking_habit,
  }
}

export const ADMIN_PROFILE_SELECT = [
  "id",
  "email",
  "username",
  "real_name",
  "department",
  "year",
  "gender",
  "bio",
  "relationship_intent",
  "relationship_intents",
  "avatar_url",
  "photos",
  "role",
  "is_visible",
  "is_suspended",
  "ban_expires_at",
  "interest_tags",
  "food_preference",
  "drinking_habit",
  "smoking_habit",
  "created_at",
].join(", ")
