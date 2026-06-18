export type RelationshipIntent = "friendship" | "dating"

export const RELATIONSHIP_INTENTS: { value: RelationshipIntent; label: string; description: string }[] = [
  {
    value: "friendship",
    label: "Friendship",
    description: "Looking to expand your social circle on campus",
  },
  {
    value: "dating",
    label: "Dating",
    description: "Open to romantic connections with like-minded people",
  },
]

export const DEPARTMENTS = [
  "CSE",
  "ISE",
  "ECE",
  "EEE",
  "ME",
  "Civil",
  "Chemical",
  "Bio-Technology",
  "AI & ML",
  "AI & DS",
  "Cyber Security",
  "MCA",
  "MBA",
  "Other",
]

export const YEARS = ["1st", "2nd", "3rd", "4th"]

export const INTEREST_TAGS = [
  "Anime",
  "Gym",
  "Music",
  "Reading",
  "Gaming",
  "Photography",
  "Travel",
  "Art",
  "Coding",
  "Movies",
  "Sports",
  "Dance",
  "Foodie",
  "Tech",
  "Fashion",
  "Night Owl",
]

export const FOOD_HABIT_OPTIONS = [
  "Vegetarian",
  "Non-vegetarian",
  "Eggetarian",
  "Vegan",
  "No preference",
]

export const DRINKING_HABIT_OPTIONS = [
  "No",
  "Occasionally",
  "Yes",
  "Prefer not to say",
]

export const SMOKING_HABIT_OPTIONS = [
  "No",
  "Occasionally",
  "Yes",
  "Prefer not to say",
]

export const DOESNT_MATTER = "Doesn't matter"
export const DEFAULT_FOOD_HABIT = "No preference"
export const DEFAULT_DISCLOSURE_HABIT = "Prefer not to say"

const VALID_RELATIONSHIP_INTENTS = new Set<string>(
  RELATIONSHIP_INTENTS.map((intent) => intent.value)
)

export function normalizeRelationshipIntents(
  relationshipIntents?: string[] | null,
  relationshipIntent?: string | null
): RelationshipIntent[] {
  const source =
    relationshipIntents && relationshipIntents.length > 0
      ? relationshipIntents
      : relationshipIntent
        ? [relationshipIntent]
        : []

  const normalized = source.filter((intent): intent is RelationshipIntent =>
    VALID_RELATIONSHIP_INTENTS.has(intent)
  )

  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["friendship"]
}

export function formatRelationshipIntent(intent: RelationshipIntent) {
  return RELATIONSHIP_INTENTS.find((option) => option.value === intent)?.label ?? intent
}

export function formatHabit(value?: string | null) {
  return value && value.trim() ? value : "Not shared"
}
