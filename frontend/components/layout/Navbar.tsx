"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight, LogIn, LogOut, User as UserIcon } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { getStoredUser, signOutUser, UserProfile } from "@/lib/auth"
import { toast } from "sonner"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
    const handleStorage = () => setUser(getStoredUser())
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const handleSignOut = async () => {
    await signOutUser()
    setUser(null)
    toast.success("Signed Out", { description: "You have been logged out of StratOS AI." })
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Platform", href: "/#platform" },
    { name: "Intelligence", href: "/#intelligence" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/pricing" },
  ]

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6 pointer-events-none font-sans">
      {/* Floating Capsule Bar */}
      <div className="pointer-events-auto max-w-5xl mx-auto border border-white/10 bg-black/85 backdrop-blur-xl rounded-full px-5 py-2 flex items-center justify-between shadow-2xl transition-all duration-300">
        {/* StratOS AI Logo */}
        <Logo />

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-white transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-white/15 px-3 py-1 rounded-full shadow-lg backdrop-blur-md">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    referrerPolicy="no-referrer"
                    className="h-6 w-6 rounded-full object-cover border border-white/20 shrink-0 shadow-sm"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = "/avatar.png"
                    }}
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-sm">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <span className="font-mono text-xs text-white font-semibold max-w-[160px] truncate" title={user.displayName}>
                  {user.displayName}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <Button asChild variant="primary" size="sm">
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="font-mono text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5 text-zinc-400" />
                Sign In
              </Link>
              <Button asChild variant="primary" size="sm">
                <Link href="/login?redirect=/dashboard&reason=auth_required" className="flex items-center gap-1.5">
                  Launch StratOS
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-zinc-400 hover:text-white focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto max-w-5xl mx-auto mt-2 border border-white/10 bg-black/95 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl space-y-4 md:hidden"
          >
            <div className="flex flex-col gap-3 font-medium text-sm text-zinc-300">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center justify-between py-2 px-1 text-xs text-zinc-300">
                    <span className="font-mono">{user.displayName}</span>
                    <button onClick={handleSignOut} className="text-zinc-400 hover:text-white text-xs underline">
                      Sign Out
                    </button>
                  </div>
                  <Button asChild variant="primary" size="lg" className="w-full">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2"
                    >
                      Open Workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2 font-mono text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 rounded-xl"
                  >
                    Sign In / Register
                  </Link>
                  <Button asChild variant="primary" size="lg" className="w-full">
                    <Link
                      href="/login?redirect=/dashboard&reason=auth_required"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2"
                    >
                      Launch StratOS
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
