/* eslint-disable @next/next/no-img-element */
"use client"

import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import {
  formatHabit,
} from "@/lib/profile-options"

export type PostProfile = {
  id: string
  username: string
  real_name: string
  department: string
  year: string
  gender: string
  bio: string | null
  relationship_intent: string
  relationship_intents: string[] | null
  avatar_url: string | null
  photos: string[] | null
  interest_tags: string[] | null
  food_preference?: string | null
  drinking_habit?: string | null
  smoking_habit?: string | null
  isSuperLike?: boolean
}

export type ProfileSwipeDirection = "left" | "right" | "up" | "down"

type ProfilePostCardProps = {
  profile: PostProfile
  avatarUrl: string
  photos: string[]
  activePhotoIndex: number
  onPrevPhoto: (event: React.MouseEvent) => void
  onNextPhoto: (event: React.MouseEvent) => void
  swipeDirection?: ProfileSwipeDirection | null
  onTouchStart?: (event: React.TouchEvent) => void
  onTouchEnd?: (event: React.TouchEvent) => void
}

export function ProfilePostCard({
  profile,
  avatarUrl,
  photos,
  activePhotoIndex,
  onPrevPhoto,
  onNextPhoto,
  swipeDirection,
  onTouchStart,
  onTouchEnd,
}: ProfilePostCardProps) {
  const displayPhotos = photos.length > 0 ? photos : [avatarUrl]
  const activePhoto = displayPhotos[Math.min(activePhotoIndex, displayPhotos.length - 1)]
  const swipeClass =
    swipeDirection === "right"
      ? "animate-swipe-right"
      : swipeDirection === "left"
        ? "animate-swipe-left"
        : swipeDirection === "up"
          ? "animate-swipe-up"
          : swipeDirection === "down"
            ? "animate-swipe-down"
            : ""

  return (
    <article
      className={`mx-auto grid w-full max-w-4xl touch-none grid-cols-[minmax(0,0.98fr)_minmax(145px,0.78fr)] overflow-hidden rounded-lg border bg-background shadow-xl transition-all duration-300 sm:grid-cols-[minmax(0,0.92fr)_minmax(220px,0.78fr)] xl:max-w-5xl ${swipeClass}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[4/5] min-h-0 bg-muted">
        <img
          src={activePhoto}
          alt={profile.real_name}
          className="h-full w-full object-cover"
        />

        {displayPhotos.length > 1 && (
          <div className="absolute left-1/2 top-2.5 flex w-1/2 -translate-x-1/2 gap-1.5">
            {displayPhotos.map((_, index) => (
              <span key={index} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                <span
                  className={`block h-full rounded-full bg-white transition-all duration-300 ${
                    index <= activePhotoIndex ? "w-full" : "w-0"
                  }`}
                />
              </span>
            ))}
          </div>
        )}

        {displayPhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrevPhoto}
              disabled={activePhotoIndex === 0}
              className="absolute left-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background disabled:opacity-40"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onNextPhoto}
              disabled={activePhotoIndex >= displayPhotos.length - 1}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background disabled:opacity-40"
              aria-label="Next photo"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b px-3 py-3 sm:px-5 sm:py-4">
          <img
            src={avatarUrl}
            alt={`${profile.username} avatar`}
            className="size-10 rounded-full bg-muted object-cover sm:size-12"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold leading-tight sm:text-base">{profile.real_name}</h2>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">@{profile.username}</p>
          </div>
          {profile.isSuperLike && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Star className="h-3.5 w-3.5" />
              Super
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-start gap-4 px-3 py-5 sm:px-5 sm:py-6">

          <div>
            <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">About</p>
            <p className="mt-2 line-clamp-3 text-[13px] font-normal leading-relaxed text-foreground">
              {profile.bio || "No bio yet."}
            </p>
          </div>

          <div>
            <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">Academics</p>
            <p className="mt-2 text-[13px] font-normal leading-relaxed text-foreground">
              {profile.department} / {profile.year} Year
            </p>
          </div>

          <div>
            <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">Food & habits</p>
            <p className="mt-2 line-clamp-3 text-[13px] font-normal leading-relaxed text-foreground">
              Food: {formatHabit(profile.food_preference)} / Drinking: {formatHabit(profile.drinking_habit)} / Smoking: {formatHabit(profile.smoking_habit)}
            </p>
          </div>

          {profile.interest_tags && profile.interest_tags.length > 0 && (
            <div>
              <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">Interests</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {profile.interest_tags.slice(0, 8).map((tag) => (
                  <span key={tag} className="text-[13px] font-normal leading-relaxed text-foreground">
                    {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
