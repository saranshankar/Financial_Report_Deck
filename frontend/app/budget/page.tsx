"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  AlertTriangle, 
  CheckCircle2, 
  PieChart, 
  Wallet, 
  TrendingUp, 
  Calendar,
  XCircle,
  Loader2
} from "lucide-react";

import { 
  budgetsApi, 
  authApi, 
  User, 
  BudgetSummary, 
  BudgetSummaryItem,
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

const CATEGORIES = [
  "Food",
  "Shopping",
  "Travel",
  "Bills",
  "Healthcare",
  "Education",
  "Entertainment",
  "Investments",
  "Others",
  "*" // Total Budget
];

export default function BudgetPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Budget States
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  
  // Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("Food");
  const [modalLimit, setModalLimit] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const loadData = async (month?: string) => {
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
      
      const budgetSummary = await budgetsApi.getSummary(month);
      setSummary(budgetSummary);
      if (budgetSummary.month) {
        setSelectedMonth(budgetSummary.month);
      }
    } catch (err: any) {
      console.error("Failed to load budgets metadata", err);
      setError(err.message || "Failed to load budget management data.");
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

    // Default to current month YYYY-MM
    const currentMonth = new Date().toISOString().substring(0, 7);
    setSelectedMonth(currentMonth);
    loadData(currentMonth);
  }, [router]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedMonth(val);
    loadData(val);
  };

  const handleOpenAddOrEdit = (category?: string, limit?: number) => {
    setModalCategory(category || "Food");
    setModalLimit(limit !== undefined ? limit.toString() : "");
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalLimit || isNaN(Number(modalLimit)) || Number(modalLimit) <= 0) {
      setModalError("Please enter a valid budget limit amount greater than 0.");
      return;
    }

    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      await budgetsApi.createOrUpdate(modalCategory, Number(modalLimit), selectedMonth);
      setModalSuccess("Budget limit saved successfully!");
      
      // Reload budget data
      const budgetSummary = await budgetsApi.getSummary(selectedMonth);
      setSummary(budgetSummary);
      
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to save budget", err);
      setModalError(err.message || "Failed to save budget limit. Please try again.");
    } finally {
      setModalSubmitting(false);
    }
  };

  if (!mounted) return null;

  // Split budgets into special total budget cap card vs category budgets
  const totalBudget = summary?.categories.find(c => c.category === "*") || (summary?.total_budget_limit ? {
    category: "*",
    limit: summary.total_budget_limit,
    spent: summary.total_spend,
    remaining: Math.max(0, summary.total_budget_limit - summary.total_spend),
    percentage: summary.total_budget_limit > 0 ? (summary.total_spend / summary.total_budget_limit) * 100 : 0
  } : null);

  const categoryBudgets = summary?.categories.filter(c => c.category !== "*") || [];

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
                <h2 className="text-2xl font-black text-slate-800 tracking-wide">BUDGET MANAGEMENT</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish category spending caps, view real-time overrun indicators, and prevent excessive expenses.
                </p>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="text-xs font-bold text-slate-700 focus:outline-none bg-transparent"
                />
              </div>
              <Button
                onClick={() => handleOpenAddOrEdit()}
                className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Configure Budget
              </Button>
            </div>
          </div>

          {error ? (
            <ServiceOffline error={error} onRetry={() => loadData(selectedMonth)} />
          ) : (
            <div className="space-y-6">
              
              {/* Alert Overrun Banners */}
              {summary && summary.alerts && summary.alerts.length > 0 && (
                <div className="space-y-3">
                  {summary.alerts.map((alert, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
                        alert.type === "CRITICAL"
                          ? "bg-rose-50 border-rose-200 text-rose-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                        alert.type === "CRITICAL" ? "text-rose-500" : "text-amber-500"
                      }`} />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          {alert.type === "CRITICAL" ? "Critical Budget Alert" : "Budget Cap Warning"}
                        </h4>
                        <p className="text-[11px] leading-relaxed font-semibold">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Monthly Limit Card */}
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-[#2874F0]" />
                      Total Monthly Budget Cap
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {totalBudget && totalBudget.limit > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-800">
                            {formatCurrency(totalBudget.limit)}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/mo</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Allocated category limits: {categoryBudgets.length} configurations.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-slate-700">No overall budget set</h4>
                        <p className="text-[10px] text-slate-400">
                          Set a total monthly ceiling cap to unlock automated insights.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenAddOrEdit("*")}
                          className="h-8 text-xs font-bold text-[#2874F0] border-blue-200 hover:bg-blue-50"
                        >
                          Set Global Limit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Total Spending Progress */}
                <Card className="border-none shadow-sm bg-white rounded-2xl md:col-span-2">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Spending Burn Rate Progress
                    </CardDescription>
                    {totalBudget && totalBudget.limit > 0 && (
                      <Badge className={
                        totalBudget.percentage >= 100
                          ? "bg-rose-50 text-rose-600 border border-rose-200 font-bold"
                          : totalBudget.percentage >= 80
                            ? "bg-amber-50 text-amber-600 border border-amber-200 font-bold"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold"
                      }>
                        {totalBudget.percentage.toFixed(0)}% Consumed
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Spent so far</span>
                        <span className="text-lg font-black text-slate-800">
                          {formatCurrency(summary?.total_spend || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Remaining Balance</span>
                        <span className={`text-lg font-black ${
                          totalBudget && totalBudget.limit > 0 && totalBudget.spent >= totalBudget.limit
                            ? "text-rose-600"
                            : "text-[#2874F0]"
                        }`}>
                          {totalBudget && totalBudget.limit > 0 
                            ? formatCurrency(Math.max(0, totalBudget.limit - totalBudget.spent))
                            : formatCurrency(0)
                          }
                        </span>
                      </div>
                    </div>

                    {totalBudget && totalBudget.limit > 0 && (
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              totalBudget.percentage >= 100 
                                ? "bg-rose-500" 
                                : totalBudget.percentage >= 80 
                                  ? "bg-amber-500" 
                                  : "bg-[#2874F0]"
                            }`}
                            style={{ width: `${Math.min(100, totalBudget.percentage)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                          <span>₹0</span>
                          <span>Cap: {formatCurrency(totalBudget.limit)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Section: Category Budgets Progress Grids */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <PieChart className="h-4.5 w-4.5 text-[#2874F0]" />
                    Category-Wise Limit Audits
                  </h3>
                  <span className="text-xs text-slate-400 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {categoryBudgets.length} active limits
                  </span>
                </div>

                {categoryBudgets.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 mb-3">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-black text-slate-700">No category limits set</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Setup specific category caps (like Food, Shopping, bills) to prevent single-category overspending.
                    </p>
                    <Button 
                      onClick={() => handleOpenAddOrEdit()} 
                      className="mt-4 bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold text-xs rounded-xl"
                    >
                      Configure First Cap
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryBudgets.map((b) => {
                      const isOverspent = b.percentage >= 100;
                      const isWarning = b.percentage >= 80 && b.percentage < 100;
                      const isConfigured = b.limit > 0;
                      
                      return (
                        <Card key={b.category} className="border-none shadow-sm bg-white rounded-2xl hover:shadow transition-shadow overflow-hidden">
                          <CardContent className="p-6 space-y-4">
                            
                            {/* Card Header Info */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                  {b.category} Budget
                                </span>
                                <span className="text-[10px] text-slate-400 block font-bold">
                                  {isConfigured ? `Cap: ${formatCurrency(b.limit)}` : "Limit not set"}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                {isConfigured && (
                                  <Badge className={
                                    isOverspent
                                      ? "bg-rose-50 text-rose-600 border border-rose-200 font-bold"
                                      : isWarning
                                        ? "bg-amber-50 text-amber-600 border border-amber-200 font-bold"
                                        : "bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold"
                                  }>
                                    {b.percentage.toFixed(0)}%
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenAddOrEdit(b.category, isConfigured ? b.limit : undefined)}
                                  className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Financial Stats */}
                            <div className="grid grid-cols-3 gap-2 border-y border-slate-50 py-3 text-center text-xs">
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase block">Spent</span>
                                <span className="font-bold text-slate-700">{formatCurrency(b.spent)}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase block">Limit</span>
                                <span className="font-bold text-slate-700">
                                  {isConfigured ? formatCurrency(b.limit) : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase block">Remaining</span>
                                <span className={`font-bold ${isOverspent ? "text-rose-600" : "text-[#2874F0]"}`}>
                                  {isConfigured ? formatCurrency(b.remaining) : "N/A"}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            {isConfigured && (
                              <div className="space-y-1">
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isOverspent 
                                        ? "bg-rose-500" 
                                        : isWarning 
                                          ? "bg-amber-500" 
                                          : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                                  />
                                </div>
                                {isOverspent && (
                                  <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Limit exceeded by {formatCurrency(b.spent - b.limit)}!
                                  </span>
                                )}
                              </div>
                            )}

                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Configure Budget Limit Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => !modalSubmitting && setIsModalOpen(false)}>
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#2874F0]" />
              Configure Budget Cap
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Set or update your monthly expense limit for a specific transaction category.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Spending Category
              </label>
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                disabled={modalSubmitting}
                className="w-full rounded-xl border border-slate-200 text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#2874F0] bg-white font-bold text-slate-700"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "*" ? "Global / Overall Limit (*)" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit amount input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Monthly Cap Limit (₹)
              </label>
              <Input
                type="number"
                value={modalLimit}
                onChange={(e) => setModalLimit(e.target.value)}
                placeholder="e.g. 5000"
                disabled={modalSubmitting}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0] font-bold"
              />
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-rose-600 text-[11px] font-semibold leading-relaxed">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-emerald-600 text-[11px] font-semibold leading-relaxed">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={modalSubmitting}
              className="border-slate-200 rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={modalSubmitting}
              className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              {modalSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save Cap Limit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
