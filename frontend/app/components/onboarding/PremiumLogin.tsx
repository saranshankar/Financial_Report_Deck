"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, 
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

  // Spotlight and Tilt variables
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Spotlight position
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    // 3D Tilt calculation (max 6 degrees tilt)
    const xOffset = e.clientX - rect.left - rect.width / 2;
    const yOffset = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(yOffset / (rect.height / 2)) * 5,
      y: (xOffset / (rect.width / 2)) * 5
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
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please check credentials.");
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#02040d] overflow-hidden">
      {/* Dark Shifting Nebula Backgrounds */}
      <div className="absolute top-0 -left-10 w-[450px] h-[450px] bg-purple-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-10 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[130px] pointer-events-none" />
      
      {/* Drifting subtle stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
          const size = Math.random() * 2 + 1;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          return (
            <motion.div
              key={i}
              animate={{ opacity: [0.15, 0.45, 0.15] }}
              transition={{ duration: 4 + Math.random() * 4, repeat: Infinity }}
              style={{ width: size, height: size, top: `${top}%`, left: `${left}%` }}
              className="absolute rounded-full bg-white/20 blur-[0.5px]"
            />
          );
        })}
      </div>

      {/* Grid constellations */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30 pointer-events-none" />

      {/* Main Layout Centered Content */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-12 py-6">
        
        {/* Left Column: Minimal Brand Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 space-y-6 text-left max-w-lg p-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center border border-indigo-400/20 shadow-lg animate-pulse">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold tracking-widest text-white font-mono">FINSIGHT AI</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              One Dashboard. <br />Every Transaction. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                AI Powered.
              </span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono mt-4 block">
              Unified Financial Operating System
            </p>
          </div>
        </motion.div>

        {/* Right Column: Premium Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="flex-1 w-full max-w-md p-2"
        >
          <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform 0.1s ease-out"
            }}
            className="w-full bg-[#070b16]/40 border border-white/5 rounded-2xl p-8 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group"
          >
            {/* Spotlight glow layer */}
            <div 
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition duration-300" 
              style={{ 
                background: `radial-gradient(320px circle at ${spotlight.x}px ${spotlight.y}px, rgba(129, 140, 248, 0.12), transparent 85%)` 
              }} 
            />

            <div className="text-center mb-6">
              <h2 className="text-lg font-black text-white tracking-widest uppercase">
                {isRegister ? "Create Account" : "Access deck"}
              </h2>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 text-rose-300 text-[10px]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Register only) */}
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
                        className="w-full h-11 pl-10 pr-4 bg-[#05080f]/80 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all"
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
                    className="w-full h-11 pl-10 pr-4 bg-[#05080f]/80 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all"
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
                    className="w-full h-11 pl-10 pr-4 bg-[#05080f]/80 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* CTA Action Button */}
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
              <div className="mt-4 p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-[9.5px] text-indigo-300 flex gap-2 select-text">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-200">Demo Account Details:</span>
                  <p className="font-mono mt-0.5 text-indigo-300/80">Email: demo@finsight.ai</p>
                  <p className="font-mono text-indigo-300/80">Password: password123</p>
                </div>
              </div>
            )}

            {/* Form Toggle */}
            <div className="mt-5 text-center text-xs text-slate-400">
              {isRegister ? "Already registered?" : "New to FinSight?"}{" "}
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
