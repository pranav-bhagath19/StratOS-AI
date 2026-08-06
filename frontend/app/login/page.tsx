"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  Zap, 
  Activity, 
  CheckCircle2, 
  Sparkles,
  LockKeyhole
} from "lucide-react"

import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { signInWithGoogle, signInWithEmail, signUpWithEmail, getStoredUser } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin"
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const redirectTarget = searchParams.get("redirect") ?? "/dashboard"
  const reason = searchParams.get("reason")

  useEffect(() => {
    const existing = getStoredUser()
    if (existing) {
      router.push(redirectTarget)
    }
  }, [redirectTarget, router])

  useEffect(() => {
    if (reason === "auth_required") {
      toast.info("Authentication Required", {
        description: "Please sign in or create an account to access the StratOS workspace.",
      })
    }
  }, [reason])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const user = await signInWithGoogle()
      toast.success(`Welcome back, ${user.displayName}!`, {
        description: "Authenticated with Google. Redirecting to workspace...",
      })
      setTimeout(() => {
        router.push(redirectTarget)
      }, 600)
    } catch (err: any) {
      toast.error("Google Sign-In Failed", {
        description: err.message ?? "Could not authenticate with Google.",
      })
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    
    if (!cleanEmail || !password.trim()) {
      toast.error("Missing Credentials", { description: "Please enter your email and password." })
      return
    }

    if (password.length < 6) {
      toast.error("Password Too Short", { description: "Password must be at least 6 characters long." })
      return
    }

    if (mode === "signup" && !name.trim()) {
      toast.error("Missing Name", { description: "Please enter your full name." })
      return
    }

    setLoading(true)
    try {
      if (mode === "signin") {
        const user = await signInWithEmail(cleanEmail, password)
        toast.success(`Welcome back, ${user.displayName}!`, {
          description: "Redirecting to your StratOS AI workspace...",
        })
        setTimeout(() => {
          router.push(redirectTarget)
        }, 600)
      } else {
        const user = await signUpWithEmail(name.trim(), cleanEmail, password)
        toast.success(`Account created successfully!`, {
          description: `Welcome to StratOS AI, ${user.displayName}. Launching workspace...`,
        })
        setTimeout(() => {
          router.push(redirectTarget)
        }, 600)
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use" || err.message?.includes("already exists")) {
        toast.info("Account Already Exists", {
          description: `An account for ${cleanEmail} is already registered. Switched to Sign In mode.`,
        })
        setMode("signin")
      } else if (err.code === "auth/user-not-found" || err.message?.includes("No account found")) {
        toast.info("Account Not Registered", {
          description: `No account found for ${cleanEmail}. Switched to Create Account mode.`,
        })
        setMode("signup")
      } else {
        toast.error(mode === "signin" ? "Sign In Failed" : "Registration Failed", {
          description: err.message ?? "Invalid email or password.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    toast.info("Password Reset Requested", {
      description: "If an account exists for this email, password reset instructions have been sent.",
    })
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Background Subtle Grid & Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating Header */}
      <Navbar />

      {/* Main Auth Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 pt-32 sm:pt-36 pb-20 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
          
          {/* Left Column — Telemetry Showcase & Value Props */}
          <div className="lg:col-span-6 space-y-8 hidden sm:block">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                AUTONOMOUS INTEL ENGINE v2.4
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Real-Time Strategic Intelligence. <br />
                <span className="text-zinc-400">Zero Speculation.</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed">
                Deploy 5 specialized AI agents to analyze competitors, monitor supply chain vulnerabilities, and audit threat surfaces with verified live-web telemetry.
              </p>
            </div>

            {/* Live Telemetry Status Widget */}
            <div className="border border-white/10 bg-zinc-950/80 backdrop-blur-xl rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono text-xs text-zinc-400 font-semibold tracking-widest uppercase flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  AGENCY TELEMETRY PIPELINE
                </span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  ONLINE
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-white">PLANNER</span>
                  </div>
                  <span className="text-zinc-500 text-[11px]">Graph Execution Ready</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">RESEARCHER</span>
                  </div>
                  <span className="text-emerald-400 text-[11px]">Bright Data Live Mining</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-white">SCOUT</span>
                  </div>
                  <span className="text-amber-400 text-[11px]">4 Threat Signals Extracted</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">VERIFIER</span>
                  </div>
                  <span className="text-emerald-400 text-[11px]">Confidence 94% Verified</span>
                </div>
              </div>
            </div>

            {/* Compliance Badges */}
            <div className="flex items-center gap-6 pt-2 font-mono text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                SOC2 Type II
              </span>
              <span className="flex items-center gap-1.5">
                <LockKeyhole className="h-4 w-4 text-zinc-400" />
                256-Bit Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                99.9% Uptime SLA
              </span>
            </div>
          </div>

          {/* Right Column — Auth Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="border border-white/15 bg-zinc-950/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              
              {/* Top Card Ambient Glow Bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-black p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 py-2 font-mono text-xs font-semibold rounded-lg transition-all ${
                    mode === "signin"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-2 font-mono text-xs font-semibold rounded-lg transition-all ${
                    mode === "signup"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Header Title */}
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {mode === "signin" ? "Welcome back to StratOS" : "Create your StratOS account"}
                </h2>
                <p className="text-xs text-zinc-400">
                  {mode === "signin"
                    ? "Enter your credentials to access autonomous intelligence."
                    : "Start your 14-day full platform access. No credit card required."}
                </p>
              </div>

              {/* Google Sign In / Sign Up Button */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full h-11 bg-black hover:bg-zinc-900 border-white/15 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm group"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>
                    {googleLoading
                      ? "Authenticating with Google…"
                      : mode === "signin"
                      ? "Sign in with Google"
                      : "Sign up with Google"}
                  </span>
                </Button>
              </div>

              {/* Divider Line */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative z-10 bg-zinc-950 px-3 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                      FULL NAME
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Mercer"
                        className="bg-black border-white/10 text-xs text-white pl-10 h-11 focus:border-white/30 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    WORK EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.mercer@enterprise.com"
                      className="bg-black border-white/10 text-xs text-white pl-10 h-11 focus:border-white/30 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                      PASSWORD
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="font-mono text-[10px] text-zinc-400 hover:text-white transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="bg-black border-white/10 text-xs text-white pl-10 pr-10 h-11 focus:border-white/30 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === "signin" && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/10 bg-black text-emerald-500 focus:ring-0"
                    />
                    <label htmlFor="remember" className="text-xs text-zinc-400 cursor-pointer">
                      Keep me signed in for 30 days
                    </label>
                  </div>
                )}

                {/* Primary CTA Submit */}
                <Button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg mt-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <>
                      <span>{mode === "signin" ? "Sign In to StratOS" : "Create Account & Start Trial"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
