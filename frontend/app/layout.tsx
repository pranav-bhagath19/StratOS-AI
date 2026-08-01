import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StratOS AI — Autonomous Competitive Intelligence",
  description:
    "Turn live public-web signals into verified, recurring competitive intelligence. " +
    "Five agents research, challenge, and verify — then deliver a decisive Executive Strategic Brief.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "font-mono text-xs border-zinc-700 bg-zinc-900",
              title: "text-zinc-100",
              description: "text-zinc-500",
            },
          }}
        />
      </body>
    </html>
  )
}
