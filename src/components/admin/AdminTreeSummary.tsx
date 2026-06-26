"use client"

type TreeNode = {
  label: string
  value: number | string
  tone?: "primary" | "accent" | "dark"
}

type AdminTreeSummaryProps = {
  rootLabel: string
  rootValue: number | string
  branches: TreeNode[]
}

function toneClass(tone?: TreeNode["tone"]) {
  if (tone === "dark") return "border-[#1C1C1C]/20 bg-[#1C1C1C] text-[#F2F2F2] dark:border-[#F2F2F2]/20 dark:bg-[#F2F2F2] dark:text-[#1C1C1C]"
  if (tone === "accent") return "border-[#FF9F75]/50 bg-[#FF9F75]/25 text-[#1C1C1C] dark:text-[#F2F2F2]"
  return "border-[#FF6F3C]/40 bg-[#FF6F3C]/15 text-[#1C1C1C] dark:text-[#F2F2F2]"
}

export function AdminTreeSummary({ rootLabel, rootValue, branches }: AdminTreeSummaryProps) {
  return (
    <section className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-5 shadow-sm shadow-[#1C1C1C]/5 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
      <div className="flex flex-col items-center gap-5">
        <div className={`min-w-44 rounded-2xl border px-5 py-4 text-center ${toneClass("dark")}`}>
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{rootLabel}</p>
          <p className="mt-1 text-4xl font-black">{rootValue}</p>
        </div>

        <div className="h-8 w-px bg-[#FF6F3C]/45" />

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {branches.map((branch) => (
            <div key={branch.label} className="relative flex flex-col items-center">
              <div className="absolute -top-5 h-5 w-px bg-[#FF6F3C]/35" />
              <div className={`w-full rounded-2xl border px-4 py-4 text-center ${toneClass(branch.tone)}`}>
                <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{branch.label}</p>
                <p className="mt-1 text-3xl font-black">{branch.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
