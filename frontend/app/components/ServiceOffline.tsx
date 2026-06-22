"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { checkBackendHealth } from "../lib/api";

interface ServiceOfflineProps {
  error: string;
  onRetry: () => void;
}

export default function ServiceOffline({ error, onRetry }: ServiceOfflineProps) {
  const [retryTimer, setRetryTimer] = useState(10);

  useEffect(() => {
    // Start an automatic health check interval every 10 seconds
    const healthInterval = setInterval(async () => {
      const health = await checkBackendHealth();
      if (health.status === "ONLINE") {
        onRetry();
      }
    }, 10000);

    // Visual countdown timer
    const countdownInterval = setInterval(() => {
      setRetryTimer((prev) => (prev <= 1 ? 10 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(countdownInterval);
    };
  }, [onRetry]);

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
        onClick={onRetry} 
        className="w-full bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
      >
        <RefreshCw className="h-4 w-4" />
        Retry Connection Now
      </Button>
    </div>
  );
}
