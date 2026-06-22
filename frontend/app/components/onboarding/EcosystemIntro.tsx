"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  CreditCard, 
  Wallet, 
  Landmark, 
  ArrowLeftRight,
  BrainCircuit,
  Sparkles
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
  driftX: number[];
  driftY: number[];
}

interface EcosystemIntroProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function EcosystemIntro({ isActive, onComplete }: EcosystemIntroProps) {
  // Timeline steps:
  // 1: Chaos - Floating scattered nodes in Galaxy (0.0s - 3.5s)
  // 2: Gravity Warning - Black hole appears, grows, logos shake (3.5s - 6.5s)
  // 3: Sequential Suction - Logos are pulled in one-by-one (6.5s - 9.5s)
  // 4: Logo Forge - Singularity collapse & logo forge flash (9.5s - 11.5s)
  // 5: Tagline - Brand statement (11.5s - 13.0s)
  // 6: Morph transition - Natural dissolve into login page (13.0s - 13.8s)
  const [subScene, setSubScene] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeSuctionNodeIdx, setActiveSuctionNodeIdx] = useState<number | null>(null);
  
  // Track which nodes have been absorbed
  const [absorbedNodes, setAbsorbedNodes] = useState<Record<string, boolean>>({});
  
  // Trigger list of ripples at center
  const [ripples, setRipples] = useState<number[]>([]);

  // Generate 9 payment nodes with random coordinates and start trajectories
  const nodes = useMemo<PaymentNode[]>(() => {
    const brands = [
      { 
        id: "gpay", 
        name: "GPay", 
        color: "bg-[#1e293b]/70 border-[#4285F4]/30 text-[#4285F4]", 
        glow: "rgba(66, 133, 244, 0.35)",
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
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
        color: "bg-[#25103c]/70 border-[#5f259f]/30 text-[#a78bfa]", 
        glow: "rgba(95, 37, 159, 0.35)",
        icon: <div className="w-5 h-5 rounded bg-[#5f259f] flex items-center justify-center font-black text-white text-[9px]">Pe</div>
      },
      { 
        id: "paytm", 
        name: "Paytm", 
        color: "bg-[#0f1d35]/70 border-[#00b9f5]/30 text-[#00b9f5]", 
        glow: "rgba(0, 185, 245, 0.35)",
        icon: <div className="font-sans font-black text-[8px] tracking-tighter">paytm</div>
      },
      { 
        id: "bhim", 
        name: "BHIM", 
        color: "bg-[#1c2921]/70 border-[#10b981]/30 text-[#10b981]", 
        glow: "rgba(16, 185, 129, 0.35)",
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
        color: "bg-[#2d1b0d]/70 border-[#ff9900]/30 text-[#ff9900]", 
        glow: "rgba(255, 153, 0, 0.35)",
        icon: <span className="text-[7px] font-black text-[#ff9900]">a-pay</span>
      },
      { 
        id: "upi", 
        name: "UPI", 
        color: "bg-[#112d30]/70 border-[#097969]/30 text-emerald-400", 
        glow: "rgba(9, 121, 105, 0.35)",
        icon: <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
      },
      { 
        id: "cards", 
        name: "Cards", 
        color: "bg-[#1c1d22]/70 border-slate-700/50 text-amber-500", 
        glow: "rgba(245, 158, 11, 0.35)",
        icon: <CreditCard className="w-4.5 h-4.5" />
      },
      { 
        id: "banks", 
        name: "Banks", 
        color: "bg-[#0b172a]/70 border-indigo-500/30 text-indigo-400", 
        glow: "rgba(99, 102, 241, 0.35)",
        icon: <Landmark className="w-4.5 h-4.5" />
      },
      { 
        id: "wallets", 
        name: "Wallets", 
        color: "bg-[#1b0a1a]/75 border-fuchsia-600/30 text-fuchsia-400", 
        glow: "rgba(217, 70, 239, 0.35)",
        icon: <Wallet className="w-4.5 h-4.5" />
      }
    ];

    return brands.map((b, idx) => {
      // Spawn parameters
      const startAngle = (idx * 2 * Math.PI) / 9 + (Math.random() - 0.5) * 0.4;
      const startDist = 600;

      // Natural scattered placement coordinates
      const targetAngle = (idx * 2 * Math.PI) / 9 + Math.PI / 6;
      const targetDist = 140 + Math.random() * 120;

      // Multi-step parallax drift keyframes (suspending float)
      const driftX = [
        Math.cos(targetAngle) * targetDist,
        Math.cos(targetAngle) * targetDist + (Math.random() - 0.5) * 20,
        Math.cos(targetAngle) * targetDist + (Math.random() - 0.5) * 10,
        Math.cos(targetAngle) * targetDist
      ];
      const driftY = [
        Math.sin(targetAngle) * targetDist,
        Math.sin(targetAngle) * targetDist + (Math.random() - 0.5) * 20,
        Math.sin(targetAngle) * targetDist + (Math.random() - 0.5) * 10,
        Math.sin(targetAngle) * targetDist
      ];

      return {
        ...b,
        startX: Math.cos(startAngle) * startDist,
        startY: Math.sin(startAngle) * startDist,
        scatterX: Math.cos(targetAngle) * targetDist,
        scatterY: Math.sin(targetAngle) * targetDist,
        scale: 0.8 + Math.random() * 0.3,
        depth: 25 + idx,
        driftX,
        driftY
      };
    });
  }, []);

  // Sequence Controller
  useEffect(() => {
    if (!isActive) return;

    // Stagger spawn (Scene 1)
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev < nodes.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 140);

    // Timeline steps
    const t2 = setTimeout(() => setSubScene(2), 3500); // 3.5s -> Black hole grows, warning warning shake
    const t3 = setTimeout(() => setSubScene(3), 6500); // 6.5s -> Sequential suction starts
    const t4 = setTimeout(() => setSubScene(4), 9500); // 9.5s -> Forge collapse & logo assembly
    const t5 = setTimeout(() => setSubScene(5), 11500); // 11.5s -> Brand Tagline
    const t6 = setTimeout(() => setSubScene(6), 13000); // 13.0s -> Morph Transition
    const tEnd = setTimeout(() => onComplete(), 13800); // 13.8s -> Complete

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

  // Sequential absorption trigger loop
  useEffect(() => {
    if (subScene === 3) {
      let nodeIdx = 0;
      
      const pullNext = () => {
        if (nodeIdx < nodes.length) {
          const currentId = nodes[nodeIdx].id;
          setActiveSuctionNodeIdx(nodeIdx);

          // Mark node absorbed when animation finishes (500ms suction time)
          setTimeout(() => {
            setAbsorbedNodes(prev => ({ ...prev, [currentId]: true }));
            // Add a ripple pulse
            setRipples(prev => [...prev, Date.now()]);
            nodeIdx++;
            pullNext();
          }, 320); // sequential stagger delay
        } else {
          setActiveSuctionNodeIdx(null);
        }
      };

      pullNext();
    }
  }, [subScene, nodes]);

  // Clean up old ripples
  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#02040d] overflow-hidden flex items-center justify-center">
      {/* Galaxy Space Backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,11,40,0.65),rgba(2,4,13,1))]" />
      
      {/* Drifting Nebula Clouds */}
      <div className="absolute top-1/4 left-1/4 w-[360px] h-[360px] bg-purple-950/15 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '9s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-indigo-950/15 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />

      {/* Floating starry space particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => {
          const size = Math.random() * 2.5 + 1.5;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          return (
            <motion.div
              key={i}
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 3 + Math.random() * 3, repeat: Infinity }}
              style={{ width: size, height: size, top: `${top}%`, left: `${left}%` }}
              className="absolute rounded-full bg-white/20 blur-[0.5px]"
            />
          );
        })}
      </div>

      {/* RIPPLE EFFECTS (Scenes 3 - Triggered on platform absorption) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-15">
        {ripples.map((id) => (
          <motion.div
            key={id}
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute w-44 h-44 rounded-full border border-indigo-400/40"
            style={{ boxShadow: "0 0 35px rgba(99,102,241,0.25)" }}
          />
        ))}
      </div>

      {/* DETAILED BLACK HOLE CENTERPIECE (Scene 2 & 3) */}
      <AnimatePresence>
        {(subScene === 2 || subScene === 3) && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: subScene === 3 ? 1.25 : 1, 
              opacity: 1, 
              rotate: 360 
            }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.4 } }}
            transition={{
              scale: { duration: 1.5, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 4.5, ease: "linear" }
            }}
            className="absolute z-20 w-44 h-44 flex items-center justify-center pointer-events-none"
          >
            {/* Accretion Disk volumetric glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 blur-3xl opacity-70 animate-pulse" />
            
            {/* Spinning gravitational lens dust trails */}
            <div className="absolute w-[112%] h-[112%] rounded-full border-t-[2.5px] border-b-[2.5px] border-indigo-400/70 animate-spin" style={{ animationDuration: '1.4s' }} />
            <div className="absolute w-[125%] h-[125%] rounded-full border-l-[1.5px] border-r-[1.5px] border-fuchsia-500/40 animate-spin" style={{ animationDuration: '2.2s', animationDirection: 'reverse' }} />
            
            {/* Black singularity core */}
            <div className="w-20 h-20 rounded-full bg-black border-2 border-indigo-500/40 shadow-[0_0_50px_12px_rgba(99,102,241,0.85)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Black hole debris dust particles */}
      <AnimatePresence>
        {subScene === 3 && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {Array.from({ length: 35 }).map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const startRadius = 240 + Math.random() * 200;
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

      {/* ECOSYSTEM NODES LAYER */}
      {subScene <= 3 && (
        <div className="absolute flex items-center justify-center z-15">
          <div className="relative flex items-center justify-center">
            {nodes.map((node, idx) => {
              const isVisible = idx < visibleCount;
              const isAbsorbed = absorbedNodes[node.id];
              
              // Gravity warning reaction parameters
              const isReacting = subScene === 2;
              const isPulling = subScene === 3;
              const isActiveSuction = activeSuctionNodeIdx === idx;

              return (
                <AnimatePresence key={node.id}>
                  {isVisible && !isAbsorbed && (
                    <motion.div
                      initial={{ 
                        x: node.startX, 
                        y: node.startY, 
                        scale: 0, 
                        opacity: 0 
                      }}
                      animate={
                        isActiveSuction
                          ? { 
                              x: 0, 
                              y: 0, 
                              scale: 0, 
                              opacity: 0,
                              rotate: 540,
                              skewY: 35
                            }
                          : isPulling
                            ? { 
                                // Dragged closer to black hole before final pull
                                x: node.scatterX * 0.45,
                                y: node.scatterY * 0.45,
                                scale: node.scale * 0.8,
                                rotate: 45
                              }
                            : isReacting
                              ? {
                                  // Shaking and rotation changes
                                  x: [node.scatterX - 4, node.scatterX + 4, node.scatterX],
                                  y: [node.scatterY - 2, node.scatterY + 2, node.scatterY],
                                  rotate: [0, 10, -10, 0],
                                  scale: node.scale
                                }
                              : { 
                                  x: node.driftX, 
                                  y: node.driftY, 
                                  scale: node.scale, 
                                  opacity: 1 
                                }
                      }
                      transition={
                        isActiveSuction
                          ? { duration: 0.55, ease: "easeIn" }
                          : isPulling
                            ? { type: "spring", stiffness: 35, damping: 10 }
                            : isReacting
                              ? { duration: 0.7, repeat: Infinity, ease: "linear" }
                              : { 
                                  x: { duration: 18, repeat: Infinity, ease: "easeInOut" },
                                  y: { duration: 18, repeat: Infinity, ease: "easeInOut" }
                                }
                      }
                      style={{
                        position: "absolute",
                        zIndex: node.depth,
                        boxShadow: `0 0 20px ${node.glow}`,
                        willChange: "transform, opacity"
                      }}
                      className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center p-2 border border-solid text-center ${node.color} shadow-xl backdrop-blur-sm`}
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

      {/* STORYTELLING MESSAGES OVERLAY */}
      <div className="absolute bottom-16 text-center pointer-events-none z-30">
        <AnimatePresence mode="wait">
          {subScene === 1 && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.75, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-xs uppercase tracking-widest font-mono text-indigo-300/90"
            >
              "Financial data is everywhere."
            </motion.p>
          )}
          {subScene === 3 && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.75, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-xs uppercase tracking-widest font-mono text-fuchsia-300/90"
            >
              "Aggregating payment ecosystems..."
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* FINSIGHT BRAND LOGO ASSEMBLY (Scene 4 & 5) */}
      <AnimatePresence>
        {(subScene === 4 || subScene === 5 || subScene === 6) && (
          <motion.div
            initial={{ scale: 0.05, opacity: 0 }}
            animate={
              subScene === 6
                ? { x: -160, scale: 1.1, opacity: 1 } // Shift left
                : { x: 0, scale: 1.3, opacity: 1 } // Center Forge
            }
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.75 } }} // Morph Dissolve
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 14,
              x: { duration: 0.5, ease: "easeInOut" }
            }}
            className="absolute z-35 flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Forge collapse flash */}
            {subScene === 4 && (
              <motion.div
                initial={{ scale: 0.1, opacity: 0 }}
                animate={{ scale: [0.5, 5, 0.5], opacity: [0, 0.95, 0] }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="absolute w-48 h-48 rounded-full bg-white blur-3xl mix-blend-screen"
              />
            )}

            {/* Glowing Logo */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Concentric expanding glow pulses */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-600 blur-2xl opacity-75 animate-pulse" />
              <div className="absolute inset-0 rounded-3xl bg-[#080d19] border border-indigo-400/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-14 h-14 text-indigo-200" />
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-widest mt-4 font-mono">FINSIGHT AI</h1>
            
            {/* Brand Statement Tagline (Scene 5) */}
            <AnimatePresence>
              {subScene === 5 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.85, y: 0 }}
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

    </div>
  );
}
