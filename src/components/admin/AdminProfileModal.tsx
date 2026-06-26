"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { ProfilePostCard } from "@/components/ProfilePostCard"
import { Button } from "@/components/ui/button"
import { getProfileAvatar, toPostProfile, type AdminProfile } from "@/lib/admin-data"

type AdminProfileModalProps = {
  profile: AdminProfile | null
  onClose: () => void
}

export function AdminProfileModal({ profile, onClose }: AdminProfileModalProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  if (!profile) return null

  const avatar = getProfileAvatar(profile)
  const photos = profile.photos?.length ? profile.photos : [avatar]
  const postProfile = toPostProfile(profile)

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="absolute -right-2 -top-12 z-10 rounded-full"
          aria-label="Close profile card"
        >
          <X className="size-4" />
        </Button>
        <ProfilePostCard
          profile={postProfile}
          avatarUrl={avatar}
          photos={photos}
          activePhotoIndex={activePhotoIndex}
          onPrevPhoto={(event) => {
            event.stopPropagation()
            setActivePhotoIndex((index) => Math.max(0, index - 1))
          }}
          onNextPhoto={(event) => {
            event.stopPropagation()
            setActivePhotoIndex((index) => Math.min(photos.length - 1, index + 1))
          }}
        />
      </div>
    </div>
  )
}
