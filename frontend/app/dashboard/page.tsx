"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Percent, 
  AlertTriangle, 
  Sparkles, 
  CreditCard,
  ShoppingBag,
  Upload,
  RefreshCw,
  Plus,
  Clock,
  ShieldCheck,
  Activity,
  Link2,
  Target,
  Calendar,
  Coins,
  FileText,
  Building,
  Smartphone,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

import { 
  api, 
  authApi, 
  insightsApi, 
  budgetsApi, 
  savingsApi, 
  subscriptionsApi, 
  timelineApi, 
  reportsApi,
  User, 
  DashboardData, 
  BudgetSummary, 
  SavingsGoal, 
  Subscription, 
  TimelineEvent, 
  checkBackendHealth 
} from "../lib/api";
import { formatCurrency, formatDate, getCategoryBadgeClass } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import UploadModal from "../components/UploadModal";
import ServiceOffline from "../components/ServiceOffline";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

// Color palette for charts
const CATEGORY_COLORS = {
  Food: "#EF4444",        // Red
  Travel: "#2874F0",      // Flipkart Blue
  Shopping: "#10B981",    // Emerald Green
  Bills: "#F59E0B",       // Amber
  Healthcare: "#EC4899",  // Pink
  Education: "#8B5CF6",   // Violet
  Entertainment: "#F43F5E", // Rose
  Investments: "#06B6D4",   // Cyan
  Others: "#6B7280"       // Gray
};

function formatRelativeTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return "Recently";
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Dashboard & Module States
  const [data, setData] = useState<DashboardData | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel retrieval of health checks, user details, dashboard aggregates and module analytics
      const [health, userInfo, dashboardInfo, budgetsInfo, savingsInfo, subsInfo, timelineInfo] = await Promise.all([
        checkBackendHealth(),
        authApi.getMe(),
        insightsApi.getDashboardData(),
        budgetsApi.getSummary(),
        savingsApi.getAll(),
        subscriptionsApi.getAll(),
        timelineApi.getTimeline()
      ]);

      if (health.status !== "ONLINE") {
        setError(health.reason || "Backend server is unavailable. Please start the FastAPI server.");
        setLoading(false);
        return;
      }

      setUser(userInfo);
      setData(dashboardInfo);
      setBudgetSummary(budgetsInfo);
      setSavingsGoals(savingsInfo);
      setSubscriptions(subsInfo);
      setTimeline(timelineInfo);
    } catch (err: any) {
      console.error("Failed to load dashboard data", err);
      setError(err.message || "Failed to load dashboard data.");
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

  const handleLogout = () => {
    authApi.logout();
    router.push("/login");
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      await reportsApi.downloadReport();
    } catch (err: any) {
      console.error("Failed to download statement report", err);
      alert("Failed to export report. Please confirm statements are loaded.");
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading && !data && !error) {
    return (
      <div className="min-h-screen bg-[#F1F3F6] flex">
        {/* Navigation Sidebar */}
        <Sidebar onLogout={handleLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Panel Content Area */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 p-6 space-y-6 z-10 max-w-7xl w-full mx-auto animate-pulse">
            {/* Header Action Row Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-2">
                <div className="h-7 w-56 bg-slate-250 rounded-lg" />
                <div className="h-4 w-96 bg-slate-200 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                <div className="h-9 w-36 bg-slate-200 rounded-lg" />
                <div className="h-9 w-36 bg-slate-200 rounded-lg" />
              </div>
            </div>

            {/* Hero Section Skeleton */}
            <div className="h-40 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-350 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-white/20 rounded-md" />
                <div className="h-4 w-72 bg-white/20 rounded-md" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 backdrop-blur-sm space-y-1.5">
                  <div className="h-3 w-16 bg-white/20 rounded" />
                  <div className="h-6 w-24 bg-white/30 rounded-md" />
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 backdrop-blur-sm space-y-1.5">
                  <div className="h-3 w-16 bg-white/20 rounded" />
                  <div className="h-6 w-24 bg-white/30 rounded-md" />
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 backdrop-blur-sm space-y-1.5">
                  <div className="h-3 w-16 bg-white/20 rounded" />
                  <div className="h-6 w-24 bg-white/30 rounded-md" />
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/5 backdrop-blur-sm space-y-1.5">
                  <div className="h-3 w-16 bg-white/20 rounded" />
                  <div className="h-6 w-24 bg-white/30 rounded-md" />
                </div>
              </div>
            </div>

            {/* Grid Layout Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column Blocks */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-64 flex flex-col justify-between">
                  <div className="h-5 w-32 bg-slate-200 rounded-md" />
                  <div className="h-40 bg-slate-100 rounded-xl flex items-end justify-between p-4 space-x-2">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="bg-slate-200 rounded w-full" style={{ height: `${20 + (i % 4) * 20}%` }} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-60 space-y-4">
                    <div className="h-5 w-40 bg-slate-200 rounded-md" />
                    <div className="flex items-center justify-center">
                      <div className="h-28 w-28 rounded-full border-8 border-slate-100 border-t-slate-200 animate-spin" />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-60 space-y-3">
                    <div className="h-5 w-36 bg-slate-200 rounded-md" />
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <div className="h-4 w-20 bg-slate-150 rounded" />
                        <div className="h-4 w-12 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column Blocks */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-72 flex flex-col justify-between">
                  <div className="h-5 w-44 bg-slate-200 rounded-md" />
                  <div className="flex justify-center">
                    <div className="h-28 w-28 rounded-full border-[10px] border-slate-100 flex items-center justify-center">
                      <div className="h-4 w-10 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-md" />
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-60 space-y-4">
                  <div className="h-5 w-40 bg-slate-200 rounded-md" />
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                        <div className="h-3 w-16 bg-slate-150 rounded" />
                      </div>
                      <div className="h-5 w-16 bg-slate-200 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Pre-process pie chart data
  const pieData = data?.spending_by_category.map(cat => ({
    name: cat.category,
    value: parseFloat(cat.amount.toString()),
    color: CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Others
  })) || [];

  // Calculate dynamic components of health score
  const totalCashback = data?.stats.total_cashback || 0;
  const missedCashback = data?.stats.missed_cashback || 0;
  console.log("missedCashback type:", typeof missedCashback, missedCashback);
  const missedCashbackValue = Number(missedCashback ?? 0);
  
  // 1. Cashback Optimization (35%)
  const cashbackOpt = totalCashback + missedCashbackValue > 0 
    ? (totalCashback / (totalCashback + missedCashbackValue)) * 100 
    : 85;
    
  // 2. Budget Discipline (25%)
  const budgetedCats = budgetSummary?.categories.filter(c => c.category !== "*") || [];
  const underBudgetCats = budgetedCats.filter(c => c.spent <= c.limit);
  const budgetDiscipline = budgetedCats.length > 0 
    ? (underBudgetCats.length / budgetedCats.length) * 100 
    : 75;

  // 3. Savings Rate (25%)
  const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const savingsRate = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 60;

  // 4. Subscription Efficiency (15%)
  const totalSubCost = subscriptions.reduce((sum, s) => sum + Number(s.monthly_cost), 0);
  const totalSpend = data?.stats.total_spending || 1;
  const subRatio = totalSubCost / totalSpend;
  const subEfficiency = subRatio > 0.15 ? 65 : subRatio > 0.08 ? 80 : 95;

  // Dynamic Score
  const healthScore = Math.round(
    (cashbackOpt * 0.35) + 
    (budgetDiscipline * 0.25) + 
    (savingsRate * 0.25) + 
    (subEfficiency * 0.15)
  );

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-emerald-600", stroke: "#10B981", bg: "bg-emerald-50" };
    if (score >= 50) return { text: "Good", color: "text-amber-600", stroke: "#F59E0B", bg: "bg-amber-50" };
    return { text: "Needs Attention", color: "text-rose-600", stroke: "#EF4444", bg: "bg-rose-50" };
  };

  const status = getHealthStatus(healthScore);

  // Health Score Recommendations logic
  const recommendations: string[] = [];
  if (budgetDiscipline < 80) {
    recommendations.push("Reduce Food/Shopping spend to stay within configured limits.");
  }
  if (cashbackOpt < 80) {
    recommendations.push("Use recommend card on Swiggy/Zomato to retrieve missed rewards.");
  }
  if (subEfficiency < 80) {
    recommendations.push("Subscriptions cost exceeds 10% of spend. Audit unused bills.");
  }
  if (savingsGoals.length === 0) {
    recommendations.push("Set a savings target to begin portfolio growth optimization.");
  } else if (savingsRate < 50) {
    recommendations.push("Increase savings deposits toward targets to stay on timeline.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Excellent work! You are optimizing cashback and budgets perfectly.");
  }

  // SVG circular properties
  const scoreRadius = 36;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreDashoffset = scoreCircumference - (healthScore / 100) * scoreCircumference;

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      {/* Navigation Sidebar */}
      <Sidebar onLogout={handleLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Panel Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 space-y-6 z-10 max-w-7xl w-full mx-auto">
          {error ? (
            <ServiceOffline error={error} onRetry={loadData} />
          ) : (
            <>
              {/* Header Action Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-wide">FINANCIAL DASHBOARD</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    AI-driven analysis of your aggregated credit cards, UPI, and bank statement logs.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="flex items-center gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={() => router.push("/connect-accounts")} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm font-bold border-none transition-all duration-250">
                    <Link2 className="h-4 w-4" />
                    Connect Accounts
                  </Button>
                  <Button size="sm" onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 bg-[#2874F0] hover:bg-[#1B4FAD] text-white">
                    <Upload className="h-4 w-4" />
                    Import Statement
                  </Button>
                </div>
              </div>

              {/* Dashboard Hero Section */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2874F0] to-[#1B4FAD] p-6 text-white shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full filter blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-wide">
                      Welcome back, {user?.full_name || "Demo User"}!
                    </h2>
                    <p className="text-xs text-blue-100 mt-1">
                      Your FinSight AI financial optimization engine is active and analyzing your statements.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                      <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Total Spending</span>
                      <span className="text-lg sm:text-xl font-black">{formatCurrency(data?.stats.total_spending || 0)}</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                      <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Portfolio Savings</span>
                      <span className="text-lg sm:text-xl font-black">{formatCurrency(totalSaved)}</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                      <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Earned Rewards</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-300">{formatCurrency(totalCashback)}</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                      <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Financial Score</span>
                      <span className="text-lg sm:text-xl font-bold text-amber-300">{healthScore} / 100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Widgets Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Monthly Financial Summary + Trends */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Monthly Summary Widget */}
                  <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-50">
                      <CardTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#2874F0]" />
                        Monthly Financial Summary
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Diagnostics summary of active period cashflow, rewards, and limit warnings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Spending Burn</span>
                          <span className="text-sm font-black text-slate-700 block mt-1">
                            {formatCurrency(data?.stats.total_spending || 0)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Savings Contributions</span>
                          <span className="text-sm font-black text-slate-700 block mt-1">
                            {formatCurrency(totalSaved)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Rewards Captured</span>
                          <span className="text-sm font-black text-emerald-600 block mt-1">
                            {formatCurrency(totalCashback)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Rewards Leaked</span>
                          <span className="text-sm font-black text-rose-600 block mt-1">
                            {formatCurrency(missedCashback)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
                        <Sparkles className="h-4.5 w-4.5 text-[#2874F0] mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                            AI Diagnostic Insight
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-normal font-semibold">
                            {missedCashbackValue > 0 
                              ? `You missed ₹${missedCashbackValue.toFixed(0)} in rewards this month. Aligning your UPI payments to the optimal cards can capture this leaked margin.` 
                              : "Amazing cashback optimization! You are capturing 100% of available cashback deals this month."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Spending Trend (Bar) */}
                  <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-800 font-bold">Monthly Spending & Reward Trends</CardTitle>
                      <CardDescription>Bar chart analysis of total spends vs cashback margins</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                      {data && data.monthly_trends.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.monthly_trends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                            <Tooltip
                              formatter={(value) => formatCurrency(value as number)}
                              contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                            />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", color: "#334155" }} />
                            <Bar dataKey="spending" name="Monthly Spends" fill="#2874F0" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cashback" name="Rewards Earned" fill="#10B981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">No trends data available</div>
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* Column 3: Health Score & Recommendations */}
                <div className="space-y-6">
                  
                  {/* Financial Health Score Widget */}
                  <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardHeader className="pb-2 border-b border-slate-50">
                      <CardTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-5 w-5 text-[#2874F0]" />
                        Financial Health Score
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Composite rating of savings, cashbacks, and budget discipline.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex flex-col items-center">
                      <div className="relative flex items-center justify-center mb-4">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r={scoreRadius}
                            stroke="#F1F5F9"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r={scoreRadius}
                            stroke={status.stroke}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={scoreCircumference}
                            strokeDashoffset={scoreDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-in-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-black text-slate-800">{healthScore}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                        </div>
                      </div>

                      <Badge className={`${status.bg} ${status.color} border border-transparent font-bold text-xs px-3 py-1 rounded-full mb-4`}>
                        {status.text} Index
                      </Badge>

                      <div className="w-full text-left space-y-3 pt-3 border-t border-slate-50">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          AI Recommendation Plan
                        </h4>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] font-bold text-slate-600">
                              <Sparkles className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>

              </div>

              {/* Row 4: Timeline vs Account Health & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Recent Financial Activity Widget (Timeline) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-4.5 w-4.5 text-[#2874F0]" />
                      Recent Financial Activity (Timeline)
                    </h3>
                  </div>

                  <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      {timeline.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-12">
                          No financial events logged. Sync your statement to trigger timeline alerts.
                        </p>
                      ) : (
                        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 max-h-96 overflow-y-auto pr-2">
                          {timeline.map((event) => {
                            let iconBg = "bg-blue-50 text-[#2874F0]";
                            if (event.status === "SUCCESS") iconBg = "bg-emerald-50 text-emerald-600";
                            if (event.status === "WARNING") iconBg = "bg-rose-50 text-rose-600";

                            return (
                              <div key={event.id} className="relative group">
                                {/* Bullet indicator */}
                                <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                                  event.status === "SUCCESS" 
                                    ? "bg-emerald-500" 
                                    : event.status === "WARNING" 
                                      ? "bg-rose-500" 
                                      : "bg-[#2874F0]"
                                }`} />

                                <div className="flex justify-between items-start gap-4 text-xs font-semibold text-slate-700">
                                  <div className="space-y-0.5">
                                    <h4 className="font-black text-slate-800">{event.title}</h4>
                                    <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                                      {event.description}
                                    </p>
                                    <span className="text-[10px] text-slate-405 font-medium block">
                                      {formatRelativeTime(event.date)}
                                    </span>
                                  </div>

                                  {event.amount && (
                                    <span className={`font-black ${
                                      event.type === "CASHBACK_EARNED" || event.type === "GOAL_CONTRIBUTION"
                                        ? "text-emerald-600"
                                        : "text-slate-800"
                                    }`}>
                                      {formatCurrency(Number(event.amount))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Column 3: Connected Account Health + Quick Actions */}
                <div className="space-y-6">
                  
                  {/* Connected Account Health */}
                  <Card className="border-none shadow-sm bg-white rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-50">
                      <CardTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 className="h-5 w-5 text-[#2874F0]" />
                        Connected Account Health
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Feeds verification sync status.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-50 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4.5 w-4.5 text-[#2874F0]" />
                            <span>Google Pay</span>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-50 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4.5 w-4.5 text-purple-500" />
                            <span>PhonePe</span>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
                          <div className="flex items-center gap-2">
                            <Building className="h-4.5 w-4.5 text-slate-500" />
                            <span>HDFC Bank Feed</span>
                          </div>
                          <Badge className="bg-slate-50 text-slate-500 border border-slate-200 font-bold">
                            Idle
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/connect-accounts")}
                        className="w-full mt-4 text-xs font-bold border-slate-200 text-slate-650 hover:bg-slate-50 flex items-center justify-center gap-1.5 rounded-xl h-9"
                      >
                        Manage Feeds
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Actions Panel */}
                  <Card className="border-none shadow-sm bg-white rounded-2xl bg-gradient-to-br from-blue-50/40 to-indigo-50/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Quick Command Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-2.5">
                      <Button
                        onClick={() => router.push("/budget")}
                        className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-2 rounded-xl flex items-center justify-start gap-2 h-10 shadow-sm"
                      >
                        <Coins className="h-4.5 w-4.5 text-[#2874F0]" />
                        Configure Budgets Limits
                      </Button>
                      
                      <Button
                        onClick={() => router.push("/savings-goals")}
                        className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-2 rounded-xl flex items-center justify-start gap-2 h-10 shadow-sm"
                      >
                        <Target className="h-4.5 w-4.5 text-emerald-500" />
                        Deposit Goal Savings
                      </Button>
                      
                      <Button
                        onClick={handleDownloadReport}
                        disabled={downloadingReport}
                        className="w-full bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold text-xs py-2 rounded-xl flex items-center justify-start gap-2 h-10 shadow"
                      >
                        {downloadingReport ? (
                          <>
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            Compiling Statement Report...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4.5 w-4.5" />
                            Generate Financial Report
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                </div>

              </div>

              {/* Recent Transactions List Panel */}
              <Card className="border-slate-200 bg-white rounded-2xl hover:-translate-y-0.5 transition-all duration-300">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-base text-slate-800 font-bold">Recent Transactions Feed</CardTitle>
                    <CardDescription>Latest parsed records from active statements</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/transactions")} className="rounded-xl font-bold">
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Merchant</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Method Used</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-right text-emerald-700">Cashback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data && data.recent_transactions.length > 0 ? (
                          data.recent_transactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors text-slate-800">
                              <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{formatDate(tx.date)}</td>
                              <td className="py-3.5 px-4 font-bold">{tx.merchant}</td>
                              <td className="py-3.5 px-4">
                                <Badge className={getCategoryBadgeClass(tx.category)}>
                                  {tx.category}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-xs text-slate-500">{tx.payment_method}</td>
                              <td className="py-3.5 px-4 text-right font-bold">{formatCurrency(tx.amount)}</td>
                              <td className="py-3.5 px-4 text-right font-black text-emerald-600">{formatCurrency(tx.cashback_earned)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-500 font-bold">
                              No transactions imported yet. Click "Import Statement" or select connected accounts to seed records.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Statement Importer Popup Modal */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={handleRefresh} 
      />
    </div>
  );
}
