"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import EcosystemIntro from "./EcosystemIntro";
import PremiumLogin from "./PremiumLogin";
import SuccessReveal from "./SuccessReveal";

type OnboardingPhase = "intro" | "login" | "success";

export default function IntroSequence() {
  const [phase, setPhase] = useState<OnboardingPhase>("intro");

  // Determine if user has visited onboarding before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasVisited = localStorage.getItem("onboarding_visited") === "true";
      if (hasVisited) {
        setPhase("login");
      }
    }
  }, []);

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_visited", "true");
    }
    setPhase("login");
  };

  const handleIntroComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_visited", "true");
    }
    setPhase("login");
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#020617] overflow-hidden select-none">
      
      {/* SKIP INTRO BYPASS BUTTON */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            onClick={handleSkip}
            className="absolute top-6 right-6 z-50 flex items-center gap-1 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <span>Skip Intro</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* RENDER THE ACTIVE PHASE */}
      <div className="w-full h-full min-h-screen">
        {/* Phase 1: Ecosystem Introduction */}
        {phase === "intro" && (
          <EcosystemIntro 
            isActive={phase === "intro"} 
            onComplete={handleIntroComplete} 
          />
        )}

        {/* Phase 2: Premium Login & Registration */}
        {phase === "login" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <PremiumLogin 
              isActive={phase === "login"} 
              onSuccess={() => setPhase("success")} 
            />
          </motion.div>
        )}

        {/* Phase 3: Login Success Animations & Route */}
        {phase === "success" && (
          <SuccessReveal isActive={phase === "success"} />
        )}
      </div>

    </div>
  );
}
