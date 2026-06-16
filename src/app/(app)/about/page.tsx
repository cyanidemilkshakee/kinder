/* eslint-disable */
import { Info, Shield, Heart, Zap, Lock } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      <div className="w-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent p-8 md:p-12 text-center border-b border-border">
          <div className="mx-auto h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Info className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-3">About Kinder</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Kinder is an unofficial, student-built platform designed to foster meaningful connections in a safe, verified college environment.
          </p>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold border-b border-border pb-2">Why Kinder?</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Meeting new people outside of your department or standard social circles can be hard. Traditional dating apps feel unsafe, saturated with fake profiles, or geographically disconnected. Kinder solves this by limiting access strictly to verified college students, ensuring that the people you talk to are actual peers on campus.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">Core Principles</h2>
            
            <div className="grid gap-5">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Verified & Safe</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Every user must verify their college email. We have zero tolerance for impersonation or harassment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Privacy First</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your profile is completely hidden from the public internet. Only authenticated students can view profiles in the discovery pool. Hookup intent is strictly opt-in and mutually restricted.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Meaningful Interactions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    With limited daily super likes and mutual-consent matching, we encourage quality interactions over endless swiping.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-muted/50 rounded-xl p-6 text-center border border-border">
            <Heart className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-sm font-medium">
              Made with love by fellow students.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Not affiliated with college administration.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
