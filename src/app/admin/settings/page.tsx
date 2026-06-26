"use client"

import { AdminPageFrame } from "@/components/admin/AdminPageFrame"

export default function AdminSettingsPage() {
  return (
    <AdminPageFrame
      title="Settings"
      description="Admin settings will live here."
    >
      <div className="rounded-[2rem] border border-dashed border-[#1C1C1C]/15 bg-white/55 p-10 text-center text-sm font-semibold opacity-65 dark:border-[#F2F2F2]/15 dark:bg-[#F2F2F2]/6">
        Settings details can be added here next.
      </div>
    </AdminPageFrame>
  )
}
