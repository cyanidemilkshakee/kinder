/* eslint-disable */
import { HeartHandshake, Coffee, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DonatePage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 md:p-12">
      <div className="w-full max-w-2xl text-left space-y-12">
        
        {/* Header */}
        <div className="space-y-4">
          <HeartHandshake className="h-10 w-10 text-primary mb-2" />
          <h1 className="text-3xl font-extrabold tracking-tight">Support Kinder</h1>
          <p className="text-muted-foreground leading-relaxed">
            Kinder is built and maintained by students, for students. We don't run ads or sell your data.
          </p>
        </div>

        <div className="space-y-10">
          
          <div className="flex flex-col items-start text-left space-y-4 max-w-sm">
            <Coffee className="h-8 w-8 text-primary" />
            <h3 className="font-bold text-lg">Buy Us a Coffee</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Help us keep the servers running and the database alive. Every small contribution helps.
            </p>
            <Button className="rounded-xl gap-2 font-semibold">
              Donate ₹50 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 pt-6">
            <h3 className="font-bold text-primary text-lg">Are you a developer or designer?</h3>
            <p className="text-sm text-muted-foreground">
              We're always looking for talented students to help improve Kinder. Open an issue on GitHub or reach out to the maintainers!
            </p>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              View Source Code <ArrowRight className="h-3 w-3" />
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
