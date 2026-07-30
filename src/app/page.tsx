import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/30`}>
      <header className="flex items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            I
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Impressio
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Print Management Platform
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Manage orders, track production, and streamline your printing workflow — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start free trial
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-input bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Sign in
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Impressio. All rights reserved.
      </footer>
    </div>
  );
}
