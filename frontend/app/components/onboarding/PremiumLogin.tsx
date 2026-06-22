"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Mail, 
  Lock, 
  User, 
  ArrowRight
} from "lucide-react";
import { authApi } from "../../lib/api";

interface PremiumLoginProps {
  isActive: boolean;
  onSuccess: () => void;
}

export default function PremiumLogin({ isActive, onSuccess }: PremiumLoginProps) {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Spotlight coordinates
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Preload dashboard assets
  useEffect(() => {
    if (isActive) {
      router.prefetch("/dashboard");
    }
  }, [isActive, router]);

  // If already authenticated, redirect
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  }, [router]);

  // Mouse reactive tilt and spotlight tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Spotlight position
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    // 3D Tilt calculation (max 8 degrees tilt)
    const xOffset = e.clientX - rect.left - rect.width / 2;
    const yOffset = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(yOffset / (rect.height / 2)) * 6,
      y: (xOffset / (rect.width / 2)) * 6
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await authApi.register(email, password, fullName);
      } else {
        await authApi.login(email, password);
      }
      
      // Callback to trigger SuccessReveal scene animations
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please verify credentials.");
      setLoading(false);
    }
  };

  if (!isActive) return null;

  const features = [
    { title: "Cashback Intelligence", desc: "Optimize card usage for maximum rewards." },
    { title: "Budget Tracking", desc: "Set visual limits and monitor category spends." },
    { title: "Savings Goals", desc: "Grow contributions for target purchases." },
    { title: "Subscription Monitoring", desc: "Track renewals and detect recurring drafts." },
    { title: "AI Financial Advisor", desc: "Get intelligence reports on your cash flow." }
  ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#020617] overflow-hidden">
      {/* Animated luxury mesh gradients */}
      <div className="absolute top-0 -left-10 w-[450px] h-[450px] bg-purple-900/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 -right-10 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-950/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Matrix grid overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:45px_45px] opacity-40 pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {["₹", "$", "%", "AI", "Unified", "+2.5%"].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ y: 0, opacity: 0.15 }}
            animate={{ 
              y: [-15, 15, -15], 
              opacity: [0.15, 0.4, 0.15],
              rotate: [0, 8, -8, 0]
            }}
            transition={{
              duration: 5.5 + idx,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: "absolute",
              top: `${12 + idx * 13}%`,
              left: `${8 + idx * 14}%`,
            }}
            className="text-xs font-mono font-bold text-indigo-400/20"
          >
            {item}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* LEFT COLUMN: Brand typography & Statement */}
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-6 space-y-6 text-left p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center border border-indigo-400/20 shadow-lg">
              <BrainCircuit className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-widest text-white font-mono">FINSIGHT AI</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              One Dashboard. <br />Every Transaction. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                AI Powered.
              </span>
            </h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-mono">
              Unifying Multi-Payment Ecosystems
            </p>
          </div>

          {/* Features cards */}
          <div className="space-y-3 pt-2">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3 border border-slate-900 rounded-xl bg-slate-950/20 backdrop-blur-sm transition-all hover:bg-slate-950/40">
                <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{feat.title}</h4>
                  <p className="text-[11px] text-slate-400">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT COLUMN: 3D Tilt Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="lg:col-span-6 flex justify-center p-2"
        >
          <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform 0.12s cubic-bezier(0.25, 1, 0.5, 1)"
            }}
            className="w-full max-w-md bg-[#0a0f1d]/50 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden group select-text"
          >
            {/* Spotlight Glow Layer */}
            <div 
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition duration-300" 
              style={{ 
                background: `radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, rgba(129, 140, 248, 0.12), transparent 80%)` 
              }} 
            />

            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-white tracking-widest uppercase">
                {isRegister ? "Create Account" : "Access OS"}
              </h2>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 text-rose-300 text-[11px]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <AnimatePresence initial={false}>
                {isRegister && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-1"
                  >
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isRegister}
                        className="w-full h-11 pl-10 pr-4 bg-[#050810]/70 border border-slate-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="demo@finsight.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 bg-[#050810]/70 border border-slate-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 bg-[#050810]/70 border border-slate-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? "Register" : "Sign In"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Credentials tip */}
            {!isRegister && (
              <div className="mt-4 p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-[10px] text-indigo-300 flex gap-2 select-text">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-200">Demo Credentials:</span>
                  <p className="font-mono mt-0.5 text-indigo-300/80">Email: demo@finsight.ai</p>
                  <p className="font-mono text-indigo-300/80">Password: password123</p>
                </div>
              </div>
            )}

            {/* Toggle */}
            <div className="mt-5 text-center text-xs text-slate-400">
              {isRegister ? "Registered already?" : "No account yet?"}{" "}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition-colors ml-1 cursor-pointer"
              >
                {isRegister ? "Sign In" : "Register here"}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
