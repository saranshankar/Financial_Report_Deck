"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, RefreshCw, ShieldCheck, Sliders, AlertTriangle } from "lucide-react";

import { api, authApi, User, checkBackendHealth } from "../lib/api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ServiceOffline from "../components/ServiceOffline";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out of FinSight AI?")) {
      authApi.logout();
      router.push("/login");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const health = await checkBackendHealth();
      if (health.status !== "ONLINE") {
        setError(health.reason || "Backend server is unavailable. Please start the FastAPI server.");
        setLoading(false);
        return;
      }
      const userInfo = await authApi.getMe();
      setUser(userInfo);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load user info.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  // Reset database state back to initial seed data
  const handleResetSeed = async () => {
    setResetLoading(true);
    try {
      await api.post("/auth/reset");
      setIsConfirmResetOpen(false);
      setIsAdvancedOpen(false);
      alert("Database reset successfully! Navigating to dashboard.");
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert("Failed to reset database state. " + (err.response?.data?.detail || ""));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      <Sidebar onLogout={() => { authApi.logout(); router.push("/login"); }} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 space-y-6 z-10 max-w-4xl w-full mx-auto">
          {error ? (
            <ServiceOffline error={error} onRetry={loadData} />
          ) : (
            <>
              {/* Header Row */}
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-wide">USER SETTINGS & PREFERENCES</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your credentials, platform access, and preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Profile Detail Card */}
            <Card className="md:col-span-1 border-slate-200 bg-white rounded-2xl shadow-sm">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#2874F0] to-blue-400 flex items-center justify-center text-2xl font-black text-white border-2 border-slate-250 shadow-md">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-none">{user?.full_name || "Demo User"}</h3>
                  <span className="text-[10px] text-[#2874F0] uppercase font-bold tracking-widest mt-1.5 block">
                    Active Account
                  </span>
                </div>
                <div className="w-full pt-4 border-t border-slate-100 space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={handleLogout} 
                    className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold"
                  >
                    Logout
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAdvancedOpen(true)} 
                    className="w-full border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-800 font-bold"
                  >
                    Advanced Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Settings Options Panel */}
            <div className="md:col-span-2 space-y-6">
              {/* Account settings */}
              <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#2874F0]" />
                    <CardTitle className="text-base text-slate-800 font-bold">Account Information</CardTitle>
                  </div>
                  <CardDescription className="text-slate-500 font-medium">Verify your platform access and identity details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Registered Email</label>
                      <Input value={user?.email || "demo@finsight.ai"} disabled className="bg-slate-50 border-slate-200 opacity-80 text-slate-700 cursor-not-allowed" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Full Name</label>
                      <Input value={user?.full_name || "Demo User"} disabled className="bg-slate-50 border-slate-200 opacity-80 text-slate-700 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-slate-500 font-semibold">Account ID</span>
                      <span className="text-xs text-slate-800 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200 select-all truncate">
                        {user?.id || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-slate-500 font-semibold">Member Since</span>
                      <span className="text-xs text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200 font-semibold">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "June 2026"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            </>
          )}
        </main>
      </div>

      {/* Advanced Settings Modal */}
      <Dialog isOpen={isAdvancedOpen} onClose={() => setIsAdvancedOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#2874F0]" />
            <DialogTitle>Advanced Settings</DialogTitle>
          </div>
          <DialogDescription>
            Access platform diagnostic tools and database controls.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <h4 className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Developer Sandbox Sandbox Tools
            </h4>
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              You can restore the default seed datasets for testing offer parsing, dashboard calculations, and transaction rewards.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsConfirmResetOpen(true)}
            className="w-full flex items-center justify-center gap-2 border-rose-250 text-rose-600 hover:bg-rose-50 hover:text-rose-705 font-bold text-xs py-2.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Database State
          </Button>
        </div>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog isOpen={isConfirmResetOpen} onClose={() => setIsConfirmResetOpen(false)}>
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-black">Reset Demo Data?</DialogTitle>
          <DialogDescription>
            This action will remove current demo transactions, cashback rules, recommendations, and restore default sample data.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex sm:justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setIsConfirmResetOpen(false)}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleResetSeed}
            loading={resetLoading}
            className="bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-sm"
          >
            Reset
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
