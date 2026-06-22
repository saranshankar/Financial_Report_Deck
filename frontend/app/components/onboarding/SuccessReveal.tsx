"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, 
  Smartphone, 
  CreditCard, 
  Landmark, 
  ArrowLeftRight,
  Wallet,
  Activity,
  Sparkles,
  Percent,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { insightsApi, authApi, checkBackendHealth } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";

interface SuccessRevealProps {
  isActive: boolean;
}

export default function SuccessReveal({ isActive }: SuccessRevealProps) {
  const router = useRouter();
  
  // Steps:
  // 9: Success logo appear + scale center (0.0s - 1.0s)
  // 10: Ecosystem unified inside logo (1.0s - 2.0s)
  // 11: Logo shrink and glide to sidebar navbar position (2.0s - 2.5s)
  // 12: Dashboard mock reveal + count up + AI message (2.5s - 3.5s)
  const [step, setStep] = useState<9 | 10 | 11 | 12>(9);
  
  // Real stats loaded in background
  const [stats, setStats] = useState({
    spending: 48250,
    cashback: 2450,
    missed: 820,
    health: 75
  });
  
  // Numeric count-up progress state
  const [countProgress, setCountProgress] = useState(0);

  // Fetch real stats in background on mount
  useEffect(() => {
    if (!isActive) return;

    router.prefetch("/dashboard");

    const loadRealData = async () => {
      try {
        const health = await checkBackendHealth();
        if (health.status === "ONLINE") {
          const data = await insightsApi.getDashboardData();
          const totalCashback = data.stats.total_cashback || 0;
          const missedCashback = data.stats.missed_cashback || 0;
          const healthScore = totalCashback + missedCashback > 0 
            ? Math.round((totalCashback / (totalCashback + missedCashback)) * 100) 
            : 85;

          setStats({
            spending: data.stats.total_spending || 32800,
            cashback: totalCashback,
            missed: missedCashback,
            health: healthScore
          });
        }
      } catch (err) {
        console.error("SuccessReveal: Failed to load background data, using fallbacks.", err);
      }
    };

    loadRealData();

    // Scene timeline transitions
    const t10 = setTimeout(() => setStep(10), 1000); // 1.0s -> Scene 10
    const t11 = setTimeout(() => setStep(11), 2000); // 2.0s -> Scene 11
    const t12 = setTimeout(() => setStep(12), 2500); // 2.5s -> Scene 12
    const tEnd = setTimeout(() => {
      router.push("/dashboard");
    }, 3800); // 3.8s -> Handover to real /dashboard

    return () => {
      clearTimeout(t10);
      clearTimeout(t11);
      clearTimeout(t12);
      clearTimeout(tEnd);
    };
  }, [isActive, router]);

  // Handle numbers count up during Scene 12
  useEffect(() => {
    if (step === 12) {
      let startTimestamp: number | null = null;
      const duration = 900; // count up over 900ms

      const stepAnimation = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        setCountProgress(progress);
        if (progress < 1) {
          window.requestAnimationFrame(stepAnimation);
        }
      };

      window.requestAnimationFrame(stepAnimation);
    }
  }, [step]);

  if (!isActive) return null;

  // Mini nodes coordinates
  const miniNodes = [
    { id: "gpay", icon: <Smartphone className="w-3.5 h-3.5 text-blue-400" /> },
    { id: "phonepe", icon: <Smartphone className="w-3.5 h-3.5 text-purple-400" /> },
    { id: "paytm", icon: <Smartphone className="w-3.5 h-3.5 text-sky-400" /> },
    { id: "bhim", icon: <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: "cards", icon: <CreditCard className="w-3.5 h-3.5 text-amber-500" /> },
    { id: "banks", icon: <Landmark className="w-3.5 h-3.5 text-indigo-400" /> }
  ];

  const getMiniNodePos = (idx: number) => {
    const angle = (idx * 2 * Math.PI) / miniNodes.length;
    const r = 90; // orbit radius around central logo
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    };
  };

  // Interpolate values
  const currentSpending = Math.round(stats.spending * countProgress);
  const currentCashback = Math.round(stats.cashback * countProgress);
  const currentMissed = Math.round(stats.missed * countProgress);
  const currentHealth = Math.round(stats.health * countProgress);

  return (
    <div className="relative min-h-screen w-full bg-[#F1F3F6] overflow-hidden">
      
      {/* 1. ANIMATION SPACE LAYERS (For Scenes 9 & 10) */}
      {step <= 10 && (
        <div className="absolute inset-0 bg-[#020617] z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),rgba(2,6,23,1))]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:45px_45px] opacity-40 pointer-events-none" />

          {/* Radial shockwave rings */}
          <div className="absolute pointer-events-none flex items-center justify-center">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
                className="absolute w-52 h-52 rounded-full border border-indigo-500/20"
              />
            ))}
          </div>

          {/* CENTRAL CORE LOGO ASSEMBLY */}
          <motion.div
            animate={{ scale: step === 10 ? 1.35 : 1.1 }}
            transition={{ duration: 0.6 }}
            className="relative w-40 h-40 flex items-center justify-center"
          >
            {/* Glowing aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 blur-2xl opacity-75 animate-pulse" />
            <div className="absolute inset-4 rounded-3xl bg-[#0b0f19]/90 border border-indigo-400/20 backdrop-blur-xl flex items-center justify-center z-10">
              <BrainCircuit className="w-16 h-16 text-indigo-200 animate-pulse" />
            </div>

            {/* Ecosystem sub-nodes and lines (Scene 10) */}
            <AnimatePresence>
              {step === 10 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {miniNodes.map((node, idx) => {
                    const pos = getMiniNodePos(idx);
                    return (
                      <motion.div
                        key={node.id}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                        animate={{ x: pos.x, y: pos.y, scale: 1, opacity: 1 }}
                        exit={{ x: 0, y: 0, scale: 0 }}
                        transition={{ type: "spring", stiffness: 85, damping: 12, delay: idx * 0.06 }}
                        className="absolute w-10 h-10 rounded-full bg-[#0b0f19] border border-slate-800 flex items-center justify-center shadow-lg"
                      >
                        {node.icon}
                      </motion.div>
                    );
                  })}

                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {miniNodes.map((node, idx) => {
                      const pos = getMiniNodePos(idx);
                      return (
                        <motion.line
                          key={node.id}
                          x1="80"
                          y1="80"
                          x2={80 + pos.x}
                          y2={80 + pos.y}
                          stroke="rgba(129, 140, 248, 0.4)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                      );
                    })}
                  </svg>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Unified Statement overlay */}
          <div className="absolute bottom-16 text-center z-25">
            <AnimatePresence mode="wait">
              {step === 10 && (
                <>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.9, y: 0 }}
                    className="text-xs font-bold font-mono tracking-widest text-indigo-300 uppercase"
                  >
                    "All Financial Systems Unified"
                  </motion.h3>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 2. THE DASHBOARD TRANSFORMATION LAYER (Scenes 11 & 12) */}
      {step >= 11 && (
        <div className="relative min-h-screen w-full flex">
          
          {/* A. SIDEBAR MOCK */}
          <aside className="fixed inset-y-0 left-0 z-45 w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex">
            <div className="flex flex-col gap-8">
              {/* Logo space where central logo glides */}
              <div className="flex items-center gap-3">
                {/* Logo target holder */}
                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  {/* Gliding logo landing spot */}
                  {step === 12 && (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full bg-[#0b0f19] flex items-center justify-center"
                    >
                      <BrainCircuit className="w-5.5 h-5.5 text-indigo-200" />
                    </motion.div>
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 tracking-wide leading-none">
                    FINSIGHT <span className="text-[#2874F0]">AI</span>
                  </h1>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    Unified Intel
                  </span>
                </div>
              </div>

              {/* Mock items */}
              <nav className="flex flex-col gap-1.5 opacity-60">
                {["Dashboard", "Connect Accounts", "Transactions", "Cashback Rules"].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold border-l-4 ${idx === 0 ? 'text-[#2874F0] bg-blue-50 border-[#2874F0] rounded-r-lg' : 'text-slate-600 border-transparent'}`}>
                    <div className="h-4.5 w-4.5 bg-slate-200 rounded-md" />
                    {item}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* B. CONTENT PANEL */}
          <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
            {/* Topbar mock */}
            <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
              <div className="h-5 w-32 bg-slate-100 rounded-md" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
              </div>
            </header>

            {/* Main Area */}
            <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto relative overflow-hidden">
              
              {/* C. THE GLIDING FINSIGHT LOGO (Scene 11) */}
              {step === 11 && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  {/* Moving central logo to sidebar slot */}
                  <motion.div
                    initial={{ x: 0, y: 0, scale: 1.3 }}
                    animate={{ 
                      x: "-38.5vw", // translate precisely to the sidebar logo container coordinates
                      y: "-43.5vh", 
                      scale: 0.35 
                    }}
                    transition={{
                      duration: 0.55,
                      ease: [0.16, 1, 0.3, 1] // Apple Keynote dynamic cubic bezier ease
                    }}
                    className="relative w-28 h-28 flex items-center justify-center"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-[#0b0f19] border border-indigo-400/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                      <BrainCircuit className="w-14 h-14 text-indigo-200" />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* D. AI ASSISTANT BANNER (Scene 12) */}
              <AnimatePresence>
                {step === 12 && (
                  <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.75, type: "spring", stiffness: 85, damping: 12 }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3.5 border border-emerald-400/20"
                  >
                    <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                      <Sparkles className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase font-mono tracking-widest font-black leading-none text-emerald-100">AI Advisor Alert</h4>
                      <p className="text-sm font-bold mt-1">Found 3 savings opportunities</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* E. WIDGETS LAYOUT */}
              <AnimatePresence>
                {step === 12 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Welcome hero card */}
                    <motion.div 
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="bg-gradient-to-r from-[#2874F0] to-[#1B4FAD] rounded-2xl p-6 text-white shadow-md"
                    >
                      <h2 className="text-xl sm:text-2xl font-black">Welcome back, Demo User!</h2>
                      <p className="text-xs text-blue-100 mt-1">Your FinSight AI financial optimization engine is active and analyzing your statements.</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                          <span className="text-[9px] text-blue-200 font-bold uppercase tracking-wider block">Total Savings</span>
                          <span className="text-lg font-black">{formatCurrency(currentSpending + currentCashback)}</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                          <span className="text-[9px] text-blue-200 font-bold uppercase tracking-wider block">Active Offers</span>
                          <span className="text-lg font-black">3 Active Offers</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                          <span className="text-[9px] text-blue-200 font-bold uppercase tracking-wider block">Potential Rewards</span>
                          <span className="text-lg font-black">{formatCurrency(currentCashback + currentMissed)}</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                          <span className="text-[9px] text-blue-200 font-bold uppercase tracking-wider block">Optimization Index</span>
                          <span className="text-lg font-bold text-emerald-300">{currentHealth}%</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Widgets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Widget 1: Health score */}
                      <motion.div
                        initial={{ y: 25, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-between text-center min-h-[180px] shadow-sm"
                      >
                        <div className="w-full flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Activity className="h-4 w-4 text-[#2874F0]" />
                            Reward Health Score
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Excellent
                          </span>
                        </div>
                        
                        <div className="relative flex items-center justify-center my-2">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle cx="40" cy="40" r="30" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                            <circle cx="40" cy="40" r="30" stroke="#10B981" strokeWidth="6" fill="transparent" strokeDasharray="188.4" strokeDashoffset={188.4 - (currentHealth / 100) * 188.4} strokeLinecap="round" />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-xl font-black text-slate-800">{currentHealth}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Optimization is active on all statements.</p>
                      </motion.div>

                      {/* Widget 2: AI Advisor stream */}
                      <motion.div
                        initial={{ y: 25, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[180px] shadow-sm space-y-3"
                      >
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          AI Advisor Stream
                        </span>
                        
                        <div className="space-y-2 flex-1">
                          <div className="flex items-start gap-2 p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[10px]">
                            <Sparkles className="h-3.5 w-3.5 text-[#2874F0] shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">Switch Card for Utilities</span>
                              <p className="text-slate-500">Pay your electricity bill using Axis Ace to earn 5% cashback.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Widget 3: Savings overview */}
                      <motion.div
                        initial={{ y: 25, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[180px] shadow-sm"
                      >
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Wallet className="h-4 w-4 text-[#2874F0]" />
                          Savings Overview
                        </span>
                        
                        <div className="grid grid-cols-2 gap-4 py-2 text-left">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Cashback</span>
                            <span className="text-base font-black text-slate-800">{formatCurrency(currentCashback)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Missed Spends</span>
                            <span className="text-base font-black text-rose-600">{formatCurrency(currentMissed)}</span>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${currentHealth}%` }} />
                        </div>
                      </motion.div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </main>
          </div>

        </div>
      )}

    </div>
  );
}
