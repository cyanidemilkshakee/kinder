/* eslint-disable */
import { HeartHandshake, Coffee, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DonatePage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      <div className="w-full max-w-2xl mx-auto rounded-2xl border border-border overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent p-8 md:p-12 text-center border-b border-border">
          <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6">
            <HeartHandshake className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Support Kinder</h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Kinder is built and maintained by students, for students. We don't run ads or sell your data.
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col items-center text-center hover:border-primary/40 transition-colors">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4">
                <Coffee className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Buy Us a Coffee</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
                Help us keep the servers running and the database alive. Every small contribution helps.
              </p>
              <Button className="w-full rounded-xl gap-2 font-semibold">
                Donate ₹50 <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-muted/20 border border-border rounded-2xl p-6 flex flex-col items-center text-center opacity-60">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl">🌟</span>
              </div>
              <h3 className="font-bold mb-2">Premium (Coming Soon)</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
                We're working on some cool perks like read receipts and extra super likes.
              </p>
              <Button variant="outline" className="w-full rounded-xl font-semibold" disabled>
                Join Waitlist
              </Button>
            </div>
          </div>

          <div className="rounded-2xl p-6 text-center border-l-4 border-primary bg-primary/5 border border-primary/20">
            <h3 className="font-bold text-primary mb-2 text-lg">Are you a developer or designer?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're always looking for talented students to help improve Kinder. Open an issue on GitHub or reach out to the maintainers!
            </p>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline">
              View Source Code →
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
