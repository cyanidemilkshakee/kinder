"use client"

import { Loader2 } from "lucide-react"

type AdminPageFrameProps = {
  title: string
  description: string
  loading?: boolean
  error?: string | null
  children: React.ReactNode
}

export function AdminPageFrame({ title, description, loading, error, children }: AdminPageFrameProps) {
  return (
    <div className="min-h-full px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-6 shadow-sm shadow-[#1C1C1C]/5 backdrop-blur dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6F3C]">Admin dashboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-70">{description}</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-[#CC4C1A]/30 bg-[#FF6F3C]/10 px-4 py-3 text-sm font-semibold text-[#CC4C1A] dark:text-[#FF9F75]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-[2rem] border border-[#1C1C1C]/10 bg-white/55 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
            <Loader2 className="size-8 animate-spin text-[#FF6F3C]" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
