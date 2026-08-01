"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        {/* StratOS AI Logo (Reference Image 1) */}
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

        {/* Right Desktop CTA Button (Reference Image 2) */}
        <div className="hidden md:flex items-center">
          <Button asChild variant="primary" size="sm">
            <Link href="/dashboard" className="flex items-center gap-1.5">
              Launch StratOS
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
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
            <div className="pt-4 border-t border-white/10">
              <Button asChild variant="primary" size="lg" className="w-full">
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
