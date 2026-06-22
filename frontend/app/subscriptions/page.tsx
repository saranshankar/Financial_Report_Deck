"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle,
  Brain,
  XCircle,
  Loader2,
  Clock
} from "lucide-react";

import { 
  subscriptionsApi, 
  authApi, 
  User, 
  Subscription, 
  checkBackendHealth 
} from "../lib/api";
import { formatCurrency } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ServiceOffline from "../components/ServiceOffline";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Subscriptions States
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectSuccess, setDetectSuccess] = useState<string | null>(null);
  
  // Create Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [subCost, setSubCost] = useState("");
  const [subRenewalDay, setSubRenewalDay] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

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
      
      const subsList = await subscriptionsApi.getAll();
      setSubscriptions(subsList);
    } catch (err: any) {
      console.error("Failed to load subscriptions", err);
      setError(err.message || "Failed to load subscriptions data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  const handleOpenCreate = () => {
    setSubName("");
    setSubCost("");
    setSubRenewalDay("");
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      setCreateError("Subscription name is required.");
      return;
    }
    if (!subCost || isNaN(Number(subCost)) || Number(subCost) <= 0) {
      setCreateError("Please enter a valid monthly cost greater than 0.");
      return;
    }
    const day = Number(subRenewalDay);
    if (!subRenewalDay || isNaN(day) || day < 1 || day > 31) {
      setCreateError("Please enter a valid renewal day of the month (1 to 31).");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      await subscriptionsApi.create(subName, Number(subCost), day);
      setCreateSuccess("Subscription saved successfully!");
      
      const subsList = await subscriptionsApi.getAll();
      setSubscriptions(subsList);
      
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to save subscription", err);
      setCreateError(err.message || "Failed to save subscription details.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDetectSubscriptions = async () => {
    setDetecting(true);
    setDetectSuccess(null);
    try {
      const updatedList = await subscriptionsApi.detect();
      setSubscriptions(updatedList);
      setDetectSuccess("AI Scanner completed! Detected and updated recurring subscription bills.");
      setTimeout(() => setDetectSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Subscription scan failed. Ensure transactions are loaded.");
    } finally {
      setDetecting(false);
    }
  };

  const handleDeleteSub = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the subscription tracker for '${name}'?`)) {
      return;
    }

    try {
      await subscriptionsApi.delete(id);
      setSubscriptions((prev) => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete subscription. Please try again.");
    }
  };

  if (!mounted) return null;

  // Aggregate stats
  const totalMonthlyCost = subscriptions.reduce((sum, s) => sum + Number(s.monthly_cost), 0);
  const totalAnnualCost = totalMonthlyCost * 12;

  // Sort upcoming renewals
  const todayDay = new Date().getDate();
  const sortedRenewals = [...subscriptions].sort((a, b) => {
    const diffA = a.renewal_day >= todayDay ? a.renewal_day - todayDay : a.renewal_day + 30 - todayDay;
    const bgDiff = b.renewal_day >= todayDay ? b.renewal_day - todayDay : b.renewal_day + 30 - todayDay;
    return diffA - bgDiff;
  });

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      {/* Sidebar navigation */}
      <Sidebar onLogout={() => { authApi.logout(); router.push("/login"); }} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main panel */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 space-y-6 z-10 max-w-7xl w-full mx-auto">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")} 
                className="h-9 w-9 p-0 flex items-center justify-center rounded-xl bg-white border-slate-200 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-wide">SUBSCRIPTION AUDITS</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track recurring services, scan for hidden monthly bills, and auditing annual platform cost metrics.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Button
                onClick={handleDetectSubscriptions}
                disabled={detecting}
                className="bg-white border border-[#2874F0]/30 hover:bg-[#2874F0]/5 text-[#2874F0] font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {detecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    AI Detect Subscriptions
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleOpenCreate}
                className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Subscription
              </Button>
            </div>
          </div>

          {error ? (
            <ServiceOffline error={error} onRetry={loadData} />
          ) : (
            <div className="space-y-6">
              
              {/* Scan Success Banner */}
              {detectSuccess && (
                <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-sm animate-fade-in">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black uppercase tracking-wider">AI Scan Finished</h4>
                    <p className="text-[11px] leading-relaxed font-semibold">{detectSuccess}</p>
                  </div>
                </div>
              )}

              {/* Overview Cost Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Monthly cost Card */}
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[#2874F0]" />
                      Total Monthly Costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-800">
                        {formatCurrency(totalMonthlyCost)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/mo</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-2">
                      Across {subscriptions.length} active platform subscriptions.
                    </p>
                  </CardContent>
                </Card>

                {/* Annual cost Card */}
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Annual Subscription Budget
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-800">
                        {formatCurrency(totalAnnualCost)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/yr</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-2">
                      Forecasted expense burn based on current active memberships.
                    </p>
                  </CardContent>
                </Card>

                {/* Subscriptions waste notification */}
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Optimization Potential
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {subscriptions.length > 3 ? (
                      <div className="space-y-1">
                        <span className="text-sm font-black text-amber-600 block">High Density Audit</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          You have {subscriptions.length} recurring accounts. We recommend reviewing unused subscriptions to save up to {formatCurrency(totalMonthlyCost * 0.25)}/month.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-sm font-black text-emerald-600 block">Healthy Density</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Your active subscriptions are low, reducing waste risk. Trigger the AI scanner to confirm no hidden bills exist.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Subscriptions List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Active Subscriptions Feeds
                  </h3>

                  {subscriptions.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 mb-3">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-black text-slate-700">No active subscriptions monitored</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        You can manually add subscriptions or click &apos;AI Detect Subscriptions&apos; to scan statements.
                      </p>
                      <Button 
                        onClick={handleOpenCreate} 
                        className="mt-4 bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold text-xs rounded-xl"
                      >
                        Add First Subscription
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {subscriptions.map((sub) => (
                        <Card key={sub.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow transition-shadow">
                          <CardContent className="p-5 flex justify-between items-center gap-4">
                            <div className="space-y-1.5 max-w-[70%]">
                              <h4 className="text-sm font-black text-slate-800 truncate block">
                                {sub.name}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge className="bg-blue-50 text-[#2874F0] border border-blue-100 text-[9px] font-bold">
                                  Day {sub.renewal_day} Renewal
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  Annual: {formatCurrency(Number(sub.monthly_cost) * 12)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right space-y-2 flex flex-col items-end flex-shrink-0">
                              <span className="text-base font-black text-slate-800 block">
                                {formatCurrency(Number(sub.monthly_cost))}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSub(sub.id, sub.name)}
                                className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 border-slate-200 rounded-lg flex items-center justify-center"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                </div>

                {/* Upcoming Renewals & Alerts Side Panel */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4.5 w-4.5 text-[#2874F0]" />
                    Upcoming Billing Calendar
                  </h3>

                  <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardContent className="p-4">
                      {sortedRenewals.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8">
                          No upcoming renewals tracked.
                        </p>
                      ) : (
                        <div className="space-y-3.5">
                          {sortedRenewals.map((sub) => {
                            const daysUntil = sub.renewal_day >= todayDay 
                              ? sub.renewal_day - todayDay 
                              : sub.renewal_day + 30 - todayDay;
                            
                            const isUrgent = daysUntil <= 3;

                            return (
                              <div key={sub.id} className="flex items-start justify-between text-xs py-1 border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-700 block">
                                    {sub.name}
                                  </span>
                                  {isUrgent ? (
                                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 inline-block">
                                      Renewing in {daysUntil} {daysUntil === 1 ? "day" : "days"}!
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-slate-400 block">
                                      Renewing in {daysUntil} days
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-slate-800 text-right block pt-0.5">
                                  {formatCurrency(Number(sub.monthly_cost))}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

              </div>

            </div>
          )}
        </main>
      </div>

      {/* Configure Subscription Modal */}
      <Dialog isOpen={isCreateModalOpen} onClose={() => !createSubmitting && setIsCreateModalOpen(false)}>
        <form onSubmit={handleCreateSub} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2874F0]" />
              New Subscription Audit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Establish a manual subscription trigger to audit annual cost leaks and renewal alerts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Subscription name */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Service Provider / Name
              </label>
              <Input
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g. Netflix, Spotify Premium"
                disabled={createSubmitting}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0] font-bold"
              />
            </div>

            {/* Monthly Cost */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Monthly cost Bill (₹)
              </label>
              <Input
                type="number"
                value={subCost}
                onChange={(e) => setSubCost(e.target.value)}
                placeholder="e.g. 499"
                disabled={createSubmitting}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0] font-bold"
              />
            </div>

            {/* Renewal Day */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Renewal Day of Month (1 - 31)
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                value={subRenewalDay}
                onChange={(e) => setSubRenewalDay(e.target.value)}
                placeholder="e.g. 15"
                disabled={createSubmitting}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0] font-bold"
              />
            </div>

            {createError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-rose-600 text-[11px] font-semibold leading-relaxed">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-emerald-600 text-[11px] font-semibold leading-relaxed">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createSubmitting}
              className="border-slate-200 rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSubmitting}
              className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              {createSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
