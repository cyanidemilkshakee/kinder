import { MotionModal } from "@/components/MotionModal"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

type DeckModalsProps<TProfile extends { id: string; real_name: string; photos?: string[] | null }> = {
  matchModal: {
    open: boolean
    matchedUser: TProfile | null
    matchId: string | null
  }
  closeMatchModal: (onClose?: (matchId: string) => void) => void
  reportModal: {
    open: boolean
    targetId: string | null
    targetName: string
  }
  closeReportModal: () => void
  reportReason: string
  setReportReason: (reason: string) => void
  reportLoading: boolean
  submitReport: () => void
  reportReasons: string[]
}

export function DeckModals<TProfile extends { id: string; real_name: string; photos?: string[] | null; avatar_url?: string | null }>({
  matchModal,
  closeMatchModal,
  reportModal,
  closeReportModal,
  reportReason,
  setReportReason,
  reportLoading,
  submitReport,
  reportReasons,
}: DeckModalsProps<TProfile>) {
  const router = useRouter()

  return (
    <>
      <MotionModal
        open={matchModal.open && !!matchModal.matchedUser}
        className="bg-black/70"
        panelClassName="w-full max-w-sm overflow-hidden rounded-lg border bg-background"
      >
        {matchModal.matchedUser && (
          <>
            <div className="flex flex-col items-center bg-muted/40 p-8 pb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                <div className="relative z-10 size-24 overflow-hidden rounded-full border-4 border-primary">
                  <img
                    src={matchModal.matchedUser.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${matchModal.matchedUser.id}`}
                    alt={matchModal.matchedUser.real_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">It&apos;s a Match!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You and <span className="font-semibold text-foreground">{matchModal.matchedUser.real_name}</span> liked each other
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6">
              <Button
                className="w-full rounded-lg"
                onClick={() => {
                  closeMatchModal((matchId) => router.push(`/chat/${matchId}`))
                }}
              >
                Start Chatting
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => closeMatchModal()}
              >
                Keep Swiping
              </Button>
            </div>
          </>
        )}
      </MotionModal>

      <MotionModal
        open={reportModal.open}
        placement="bottom"
        className="bg-black/60"
        panelClassName="w-full max-w-sm overflow-hidden rounded-lg border bg-background"
      >
        <div>
          <div className="border-b p-5">
            <h3 className="text-lg font-bold">Report {reportModal.targetName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Help keep Kinder safe. Select a reason:</p>
          </div>
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto p-4">
            {reportReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => setReportReason(reason)}
                className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                  reportReason === reason
                    ? "border-destructive/50 bg-destructive/10 font-medium text-foreground"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <div className="flex gap-3 border-t p-4">
            <Button
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={closeReportModal}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-lg"
              onClick={submitReport}
              disabled={!reportReason || reportLoading}
            >
              {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </div>
        </div>
      </MotionModal>
    </>
  )
}
