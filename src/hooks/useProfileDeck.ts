import { useState, useCallback } from "react"
import { ProfileSwipeDirection } from "@/components/ProfilePostCard"

type TouchPoint = {
  x: number
  y: number
}

type UseProfileDeckProps<TProfile> = {
  currentProfile: TProfile | null
  onSwipeRight: (profile: TProfile) => Promise<{ matchId?: string | null; error?: string } | void>
  onSwipeLeft: (profile: TProfile) => Promise<{ error?: string } | void>
  onSuperLike: (profile: TProfile) => Promise<{ matchId?: string | null; error?: string } | void>
  onReport: (profileId: string, reason: string) => Promise<{ success: boolean }>
  onSwipeComplete: (profile: TProfile) => void
}

export function useProfileDeck<TProfile extends { id: string; real_name: string; photos?: string[] | null }>({
  currentProfile,
  onSwipeRight,
  onSwipeLeft,
  onSuperLike,
  onReport,
  onSwipeComplete,
}: UseProfileDeckProps<TProfile>) {
  const [swipingId, setSwipingId] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<ProfileSwipeDirection | null>(null)
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const [matchModal, setMatchModal] = useState<{ open: boolean; matchedUser: TProfile | null; matchId: string | null }>({
    open: false,
    matchedUser: null,
    matchId: null,
  })
  
  const [reportModal, setReportModal] = useState<{ open: boolean; targetId: string | null; targetName: string }>({
    open: false,
    targetId: null,
    targetName: "",
  })
  const [reportReason, setReportReason] = useState("")
  const [reportLoading, setReportLoading] = useState(false)

  const handleSwipe = useCallback(
    async (isRight: boolean, isSuperLike = false, direction: ProfileSwipeDirection = isRight ? "right" : "left") => {
      if (!currentProfile || swipingId) return

      setSwipingId(currentProfile.id)
      setSwipeDirection(direction)
      
      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 350))
      
      setSwipingId(null)
      setSwipeDirection(null)
      setActivePhotoIndex(0)
      
      let res: { matchId?: string | null; error?: string } | void
      if (isSuperLike) {
        res = await onSuperLike(currentProfile)
      } else if (isRight) {
        res = await onSwipeRight(currentProfile)
      } else {
        res = await onSwipeLeft(currentProfile)
      }

      if (res?.error) return

      onSwipeComplete(currentProfile)
      if (res?.matchId) {
        setMatchModal({ open: true, matchedUser: currentProfile, matchId: res.matchId })
      }
    },
    [currentProfile, swipingId, onSwipeComplete, onSuperLike, onSwipeRight, onSwipeLeft]
  )

  const handleCardSwipeCommit = useCallback((direction: ProfileSwipeDirection) => {
    if (!currentProfile) return

    if (direction === "right") {
      void handleSwipe(true, false, "right")
      return
    }

    if (direction === "left") {
      void handleSwipe(false, false, "left")
      return
    }

    if (direction === "up") {
      if (window.confirm(`Super like ${currentProfile.real_name}?`)) {
        void handleSwipe(true, true, "up")
      }
      return
    }

    setReportModal({ open: true, targetId: currentProfile.id, targetName: currentProfile.real_name })
  }, [currentProfile, handleSwipe])

  const handleNextPhoto = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    if (!currentProfile) return
    const allPhotos = currentProfile.photos?.filter(Boolean) || []
    const photoCount = allPhotos.length > 0 ? allPhotos.length : 1
    if (activePhotoIndex < photoCount - 1) {
      setActivePhotoIndex((prev) => prev + 1)
    }
  }, [currentProfile, activePhotoIndex])

  const handlePrevPhoto = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    if (activePhotoIndex > 0) {
      setActivePhotoIndex((prev) => prev - 1)
    }
  }, [activePhotoIndex])

  const handleCardTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.changedTouches[0]
    if (!touch) return
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }, [])

  const handleCardTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStart || !currentProfile) return

    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const threshold = 60

    setTouchStart(null)

    if (Math.max(absX, absY) < threshold) return

    if (absX >= absY) {
      void handleSwipe(deltaX > 0, false, deltaX > 0 ? "right" : "left")
      return
    }

    if (deltaY < 0) {
      if (window.confirm(`Super like ${currentProfile.real_name}?`)) {
        void handleSwipe(true, true, "up")
      }
      return
    }

    if (window.confirm(`Report ${currentProfile.real_name}?`)) {
      setReportModal({ open: true, targetId: currentProfile.id, targetName: currentProfile.real_name })
    }
  }, [touchStart, currentProfile, handleSwipe])

  const submitReport = useCallback(async () => {
    if (!reportReason || !reportModal.targetId) return
    
    setReportLoading(true)
    const { success } = await onReport(reportModal.targetId, reportReason)
    setReportLoading(false)
    
    if (success) {
      onSwipeComplete(currentProfile!)
    }
    
    setReportModal((prev) => ({ ...prev, open: false }))
    window.setTimeout(() => {
      setReportModal({ open: false, targetId: null, targetName: "" })
      setReportReason("")
    }, 180)
  }, [reportReason, reportModal.targetId, onReport, onSwipeComplete, currentProfile])

  const closeMatchModal = useCallback((onClose?: (matchId: string) => void) => {
    const matchId = matchModal.matchId
    setMatchModal((prev) => ({ ...prev, open: false }))
    window.setTimeout(() => {
      setMatchModal({ open: false, matchedUser: null, matchId: null })
      if (onClose && matchId) onClose(matchId)
    }, 180)
  }, [matchModal.matchId])

  const closeReportModal = useCallback(() => {
    setReportModal((prev) => ({ ...prev, open: false }))
    window.setTimeout(() => {
      setReportModal({ open: false, targetId: null, targetName: "" })
      setReportReason("")
    }, 180)
  }, [])

  return {
    swipingId,
    swipeDirection,
    activePhotoIndex,
    setActivePhotoIndex,
    matchModal,
    reportModal,
    reportReason,
    setReportReason,
    reportLoading,
    handleCardSwipeCommit,
    handleNextPhoto,
    handlePrevPhoto,
    handleCardTouchStart,
    handleCardTouchEnd,
    submitReport,
    closeMatchModal,
    closeReportModal,
  }
}
