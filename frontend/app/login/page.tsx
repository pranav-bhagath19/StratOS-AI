"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
  LockKeyhole
} from "lucide-react"

import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInWithGoogle, signInWithEmail, signUpWithEmail, getStoredUser } from "@/lib/auth"

function LoginContent() {
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const user = await signInWithGoogle()
      setTimeout(() => {
        router.push(redirectTarget)
      }, 600)
    } catch {
      // error handled in auth
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    
    if (!cleanEmail || !password.trim()) return

    setLoading(true)
    try {
      if (mode === "signin") {
        await signInWithEmail(cleanEmail, password)
        setTimeout(() => {
          router.push(redirectTarget)
        }, 600)
      } else {
        await signUpWithEmail(name.trim(), cleanEmail, password)
        setTimeout(() => {
          router.push(redirectTarget)
        }, 600)
      }
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 pt-32 sm:pt-36 pb-20 flex items-center justify-center font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
        {/* Left Column — Telemetry Showcase */}
        <div className="lg:col-span-6 space-y-8 hidden sm:block">
          <div className="space-y-4">
            <span className="font-mono text-[10px] text-zinc-400 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
              AUTONOMOUS INTEL ENGINE
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
              Real-Time Strategic Intelligence.
            </h1>
            <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
              Deploy 5 specialized AI agents to analyze competitors and monitor supply chain vulnerabilities with live-web telemetry.
            </p>
          </div>

          <div className="border border-white/10 bg-black p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs">
              <span className="text-zinc-400 font-bold uppercase tracking-wider">
                5-AGENT PIPELINE
              </span>
              <span className="text-emerald-400">ONLINE</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950">
                <span className="font-bold text-white">PLANNER</span>
                <span className="text-zinc-500">Execution Ready</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950">
                <span className="font-bold text-white">RESEARCHER</span>
                <span className="text-emerald-400">Live Mining</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950">
                <span className="font-bold text-white">SCOUT</span>
                <span className="text-amber-400">Signals Extracted</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950">
                <span className="font-bold text-white">VERIFIER</span>
                <span className="text-emerald-400">Confidence Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Auth Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="border border-white/10 bg-black rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 font-bold rounded transition-colors ${
                  mode === "signin" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 font-bold rounded transition-colors ${
                  mode === "signup" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {mode === "signin" ? "Welcome back to StratOS" : "Create your StratOS account"}
              </h2>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full h-11 font-mono text-xs"
            >
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
            </Button>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-zinc-400 font-bold uppercase block">
                    FULL NAME
                  </label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="bg-zinc-950 border-white/10 text-xs text-white h-10 font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-zinc-400 font-bold uppercase block">
                  WORK EMAIL
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.mercer@enterprise.com"
                  className="bg-zinc-950 border-white/10 text-xs text-white h-10 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-zinc-400 font-bold uppercase block">
                  PASSWORD
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-zinc-950 border-white/10 text-xs text-white h-10 font-mono"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || googleLoading}
                variant="primary"
                size="lg"
                className="w-full h-11 font-mono font-bold text-xs"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      <Navbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center font-mono text-xs text-zinc-500">Loading auth workspace…</div>}>
        <LoginContent />
      </Suspense>
      <Footer />
    </div>
  )
}

