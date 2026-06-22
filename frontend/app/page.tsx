"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, ShieldCheck, Sparkles, Zap, ArrowRight } from "lucide-react";
import { Button } from "./components/ui/Button";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-between relative z-10 bg-slate-50">
      {/* Header navbar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-wider text-slate-800">
            FINSIGHT <span className="text-primary">AI</span>
          </span>
        </div>

        <Link href="/login">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Main hero area */}
      <main className="max-w-4xl w-full mx-auto px-6 py-20 text-center flex flex-col items-center justify-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold select-none">
          <Sparkles className="h-3 w-3" />
          New: Unified Credit Card Cashback Intelligence
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black text-slate-800 leading-tight">
          Unify Your Spends.<br />
          <span className="text-primary">Maximize Cashback rewards.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl">
          FinSight AI integrates transaction statement exports, CSV logs, and receipt screenshots, categorizing your purchases using Gemini to unlock hidden saving advice.
        </p>

        <div className="flex items-center gap-4 mt-4">
          <Link href="/login">
            <Button size="lg" className="flex items-center gap-2">
              Launch Platform
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </a>
        </div>

        {/* Feature Cards Showcase */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
          <div className="glass-card p-6 text-left rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Statement Aggregator</h3>
            <p className="text-xs text-slate-500">
              Directly parse PDF sheets, transaction history CSV spreadsheets, or screenshots using OCR and Gemini text extraction.
            </p>
          </div>

          <div className="glass-card p-6 text-left rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Cashback Optimization</h3>
            <p className="text-xs text-slate-500">
              Compares card cashback structures (Amazon ICICI, Axis Ace, SBI) to identify lost rewards and advise best payment selections.
            </p>
          </div>

          <div className="glass-card p-6 text-left rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Offer Simplifier Agent</h3>
            <p className="text-xs text-slate-500">
              Pass raw bank promo text and let the Gemini agent clarify eligibility conditions, spent targets, and cashback caps.
            </p>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="h-16 border-t border-slate-200 flex items-center justify-center px-6 text-xs text-slate-500 max-w-7xl w-full mx-auto">
        &copy; {new Date().getFullYear()} FinSight AI Platform. Built for Hackathons & Production.
      </footer>
    </div>
  );
}
