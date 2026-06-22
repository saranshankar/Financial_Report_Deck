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
  // Sub-scenes timeline:
  // 1: Chaos (0.0s - 1.5s)
  // 2: Circle Alignment & Orbit (1.5s - 3.0s)
  // 3: Intelligence Activation - Neural Web & Packets (3.0s - 4.0s)
  // 4: Black Hole Suction (4.0s - 5.5s)
  // 5: Forge Collapse & FinSight Logo Reveal (5.5s - 6.5s)
  // 6: Brand Statement (6.5s - 7.5s)
  // 7: Hyperspace transition warp (7.5s - 7.8s)
  const [subScene, setSubScene] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [visibleCount, setVisibleCount] = useState(0);

  // Generate 9 detailed ecosystem nodes with offscreen start positions and scattered drift positions
  const nodes = useMemo<PaymentNode[]>(() => {
    const brands = [
      { 
        id: "gpay", 
        name: "GPay", 
        color: "bg-[#1e293b] border-[#4285F4] text-[#4285F4]", 
        glow: "rgba(66, 133, 244, 0.4)",
        icon: (
          <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
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
        color: "bg-[#25103c] border-[#5f259f] text-[#5f259f]", 
        glow: "rgba(95, 37, 159, 0.5)",
        icon: (
          <div className="w-6 h-6 rounded-lg bg-[#5f259f] flex items-center justify-center font-black text-white text-[11px] tracking-tighter">Pe</div>
        )
      },
      { 
        id: "paytm", 
        name: "Paytm", 
        color: "bg-[#0f1d35] border-[#00b9f5] text-[#00b9f5]", 
        glow: "rgba(0, 185, 245, 0.5)",
        icon: (
          <div className="font-sans font-black text-[9px] text-[#00b9f5] leading-none tracking-tighter">paytm</div>
        )
      },
      { 
        id: "bhim", 
        name: "BHIM", 
        color: "bg-[#1c2921] border-[#10b981] text-[#10b981]", 
        glow: "rgba(16, 185, 129, 0.4)",
        icon: (
          <div className="flex flex-col items-center leading-none">
            <span className="text-[7px] font-black text-orange-500">BH</span>
            <span className="text-[7px] font-black text-emerald-500">IM</span>
          </div>
        )
      },
      { 
        id: "apay", 
        name: "Amazon Pay", 
        color: "bg-[#2d1b0d] border-[#ff9900] text-[#ff9900]", 
        glow: "rgba(255, 153, 0, 0.4)",
        icon: (
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black leading-none text-white">a</span>
            <span className="text-[6px] font-bold leading-none text-[#ff9900]">pay</span>
          </div>
        )
      },
      { 
        id: "upi", 
        name: "UPI", 
        color: "bg-[#112d30] border-[#097969] text-white", 
        glow: "rgba(9, 121, 105, 0.5)",
        icon: <ArrowLeftRight className="w-5 h-5 text-[#097969]" />
      },
      { 
        id: "cards", 
        name: "Cards", 
        color: "bg-[#1c1d22] border-slate-600 text-amber-500", 
        glow: "rgba(245, 158, 11, 0.4)",
        icon: <CreditCard className="w-5 h-5" />
      },
      { 
        id: "banks", 
        name: "Banks", 
        color: "bg-[#0b172a] border-indigo-500 text-indigo-400", 
        glow: "rgba(99, 102, 241, 0.4)",
        icon: <Landmark className="w-5 h-5" />
      },
      { 
        id: "wallets", 
        name: "Wallets", 
        color: "bg-[#1b0a1a] border-fuchsia-600 text-fuchsia-400", 
        glow: "rgba(217, 70, 239, 0.4)",
        icon: <Wallet className="w-5 h-5" />
      }
    ];

    return brands.map((b, idx) => {
      // Start angles for random offscreen trajectory
      const angle = (idx * 2 * Math.PI) / 9 + (Math.random() - 0.5) * 0.5;
      const dist = 700; // far offscreen
      
      // Floating/Scattered coordinates
      const scatterAngle = (idx * 2 * Math.PI) / 9 + Math.PI / 4;
      const scatterDist = 140 + Math.random() * 90;

      return {
        ...b,
        startX: Math.cos(angle) * dist,
        startY: Math.sin(angle) * dist,
        scatterX: Math.cos(scatterAngle) * scatterDist,
        scatterY: Math.sin(scatterAngle) * scatterDist,
        scale: 0.85 + Math.random() * 0.3,
        depth: 20 + idx
      };
    });
  }, []);

  // Sequence scheduling
  useEffect(() => {
    if (!isActive) return;

    // Stagger node entry in Scene 1
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev < nodes.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 100);

    // Timelines
    const t2 = setTimeout(() => setSubScene(2), 1500); // 1.5s: Form circle & rotate
    const t3 = setTimeout(() => setSubScene(3), 3000); // 3.0s: Neural connection activation
    const t4 = setTimeout(() => setSubScene(4), 4000); // 4.0s: Black hole pulls in
    const t5 = setTimeout(() => setSubScene(5), 5500); // 5.5s: Collapse & logo reveal
    const t6 = setTimeout(() => setSubScene(6), 6500); // 6.5s: Brand statement
    const t7 = setTimeout(() => setSubScene(7), 7500); // 7.5s: Hyperspace transition beam
    const tEnd = setTimeout(() => onComplete(), 7800); // 7.8s: Handover to Login

    return () => {
      clearInterval(interval);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(tEnd);
    };
  }, [isActive, onComplete, nodes.length]);

  // Polar circle math
  const getCirclePosition = (idx: number) => {
    const angle = (idx * 2 * Math.PI) / nodes.length;
    const radius = 200;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  const bhParticles = Array.from({ length: 40 });

  return (
    <div className="relative w-full h-full min-h-screen bg-[#020617] overflow-hidden flex items-center justify-center">
      {/* Space gradient layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(9,12,32,0.5),rgba(2,6,23,1))]" />
      
      {/* High-tech matrix background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:45px_45px] opacity-50 pointer-events-none" />

      {/* SUB-SCENE 2 & 3: Circle track visualizer */}
      <AnimatePresence>
        {(subScene === 2 || subScene === 3) && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.12 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="absolute w-[400px] h-[400px] rounded-full border-[1.5px] border-dashed border-indigo-400/80 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* SUB-SCENE 3: Neural Link Connections SVG Layer */}
      {subScene === 3 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="neuralGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <g style={{ transform: 'translate(50vw, 50vh)' }}>
            {nodes.map((n, idx) => {
              const start = getCirclePosition(idx);
              const end = getCirclePosition((idx + 2) % nodes.length); // connecting nodes in web pattern
              return (
                <g key={n.id}>
                  {/* Neon laser paths */}
                  <motion.line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="url(#neuralGlow)"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {/* Traveling light packets */}
                  <motion.circle
                    r="3.5"
                    fill="#38bdf8"
                    className="shadow-[0_0_10px_#38bdf8]"
                    initial={{ offset: 0 }}
                    animate={{
                      cx: [start.x, end.x],
                      cy: [start.y, end.y],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                      delay: idx * 0.1
                    }}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* SUB-SCENE 4: Accretion Disk / Black Hole Vortex */}
      <AnimatePresence>
        {subScene === 4 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              scale: { duration: 0.6, ease: "easeOut" },
              rotate: { repeat: Infinity, duration: 2.2, ease: "linear" }
            }}
            className="absolute z-20 w-36 h-36 flex items-center justify-center pointer-events-none"
          >
            {/* Swirling accretion disk layers */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 blur-2xl opacity-75 animate-pulse" />
            <div className="absolute w-[110%] h-[110%] rounded-full border-t-2 border-b-2 border-indigo-400/90 animate-spin" style={{ animationDuration: '1.2s' }} />
            <div className="absolute w-[125%] h-[125%] rounded-full border-l border-r border-violet-500/60 animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
            
            {/* Core singularity */}
            <div className="w-16 h-16 rounded-full bg-black border-2 border-indigo-500/50 shadow-[0_0_40px_10px_rgba(99,102,241,0.7)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUB-SCENE 4: Accretion gravity debris particles */}
      <AnimatePresence>
        {subScene === 4 && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {bhParticles.map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const startRadius = 250 + Math.random() * 200;
              const duration = 0.6 + Math.random() * 0.8;

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
                    opacity: [0, 0.9, 0]
                  }}
                  transition={{ 
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeIn",
                    delay: Math.random() * 0.5
                  }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-300 via-fuchsia-400 to-cyan-300 shadow-sm"
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* CORE PAYMENT NODE ECOSYSTEM LAYOUT */}
      {subScene <= 4 && (
        <div className="absolute flex items-center justify-center z-10">
          <motion.div
            animate={(subScene === 2 || subScene === 3) ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
            className="relative flex items-center justify-center"
          >
            {nodes.map((node, idx) => {
              const isVisible = idx < visibleCount;
              const circlePos = getCirclePosition(idx);

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
                        subScene === 4
                          ? { 
                              x: 0, 
                              y: 0, 
                              scale: 0, 
                              opacity: 0,
                              rotate: 720,
                              skewX: 25 // simulate gravity shear
                            }
                          : (subScene === 2 || subScene === 3)
                            ? { 
                                x: circlePos.x, 
                                y: circlePos.y, 
                                scale: 1, 
                                opacity: 1 
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
                        subScene === 4
                          ? { duration: 1.1, ease: "easeIn", delay: idx * 0.08 }
                          : { type: "spring", stiffness: 75, damping: 13 }
                      }
                      style={{
                        position: "absolute",
                        zIndex: node.depth,
                        boxShadow: `0 0 20px ${node.glow}`,
                        willChange: "transform, opacity"
                      }}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center p-2 border border-solid select-none ${node.color} shadow-2xl backdrop-blur-md`}
                    >
                      {/* Counter-rotate nested container to maintain icon orientation */}
                      <motion.div
                        animate={(subScene === 2 || subScene === 3) ? { rotate: -360 } : {}}
                        transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
                        className="flex flex-col items-center justify-center gap-1 w-full h-full"
                      >
                        {node.icon}
                        <span className="text-[7.5px] font-black tracking-wide leading-none">{node.name}</span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* OVERLAY SYSTEM MESSAGES */}
      <div className="absolute bottom-16 text-center pointer-events-none z-30">
        <AnimatePresence mode="wait">
          {subScene === 1 && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-xs uppercase tracking-widest font-mono text-indigo-200"
            >
              "Financial data is everywhere."
            </motion.p>
          )}
          {subScene === 3 && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-xs uppercase tracking-widest font-mono text-fuchsia-300"
            >
              "FinSight AI understands relationships."
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* FINSIGHT BRAND LOGO ASSEMBLY (Scene 5 & 6) */}
      <AnimatePresence>
        {(subScene === 5 || subScene === 6 || subScene === 7) && (
          <motion.div
            initial={{ scale: 0.1, opacity: 0 }}
            animate={
              subScene === 7
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
            {/* Forge singularity explosion flash */}
            {subScene === 5 && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.5, 4.5, 0.5], opacity: [0, 0.95, 0] }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute w-48 h-48 rounded-full bg-white blur-3xl mix-blend-screen pointer-events-none"
              />
            )}

            {/* Glowing Logo Block */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-600 blur-2xl opacity-75" />
              <div className="absolute inset-0 rounded-3xl bg-[#080d19] border border-indigo-400/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)]">
                <BrainCircuit className="w-14 h-14 text-indigo-200" />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-widest mt-4 font-mono">FINSIGHT AI</h1>
            
            {/* Brand Statement Subtext (Scene 6) */}
            <AnimatePresence>
              {subScene === 6 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.9, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 font-mono mt-3 leading-none text-center max-w-xs"
                >
                  "One Intelligence Layer For Every Transaction"
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ULTRA-FAST HYPERSPACE BEAM TRANSITION (Scene 7 - 300ms) */}
      <AnimatePresence>
        {subScene === 7 && (
          <motion.div
            initial={{ x: "-180%" }}
            animate={{ x: "180%" }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }} // Fast acceleration
            style={{
              clipPath: "polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)",
              willChange: "transform"
            }}
            className="absolute inset-y-0 left-0 w-[180vw] bg-gradient-to-r from-transparent via-indigo-500/80 to-cyan-400 z-50 shadow-[0_0_80px_rgba(99,102,241,0.9)] pointer-events-none"
          />
        )}
      </AnimatePresence>

    </div>
  );
}
