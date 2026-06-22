"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  CreditCard, 
  Wallet, 
  Landmark, 
  ArrowLeftRight,
  BrainCircuit
} from "lucide-react";

interface PaymentNode {
  id: string;
  name: string;
  color: string;
  glow: string;
  icon: React.ReactNode;
  startX: number;
  startY: number;
  scatterX: number;
  scatterY: number;
  scale: number;
  depth: number;
}

interface EcosystemIntroProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function EcosystemIntro({ isActive, onComplete }: EcosystemIntroProps) {
  // Timeline phases:
  // 1: Chaos - Floating scattered nodes in Galaxy (0.0s - 2.5s)
  // 2: Constellation - Neural connections form directly between scattered nodes (2.5s - 4.5s)
  // 3: Black Hole - Singularity pull and suction (4.5s - 6.5s)
  // 4: Logo Forge - Singularity collapse & logo forge (6.5s - 8.0s)
  // 5: Tagline - Brand statement reveal (8.0s - 9.5s)
  // 6: Hyperspace - Logo shift and triangular transition beam (9.5s - 10.0s)
  const [subScene, setSubScene] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [visibleCount, setVisibleCount] = useState(0);

  // Generate 9 payment nodes with random coordinates and start trajectories
  const nodes = useMemo<PaymentNode[]>(() => {
    const brands = [
      { 
        id: "gpay", 
        name: "GPay", 
        color: "bg-[#1e293b]/75 border-[#4285F4]/40 text-[#4285F4]", 
        glow: "rgba(66, 133, 244, 0.4)",
        icon: (
          <svg className="w-5 h-5 animate-pulse" viewBox="0 0 40 40" fill="none">
            <path d="M28.7 20c0-.7-.1-1.3-.2-1.9H20v3.7h4.9c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6z" fill="#4285F4"/>
            <path d="M20 29c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.9.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H12v2.3C13.5 26.9 16.5 29 20 29z" fill="#34A853"/>
            <path d="M14.9 21.6c-.2-.6-.3-1.2-.3-1.6s.1-1 .3-1.6V16H12c-.7 1.3-1 2.7-1 4s.3 2.7 1 4h2.9v-2.4z" fill="#FBBC05"/>
            <path d="M20 14.8c1.3 0 2.5.4 3.4 1.3l2.6-2.6C24.4 12.2 22.4 11 20 11c-3.5 0-6.5 2.1-8 5.2l2.9 2.3c.7-2.2 2.7-3.7 5.1-3.7z" fill="#EA4335"/>
          </svg>
        ) 
      },
      { 
        id: "phonepe", 
        name: "PhonePe", 
        color: "bg-[#25103c]/75 border-[#5f259f]/40 text-[#a78bfa]", 
        glow: "rgba(95, 37, 159, 0.4)",
        icon: <div className="w-5 h-5 rounded bg-[#5f259f] flex items-center justify-center font-black text-white text-[9.5px]">Pe</div>
      },
      { 
        id: "paytm", 
        name: "Paytm", 
        color: "bg-[#0f1d35]/75 border-[#00b9f5]/40 text-[#00b9f5]", 
        glow: "rgba(0, 185, 245, 0.4)",
        icon: <div className="font-sans font-black text-[8px] tracking-tighter">paytm</div>
      },
      { 
        id: "bhim", 
        name: "BHIM", 
        color: "bg-[#1c2921]/75 border-[#10b981]/40 text-[#10b981]", 
        glow: "rgba(16, 185, 129, 0.4)",
        icon: (
          <div className="flex items-center gap-0.5 font-sans font-black text-[7px] leading-none">
            <span className="text-orange-500">BH</span>
            <span className="text-emerald-500">IM</span>
          </div>
        )
      },
      { 
        id: "apay", 
        name: "Amazon Pay", 
        color: "bg-[#2d1b0d]/75 border-[#ff9900]/40 text-[#ff9900]", 
        glow: "rgba(255, 153, 0, 0.4)",
        icon: <span className="text-[7.5px] font-black text-[#ff9900]">a-pay</span>
      },
      { 
        id: "upi", 
        name: "UPI", 
        color: "bg-[#112d30]/75 border-[#097969]/40 text-emerald-400", 
        glow: "rgba(9, 121, 105, 0.4)",
        icon: <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
      },
      { 
        id: "cards", 
        name: "Cards", 
        color: "bg-[#1c1d22]/75 border-slate-700/60 text-amber-500", 
        glow: "rgba(245, 158, 11, 0.4)",
        icon: <CreditCard className="w-4.5 h-4.5" />
      },
      { 
        id: "banks", 
        name: "Banks", 
        color: "bg-[#0b172a]/75 border-indigo-500/40 text-indigo-400", 
        glow: "rgba(99, 102, 241, 0.4)",
        icon: <Landmark className="w-4.5 h-4.5" />
      },
      { 
        id: "wallets", 
        name: "Wallets", 
        color: "bg-[#1b0a1a]/75 border-fuchsia-600/40 text-fuchsia-400", 
        glow: "rgba(217, 70, 239, 0.4)",
        icon: <Wallet className="w-4.5 h-4.5" />
      }
    ];

    return brands.map((b, idx) => {
      // Starting coordinates: random angles far away
      const angle = (idx * 2 * Math.PI) / 9 + (Math.random() - 0.5) * 0.4;
      const startDist = 650;
      
      // Floating coordinates in a galaxy distribution
      const scatterAngle = (idx * 2 * Math.PI) / 9;
      const scatterDist = 130 + Math.random() * 110;

      return {
        ...b,
        startX: Math.cos(angle) * startDist,
        startY: Math.sin(angle) * startDist,
        scatterX: Math.cos(scatterAngle) * scatterDist,
        scatterY: Math.sin(scatterAngle) * scatterDist,
        scale: 0.9 + Math.random() * 0.25,
        depth: 25 + idx
      };
    });
  }, []);

  // Neural connections map: connect node to its logical neighbors in scattered format
  const connections = useMemo(() => {
    return [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 7, to: 8 },
      { from: 8, to: 0 },
      { from: 0, to: 4 },
      { from: 2, to: 6 },
      { from: 3, to: 7 }
    ];
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Stagger node appearance (Scene 1)
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev < nodes.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 110);

    // Timers
    const t2 = setTimeout(() => setSubScene(2), 2500); // 2.5s: Neural Connections appear
    const t3 = setTimeout(() => setSubScene(3), 4500); // 4.5s: Black Hole forms & sucks nodes
    const t4 = setTimeout(() => setSubScene(4), 6500); // 6.5s: Flash & FinSight Logo Reveal
    const t5 = setTimeout(() => setSubScene(5), 8000); // 8.0s: Tagline Statement text
    const t6 = setTimeout(() => setSubScene(6), 9500); // 9.5s: Logo shift & Hyperspace beam
    const tEnd = setTimeout(() => onComplete(), 10000); // 10.0s: Handover to Login

    return () => {
      clearInterval(interval);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(tEnd);
    };
  }, [isActive, onComplete, nodes.length]);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#020617] overflow-hidden flex items-center justify-center">
      {/* 1. GALAXY & NEBULA BACKGROUNDS */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,11,35,0.75),rgba(2,4,16,1))]" />
      
      {/* Slowly drifting nebula cloud blobs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-900/10 rounded-full blur-[90px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[110px] animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />

      {/* Grid Constellation overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:50px_50px] opacity-40 pointer-events-none" />

      {/* 2. NEURAL NETWORK CONSTELLATIONS (Scene 2) */}
      {subScene === 2 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="laserGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <g style={{ transform: 'translate(50vw, 50vh)' }}>
            {connections.map((c, idx) => {
              const fromNode = nodes[c.from];
              const toNode = nodes[c.to];
              return (
                <g key={idx}>
                  <motion.line
                    x1={fromNode.scatterX}
                    y1={fromNode.scatterY}
                    x2={toNode.scatterX}
                    y2={toNode.scatterY}
                    stroke="url(#laserGlow)"
                    strokeWidth="1.2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                  {/* Packet traveling along the constellation line */}
                  <motion.circle
                    r="2.5"
                    fill="#38bdf8"
                    initial={{ cx: fromNode.scatterX, cy: fromNode.scatterY }}
                    animate={{
                      cx: [fromNode.scatterX, toNode.scatterX],
                      cy: [fromNode.scatterY, toNode.scatterY]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: idx * 0.08
                    }}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* 3. CINEMATIC BLACK HOLE VORTEX (Scene 3) */}
      <AnimatePresence>
        {subScene === 3 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.15, opacity: 1, rotate: 360 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              scale: { duration: 0.6, ease: "easeOut" },
              rotate: { repeat: Infinity, duration: 2, ease: "linear" }
            }}
            className="absolute z-20 w-40 h-40 flex items-center justify-center pointer-events-none"
          >
            {/* Spinning neon Accretion Disk */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 blur-2xl opacity-75 animate-pulse" />
            <div className="absolute w-[115%] h-[115%] rounded-full border-t border-b border-indigo-400/90 animate-spin" style={{ animationDuration: '1s' }} />
            <div className="absolute w-[130%] h-[130%] rounded-full border-l border-r border-violet-500/50 animate-spin" style={{ animationDuration: '1.6s', animationDirection: 'reverse' }} />
            
            {/* Singular Core */}
            <div className="w-18 h-18 rounded-full bg-black border-[1.5px] border-indigo-500/50 shadow-[0_0_40px_10px_rgba(99,102,241,0.8)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Black hole debris dust particles */}
      <AnimatePresence>
        {subScene === 3 && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {Array.from({ length: 45 }).map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const startRadius = 240 + Math.random() * 220;
              const duration = 0.5 + Math.random() * 0.7;

              return (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.cos(angle) * startRadius,
                    y: Math.sin(angle) * startRadius,
                    scale: 1.2,
                    opacity: 0
                  }}
                  animate={{ 
                    x: 0,
                    y: 0,
                    scale: 0.1,
                    opacity: [0, 0.95, 0]
                  }}
                  transition={{ 
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeIn",
                    delay: Math.random() * 0.4
                  }}
                  className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-cyan-300 via-indigo-400 to-fuchsia-400"
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* 4. ECOSYSTEM NODES LAYER */}
      {subScene <= 3 && (
        <div className="absolute flex items-center justify-center z-15">
          <div className="relative flex items-center justify-center">
            {nodes.map((node, idx) => {
              const isVisible = idx < visibleCount;

              return (
                <AnimatePresence key={node.id}>
                  {isVisible && (
                    <motion.div
                      initial={{ 
                        x: node.startX, 
                        y: node.startY, 
                        scale: 0, 
                        opacity: 0 
                      }}
                      animate={
                        subScene === 3
                          ? { 
                              x: 0, 
                              y: 0, 
                              scale: 0, 
                              opacity: 0,
                              rotate: 720,
                              skewY: 30 // black hole warping
                            }
                          : { 
                              x: node.scatterX, 
                              y: node.scatterY, 
                              scale: node.scale, 
                              opacity: 1 
                            }
                      }
                      exit={{ scale: 0, opacity: 0 }}
                      transition={
                        subScene === 3
                          ? { duration: 1.0, ease: "easeIn", delay: idx * 0.07 }
                          : { type: "spring", stiffness: 70, damping: 13 }
                      }
                      style={{
                        position: "absolute",
                        zIndex: node.depth,
                        boxShadow: `0 0 16px ${node.glow}`,
                        willChange: "transform, opacity"
                      }}
                      className={`w-15 h-15 rounded-2xl flex flex-col items-center justify-center p-2 border border-solid text-center ${node.color} shadow-xl backdrop-blur-sm`}
                    >
                      {node.icon}
                      <span className="text-[7.5px] font-black tracking-tight leading-none mt-1">{node.name}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        </div>
      )}

      {/* STORYTELLING SUB-MESSAGES */}
      <div className="absolute bottom-16 text-center pointer-events-none z-30">
        <AnimatePresence mode="wait">
          {subScene === 1 && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.85, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-xs uppercase tracking-widest font-mono text-indigo-300"
            >
              "Financial data is everywhere."
            </motion.p>
          )}
          {subScene === 2 && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.85, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-xs uppercase tracking-widest font-mono text-fuchsia-300"
            >
              "FinSight AI understands relationships."
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* 5. FINSIGHT BRAND LOGO ASSEMBLY (Scene 4 & 5) */}
      <AnimatePresence>
        {(subScene === 4 || subScene === 5 || subScene === 6) && (
          <motion.div
            initial={{ scale: 0.1, opacity: 0 }}
            animate={
              subScene === 6
                ? { x: -160, scale: 1.1, opacity: 1 } // Shift left
                : { x: 0, scale: 1.3, opacity: 1 } // Center Forge
            }
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 13,
              x: { duration: 0.45, ease: "easeInOut" }
            }}
            className="absolute z-35 flex flex-col items-center justify-center"
          >
            {/* Forge flash */}
            {subScene === 4 && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.5, 4.5, 0.5], opacity: [0, 0.95, 0] }}
                transition={{ duration: 0.95, ease: "easeOut" }}
                className="absolute w-48 h-48 rounded-full bg-white blur-3xl mix-blend-screen pointer-events-none"
              />
            )}

            {/* Glowing Logo */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-600 blur-2xl opacity-75" />
              <div className="absolute inset-0 rounded-3xl bg-[#080d19] border border-indigo-400/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-14 h-14 text-indigo-200" />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-widest mt-4 font-mono">FINSIGHT AI</h1>
            
            {/* Brand Statement Subtext (Scene 5) */}
            <AnimatePresence>
              {subScene === 5 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.9, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 font-mono mt-3 leading-none text-center max-w-xs"
                >
                  "One Intelligence Layer For Every Transaction"
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. HYPERSPACE MOVEMENT TRANSITION BEAM (Scene 6) */}
      <AnimatePresence>
        {subScene === 6 && (
          <motion.div
            initial={{ x: "-180%" }}
            animate={{ x: "180%" }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            style={{
              clipPath: "polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)",
              willChange: "transform"
            }}
            className="absolute inset-y-0 left-0 w-[180vw] bg-gradient-to-r from-transparent via-indigo-500/80 to-cyan-400 z-50 shadow-[0_0_85px_rgba(99,102,241,0.9)] pointer-events-none"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
