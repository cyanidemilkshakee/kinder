"use client"

import { getDisplayName, getProfileAvatar, type AdminProfile } from "@/lib/admin-data"

type AdminProfileButtonProps = {
  profile: AdminProfile | null
  onClick: (profile: AdminProfile) => void
}

export function AdminProfileButton({ profile, onClick }: AdminProfileButtonProps) {
  if (!profile) {
    return <span className="text-sm font-semibold opacity-50">Unknown profile</span>
  }

  return (
    <button
      type="button"
      onClick={() => onClick(profile)}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#1C1C1C]/10 bg-white/75 px-2.5 py-1.5 text-left text-sm font-bold transition hover:border-[#FF6F3C]/50 hover:bg-[#FF6F3C]/10 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/8"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getProfileAvatar(profile)} alt="" className="size-7 rounded-full object-cover" />
      <span className="min-w-0 truncate">{getDisplayName(profile)}</span>
    </button>
  )
}
