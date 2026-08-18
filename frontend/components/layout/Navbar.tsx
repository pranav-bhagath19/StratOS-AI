"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight, LogOut } from "lucide-react"
import { StratosBrand } from "@/components/brand/StratosBrand"
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
    { name: "About", href: "/#about" },
  ]

  return (
    <header className="fixed top-5 inset-x-0 z-50 px-4 sm:px-6 pointer-events-none font-sans">
      <div className="pointer-events-auto max-w-4xl mx-auto border border-white/10 bg-black/90 backdrop-blur-md rounded-full px-6 py-2.5 flex items-center justify-between shadow-2xl transition-all duration-300">
        <StratosBrand />

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-sans font-medium text-zinc-300">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-white transition-colors duration-150 tracking-wide text-xs font-semibold"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Desktop Actions */}
        <div className="hidden md:flex items-center gap-3 font-sans">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full">
                <span className="font-sans text-xs text-zinc-200 truncate max-w-[130px]">
                  {user.displayName}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <Button asChild variant="primary" size="sm" className="h-8 text-xs font-sans font-bold">
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  Launch StratOS
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="font-sans text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Button asChild variant="primary" size="sm" className="h-8 text-xs font-sans font-bold">
                <Link href="/dashboard" className="flex items-center gap-1.5">
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto max-w-4xl mx-auto mt-2 border border-white/10 bg-black/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl space-y-4 md:hidden font-sans"
          >
            <div className="flex flex-col gap-3 font-sans text-xs font-medium text-zinc-200 tracking-wide">
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

            <div className="pt-3 border-t border-white/10 space-y-2">
              <Button asChild variant="primary" size="lg" className="w-full font-sans text-xs font-bold">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2"
                >
                  Launch StratOS
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
