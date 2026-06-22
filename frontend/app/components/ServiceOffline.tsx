"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { checkBackendHealth } from "../lib/api";

interface ServiceOfflineProps {
  error: string;
  onRetry: () => void;
}

export default function ServiceOffline({ error, onRetry }: ServiceOfflineProps) {
  const [delay, setDelay] = useState(5000); // 5s initial delay
  const [retryTimer, setRetryTimer] = useState(5);
  const [isRetrying, setIsRetrying] = useState(false);

  const onRetryRef = useRef(onRetry);
  const isCheckingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep onRetry reference updated
  useEffect(() => {
    onRetryRef.current = onRetry;
  }, [onRetry]);

  // Countdown timer effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRetryTimer((prev) => {
        if (prev <= 1) {
          // Reset to current delay in seconds once countdown hits 0
          return Math.round(delay / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [delay]);

  // Connection checking effect with exponential backoff
  useEffect(() => {
    const checkConnection = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      console.log(`[ServiceOffline] Performing scheduled health check (delay: ${delay}ms)...`);
      
      try {
        const health = await checkBackendHealth();
        if (health.status === "ONLINE") {
          console.log("[ServiceOffline] Backend is online! Triggering retry...");
          onRetryRef.current();
        } else {
          // Increase delay exponentially, cap at 60s
          setDelay((prev) => {
            const next = Math.min(prev * 1.5, 60000);
            const nextSec = Math.round(next / 1000);
            setRetryTimer(nextSec);
            console.log(`[ServiceOffline] Backend offline. Backing off: next retry in ${nextSec}s`);
            return next;
          });
        }
      } catch (err) {
        setDelay((prev) => {
          const next = Math.min(prev * 1.5, 60000);
          const nextSec = Math.round(next / 1000);
          setRetryTimer(nextSec);
          return next;
        });
      } finally {
        isCheckingRef.current = false;
        // Schedule next check recursively
        retryTimeoutRef.current = setTimeout(checkConnection, delay);
      }
    };

    // Schedule connection check
    retryTimeoutRef.current = setTimeout(checkConnection, delay);

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [delay]);

  const handleManualRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    console.log("[ServiceOffline] Manual connection check triggered...");
    
    try {
      const health = await checkBackendHealth();
      if (health.status === "ONLINE") {
        console.log("[ServiceOffline] Backend online on manual check! Reloading...");
        onRetry();
      } else {
        console.warn("[ServiceOffline] Manual check failed: Backend still offline.");
        setIsRetrying(false);
        // Force reset timer back to initial 5s since user explicitly retried
        setDelay(5000);
        setRetryTimer(5);
      }
    } catch {
      setIsRetrying(false);
      setDelay(5000);
      setRetryTimer(5);
    }
  };

  const isDatabaseError = error.toLowerCase().includes("database") || error.toLowerCase().includes("postgres") || error.toLowerCase().includes("connection failed");
  const statusLabel = isDatabaseError ? "Database Error" : "Offline";

  return (
    <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center max-w-xl mx-auto my-12 space-y-5">
      <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-2">
        <AlertTriangle className="h-8 w-8" />
      </div>
      
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-800 tracking-wide uppercase">Service Offline</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          FinSight AI is unable to securely connect to the backend server. Retrying automatically in <span className="font-bold text-slate-700">{retryTimer}s</span>...
        </p>
      </div>

      <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-black text-slate-400 uppercase tracking-wider text-[10px]">Backend Status:</span>
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 font-bold uppercase tracking-wider text-[9px] px-2.5 py-0.5 rounded-full">
            {statusLabel}
          </Badge>
        </div>
        <div className="text-[10px] font-mono text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-normal break-words shadow-inner">
          {error}
        </div>
      </div>

      <Button 
        onClick={handleManualRetry} 
        disabled={isRetrying}
        className="w-full bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-80 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? "Checking Connectivity..." : "Retry Connection Now"}
      </Button>
    </div>
  );
}
