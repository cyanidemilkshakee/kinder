 
"use client"

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
      <h3 className="text-xl font-bold text-foreground mb-2">Your Messages</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Select a match from the sidebar to start chatting.
      </p>
    </div>
  )
}
