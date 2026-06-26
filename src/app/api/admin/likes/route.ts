import { NextResponse } from "next/server"
import { ADMIN_PROFILE_SELECT, getIntentBucket, type AdminProfile, type IntentBucket } from "@/lib/admin-data"
import { requireAdminClient } from "@/lib/admin-server"

type RawLike = {
  id: string
  swiper_id: string
  swiped_id: string
  is_right_swipe: boolean
  created_at: string
  swiper: AdminProfile
  swiped: AdminProfile
}

type AdminLikePayload = RawLike & {
  is_super_like: boolean
  intent_bucket: IntentBucket
}

export async function GET() {
  const auth = await requireAdminClient()
  if (auth.error) return auth.error

  const profileFields = ADMIN_PROFILE_SELECT
  const [swipesRes, superLikesRes, matchesRes] = await Promise.all([
    auth.supabase
      .from("swipes")
      .select(`
        id,
        swiper_id,
        swiped_id,
        is_right_swipe,
        created_at,
        swiper:profiles!swiper_id(${profileFields}),
        swiped:profiles!swiped_id(${profileFields})
      `)
      .eq("is_right_swipe", true)
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("super_likes")
      .select("sender_id, receiver_id"),
    auth.supabase
      .from("matches")
      .select(`
        id,
        user1_id,
        user2_id,
        created_at,
        user1:profiles!user1_id(${profileFields}),
        user2:profiles!user2_id(${profileFields})
      `)
      .order("created_at", { ascending: false }),
  ])

  const firstError = swipesRes.error || superLikesRes.error || matchesRes.error
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 })
  }

  const superLikePairs = new Set(
    (superLikesRes.data || []).map((like) => `${like.sender_id}:${like.receiver_id}`),
  )
  const likes: AdminLikePayload[] = ((swipesRes.data || []) as unknown as RawLike[]).map((like) => ({
    ...like,
    is_super_like: superLikePairs.has(`${like.swiper_id}:${like.swiped_id}`),
    intent_bucket: getIntentBucket(like.swiper),
  }))
  const matches = matchesRes.data || []

  const stats = {
    totalLikes: likes.length,
    friendshipLikes: likes.filter((like) => like.intent_bucket === "friendship").length,
    datingLikes: likes.filter((like) => like.intent_bucket === "dating").length,
    bothLikes: likes.filter((like) => like.intent_bucket === "both").length,
    matches: matches.length,
  }

  return NextResponse.json({ likes, matches, stats })
}
