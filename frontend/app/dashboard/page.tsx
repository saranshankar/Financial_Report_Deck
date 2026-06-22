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
  Activity
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

import { api, authApi, insightsApi, User, DashboardData, checkBackendHealth } from "../lib/api";
import { formatCurrency, formatDate, getCategoryBadgeClass } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import UploadModal from "../components/UploadModal";
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

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        setError("Backend server is unavailable. Please start the FastAPI server.");
        setLoading(false);
        return;
      }

      const userInfo = await authApi.getMe();
      setUser(userInfo);
      
      const dashboardInfo = await insightsApi.getDashboardData();
      setData(dashboardInfo);
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
    setLoading(true);
    setError(null);
    try {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        setError("Backend server is unavailable. Please start the FastAPI server.");
        setLoading(false);
        return;
      }
      const dashboardInfo = await insightsApi.getDashboardData();
      setData(dashboardInfo);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to refresh dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data && !error) {
    return (
      <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center relative">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2874F0]" />
          <p className="text-sm font-semibold text-slate-500">Synthesizing Financial Intel...</p>
        </div>
      </div>
    );
  }

  // Pre-process pie chart data (map to our hex color rules)
  const pieData = data?.spending_by_category.map(cat => ({
    name: cat.category,
    value: parseFloat(cat.amount.toString()),
    color: CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Others
  })) || [];

  // Calculate health score dynamically
  const totalCashback = data?.stats.total_cashback || 0;
  const missedCashback = data?.stats.missed_cashback || 0;
  const totalSavingsValue = totalCashback + (data?.stats.monthly_savings_prediction || 0);

  const healthScore = totalCashback + missedCashback > 0 
    ? Math.round((totalCashback / (totalCashback + missedCashback)) * 100) 
    : 85; 

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-emerald-600", stroke: "#10B981", bg: "bg-emerald-50" };
    if (score >= 50) return { text: "Good", color: "text-amber-600", stroke: "#F59E0B", bg: "bg-amber-50" };
    return { text: "Needs Attention", color: "text-rose-600", stroke: "#EF4444", bg: "bg-rose-50" };
  };

  const status = getHealthStatus(healthScore);

  // SVG circular properties
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      {/* Navigation Sidebar */}
      <Sidebar onLogout={handleLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Panel Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 space-y-6 z-10 max-w-7xl w-full mx-auto">
          {error ? (
            <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center max-w-xl mx-auto my-12">
              <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Service Offline</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                {error}
              </p>
              <Button onClick={loadData} className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold">
                Retry Connection
              </Button>
            </div>
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
                  <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Total Savings</span>
                  <span className="text-lg sm:text-xl font-black">{formatCurrency(totalSavingsValue)}</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Active Offers</span>
                  <span className="text-lg sm:text-xl font-black">3 Active Offers</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Potential Rewards</span>
                  <span className="text-lg sm:text-xl font-black">{formatCurrency(totalCashback + missedCashback)}</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Optimization Index</span>
                  <span className="text-lg sm:text-xl font-bold text-emerald-300">{healthScore}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Widget 1: Financial Health Score */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-5 flex flex-col items-center text-center justify-between h-full">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="h-4 w-4 text-[#2874F0]" />
                    Reward Health Score
                  </span>
                  <Badge className={`${status.bg} ${status.color} border border-transparent text-[10px] font-bold px-2 py-0.5`}>
                    {status.text}
                  </Badge>
                </div>

                <div className="relative flex items-center justify-center my-4">
                  <svg className="w-28 h-28 transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                      cx="56"
                      cy="56"
                      r={radius}
                      stroke="#E2E8F0"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="56"
                      cy="56"
                      r={radius}
                      stroke={status.stroke}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-800">{healthScore}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 px-2 leading-relaxed">
                  Your optimization rate is <span className="font-bold text-slate-800">{healthScore}%</span>. 
                  {healthScore >= 80 
                    ? " Excellent work! You are maximizing cashback on almost all transactions." 
                    : " Switch to recommended cards for UPI to recoup lost savings."}
                </p>
              </CardContent>
            </Card>

            {/* Widget 2: AI Advisor Widget */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    AI Advisor Stream
                  </span>
                  <span className="text-[10px] text-amber-605 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    3 active tips
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-40">
                  {/* Alert 1 */}
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                    <Sparkles className="h-4 w-4 text-[#2874F0] shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <span className="font-bold text-slate-800 block">Switch Card for Utilities</span>
                      <span className="text-slate-500">Pay your electricity bill using Axis Ace to earn 5% cashback (₹120 saving).</span>
                    </div>
                  </div>
                  {/* Alert 2 */}
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                    <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <span className="font-bold text-slate-800 block">Offer Expiring Soon</span>
                      <span className="text-slate-500">Swiggy HDFC Discount is expiring in 2 days. Redeem today.</span>
                    </div>
                  </div>
                  {/* Alert 3 */}
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <span className="font-bold text-slate-800 block">Missed Reward Warning</span>
                      <span className="text-slate-500">You lost ₹75 cashback yesterday by paying with normal UPI at Zomato.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget 3: Savings Overview Widget */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="h-4 w-4 text-[#2874F0]" />
                    Savings Overview
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Cashback Earned</span>
                    <span className="text-base font-black text-slate-800">{formatCurrency(totalCashback)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Missed Rewards</span>
                    <span className="text-base font-black text-rose-600">{formatCurrency(missedCashback)}</span>
                  </div>
                </div>

                {/* Mini Sparkline Chart representing monthly trends */}
                <div className="h-16 w-full pt-1">
                  {mounted && data && data.monthly_trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.monthly_trends} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <defs>
                          <linearGradient id="colorCashback" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="cashback" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorCashback)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-400">
                      Trend data loading...
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 text-center block mt-1 font-bold">Rewards trend over last {data?.monthly_trends.length || 0} periods</span>
              </CardContent>
            </Card>
          </div>

          {/* Metric Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stat 1: Total Spend */}
            <Card className="relative overflow-hidden border-slate-200 bg-white rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Spending</span>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-[#2874F0] flex items-center justify-center border border-blue-100">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-800 tracking-tight">
                  {formatCurrency(data?.stats.total_spending || 0)}
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500">
                  <span className="flex items-center text-emerald-600 font-semibold">
                    <ArrowDownRight className="h-4 w-4" />
                    -4.2%
                  </span>
                  versus last month average
                </div>
              </CardContent>
            </Card>

            {/* Stat 2: Earned Cashback */}
            <Card className="relative overflow-hidden border-slate-200 bg-white rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cashback Earned</span>
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Percent className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-800 tracking-tight">
                  {formatCurrency(totalCashback)}
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500">
                  <span className="flex items-center text-emerald-600 font-semibold">
                    <ArrowUpRight className="h-4 w-4" />
                    +12.4%
                  </span>
                  earned on rewards this period
                </div>
              </CardContent>
            </Card>

            {/* Stat 3: Missed rewards warning */}
            <Card className="relative overflow-hidden border-rose-200 bg-white rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Missed Cashback</span>
                  <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-rose-600 tracking-tight">
                  {formatCurrency(missedCashback)}
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-rose-600 font-semibold">
                  <span>Lost opportunities on UPI spends</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recharts Analytics Charts Panel */}
          {mounted && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Breakdown (Pie) */}
              <Card className="lg:col-span-1 border-slate-200 bg-white rounded-2xl hover:-translate-y-0.5 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-base text-slate-800 font-bold">Category Distribution</CardTitle>
                  <CardDescription>Where your money went this month</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number)}
                          contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm text-slate-500">No transaction data available</div>
                  )}
                </CardContent>
                <CardContent className="pt-0 pb-6 grid grid-cols-3 gap-y-2 text-[11px]">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Monthly Spending Trend (Bar) */}
              <Card className="lg:col-span-2 border-slate-200 bg-white rounded-2xl hover:-translate-y-0.5 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-base text-slate-800 font-bold">Monthly Spending Trend</CardTitle>
                  <CardDescription>Visual analysis of spending and earned rewards</CardDescription>
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
          )}

          {/* Recent Transactions List Panel */}
          <Card className="border-slate-200 bg-white rounded-2xl hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-base text-slate-800 font-bold">Recent Aggregations</CardTitle>
                <CardDescription>Latest transactions parsed by the aggregation logs</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/transactions")}>
                View All Transactions
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
                        <td colSpan={6} className="text-center py-6 text-slate-500">
                          No transactions imported yet. Click "Import Statement" to seed records.
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
