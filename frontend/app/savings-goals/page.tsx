"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Coins, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  DollarSign,
  XCircle,
  Loader2
} from "lucide-react";

import { 
  savingsApi, 
  authApi, 
  User, 
  SavingsGoal, 
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

export default function SavingsGoalsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Goals States
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  
  // Create Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Add Funds Modal States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

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
      
      const goalsList = await savingsApi.getAll();
      setGoals(goalsList);
    } catch (err: any) {
      console.error("Failed to load savings goals", err);
      setError(err.message || "Failed to load savings goals.");
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
    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("");
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      setCreateError("Goal name is required.");
      return;
    }
    if (!goalTarget || isNaN(Number(goalTarget)) || Number(goalTarget) <= 0) {
      setCreateError("Please enter a valid target amount greater than 0.");
      return;
    }
    const currentVal = goalCurrent ? Number(goalCurrent) : 0;
    if (isNaN(currentVal) || currentVal < 0) {
      setCreateError("Initial funds must be 0 or a positive number.");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      await savingsApi.create(goalName, Number(goalTarget), currentVal);
      setCreateSuccess("Savings goal created successfully!");
      
      const goalsList = await savingsApi.getAll();
      setGoals(goalsList);
      
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to create goal", err);
      setCreateError(err.message || "Failed to create savings goal.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmount("");
    setDepositError(null);
    setDepositSuccess(null);
    setIsDepositModalOpen(true);
  };

  const handleDepositFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      setDepositError("Please enter a valid deposit amount greater than 0.");
      return;
    }

    setDepositSubmitting(true);
    setDepositError(null);
    setDepositSuccess(null);

    try {
      await savingsApi.addFunds(selectedGoal.id, Number(depositAmount));
      setDepositSuccess(`Deposited ${formatCurrency(Number(depositAmount))} successfully!`);
      
      const goalsList = await savingsApi.getAll();
      setGoals(goalsList);
      
      setTimeout(() => {
        setIsDepositModalOpen(false);
        setDepositSuccess(null);
        setSelectedGoal(null);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to deposit funds", err);
      setDepositError(err.message || "Failed to deposit funds. Please try again.");
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete your savings goal for '${name}'? This action cannot be undone.`)) {
      return;
    }

    try {
      await savingsApi.delete(id);
      setGoals((prev) => prev.filter(g => g.id !== id));
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete savings goal. Please try again.");
    }
  };

  if (!mounted) return null;

  // Aggregate stats
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

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
                <h2 className="text-2xl font-black text-slate-800 tracking-wide">SAVINGS GOALS</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define long-term purchase targets, allocate deposit funds, and monitor circular progress status.
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenCreate}
              className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              New Savings Goal
            </Button>
          </div>

          {error ? (
            <ServiceOffline error={error} onRetry={loadData} />
          ) : (
            <div className="space-y-6">
              
              {/* Overall Progress Banner */}
              {goals.length > 0 && (
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Overall Portfolio Savings Progress
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-800">
                            {formatCurrency(totalSaved)}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            saved of {formatCurrency(totalTarget)} target
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          You have completed {goals.filter(g => g.status === "COMPLETED").length} of {goals.length} target goals! Keep saving!
                        </p>
                      </div>

                      <div className="w-full md:w-96 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>Progress Score</span>
                          <span>{overallProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, overallProgress)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goals Cards Grid */}
              {goals.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 mb-3">
                    <Target className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700">No savings targets set yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Establish goal tags for items like MacBook Pro, new car, vacation budget, or emergency reserve.
                  </p>
                  <Button 
                    onClick={handleOpenCreate} 
                    className="mt-4 bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold text-xs rounded-xl"
                  >
                    Setup First Goal
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.map((goal) => {
                    const currentAmt = Number(goal.current_amount);
                    const targetAmt = Number(goal.target_amount);
                    const progress = targetAmt > 0 ? (currentAmt / targetAmt) * 100 : 0;
                    const isCompleted = goal.status === "COMPLETED" || progress >= 100;

                    // Circular Progress Math
                    const radius = 32;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (Math.min(100, progress) / 100) * circumference;

                    return (
                      <Card key={goal.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow transition-shadow relative">
                        <CardContent className="p-6 space-y-4">
                          
                          {/* Top Row: Goal Title & Action */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 pr-2">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate block max-w-[150px]">
                                {goal.name}
                              </span>
                              <Badge className={
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold"
                                  : "bg-blue-50 text-[#2874F0] border border-blue-100 font-bold"
                              }>
                                {isCompleted ? "Goal Achieved!" : "In Progress"}
                              </Badge>
                            </div>

                            {/* SVG circular progress indicator */}
                            <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r={radius}
                                  className="stroke-slate-100"
                                  strokeWidth="6"
                                  fill="transparent"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r={radius}
                                  className={`transition-all duration-500 ease-in-out ${
                                    isCompleted ? "stroke-emerald-500" : "stroke-[#2874F0]"
                                  }`}
                                  strokeWidth="6"
                                  fill="transparent"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-black text-slate-800">{progress.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Key numbers */}
                          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3 text-xs font-bold text-slate-600">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Saved Balance</span>
                              <span className="text-sm font-black text-slate-800">{formatCurrency(currentAmt)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Target Limit</span>
                              <span className="text-sm font-black text-slate-800">{formatCurrency(targetAmt)}</span>
                            </div>
                          </div>

                          {/* Action Buttons Row */}
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              type="button"
                              onClick={() => handleOpenDeposit(goal)}
                              disabled={isCompleted}
                              className="flex-1 bg-blue-50 hover:bg-[#2874F0]/10 border border-blue-200 text-[#2874F0] font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                            >
                              <Coins className="h-3.5 w-3.5" />
                              Deposit
                            </Button>
                            
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleDeleteGoal(goal.id, goal.name)}
                              className="h-9 w-9 p-0 text-rose-500 hover:bg-rose-50 border-slate-200 rounded-xl flex items-center justify-center"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create Savings Goal Modal */}
      <Dialog isOpen={isCreateModalOpen} onClose={() => !createSubmitting && setIsCreateModalOpen(false)}>
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Target className="h-5 w-5 text-[#2874F0]" />
              New Savings Target
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Establish a dedicated savings goal to organize funds and monitor progress towards your target.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Goal name */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Goal Name / Asset Tag
              </label>
              <Input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. MacBook Pro, Emergency Reserve"
                disabled={createSubmitting}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0] font-bold"
              />
            </div>

            {/* Target Amount */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Target Fund Amount (₹)
              </label>
              <Input
                type="number"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="e.g. 150000"
                disabled={createSubmitting}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0] font-bold"
              />
            </div>

            {/* Initial Current Amount */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Initial Saved Amount (Optional)
              </label>
              <Input
                type="number"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                placeholder="e.g. 10000"
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
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Create Goal
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Deposit Funds Modal */}
      <Dialog isOpen={isDepositModalOpen} onClose={() => !depositSubmitting && setIsDepositModalOpen(false)}>
        <form onSubmit={handleDepositFunds} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              Deposit Savings Funds
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Allocate money from your virtual balance directly into your savings target for &apos;{selectedGoal?.name}&apos;.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Deposit Amount (₹)
              </label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 5000"
                disabled={depositSubmitting}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0] font-bold"
              />
            </div>

            {depositError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-rose-600 text-[11px] font-semibold leading-relaxed">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{depositError}</span>
              </div>
            )}

            {depositSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-emerald-600 text-[11px] font-semibold leading-relaxed">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{depositSuccess}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDepositModalOpen(false)}
              disabled={depositSubmitting}
              className="border-slate-200 rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={depositSubmitting}
              className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              {depositSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Depositing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Deposit Funds
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
