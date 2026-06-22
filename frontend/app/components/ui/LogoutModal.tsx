"use client";

import { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
import { Button } from "./Button";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const [loading, setLoading] = useState(false);

  // Esc key closes modal & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // lock scroll

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = ""; // release scroll
    };
  }, [isOpen, onClose, loading]);

  // Reset loading state if modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    // Show spinner briefly for premium feedback
    await new Promise((resolve) => setTimeout(resolve, 600));
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay with blur */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      
      {/* Dark glassmorphism card */}
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 text-slate-100 backdrop-blur-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          suppressHydrationWarning={true}
          className="absolute right-4 top-4 rounded-md opacity-50 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
        >
          <X className="h-4 w-4 text-slate-400 hover:text-white" />
        </button>

        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg">
            <LogOut className="h-6 w-6" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-lg font-black tracking-wide text-white uppercase">
              FINSIGHT <span className="text-[#2874F0]">AI</span> LOGOUT
            </h3>
            <p className="text-xs text-slate-400 leading-normal font-semibold">
              Are you sure you want to end your secure FinSight AI intelligence session?
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 border-t border-slate-800 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl font-bold text-xs h-10 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            loading={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs h-10 shadow-lg transition-colors border-none"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
