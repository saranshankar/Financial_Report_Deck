"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  CreditCard, 
  AlertTriangle, 
  TrendingDown, 
  Award,
  ArrowRight,
  TrendingUp as SavingsIcon
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

import { api, authApi, insightsApi, User, Recommendation, Insight, checkBackendHealth } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function Insights() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [monthlyInsights, setMonthlyInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadInsightsData = async () => {
    try {
      const recList = await insightsApi.getRecommendations();
      setRecommendations(recList);

      const response = await api.get<Insight[]>("/insights/monthly-summary");
      setMonthlyInsights(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load insights summary.");
    }
  };

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
      await loadInsightsData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load data.");
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

  const handleRefreshRecommendations = async () => {
    setRefreshing(true);
    try {
      const refreshed = await insightsApi.refreshRecommendations();
      setRecommendations(refreshed);
      
      const response = await api.get<Insight[]>("/insights/monthly-summary");
      setMonthlyInsights(response.data);
      
      alert("AI Advisor completed scanning! Generated fresh personalized recommendations.");
    } catch (err) {
      console.error(err);
      alert("Failed to refresh recommendations.");
    } finally {
      setRefreshing(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "CASHBACK":
        return <CreditCard className="h-5 w-5 text-[#2874F0]" />;
      case "SAVINGS":
        return <Sparkles className="h-5 w-5 text-emerald-500" />;
      case "EXPENSE_WARNING":
        return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-slate-600" />;
    }
  };

  const getRecommendationTypeClass = (type: string) => {
    switch (type) {
      case "CASHBACK":
        return "bg-blue-50 border-blue-100 text-[#2874F0]";
      case "SAVINGS":
        return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "EXPENSE_WARNING":
        return "bg-rose-50 border-rose-100 text-rose-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  // Prepare chart data from monthly insights (reversed to show chronological order)
  const chartData = [...monthlyInsights].reverse().map(insight => ({
    month: insight.month,
    spending: insight.total_spending,
    cashback: insight.total_cashback,
    yield: insight.total_spending > 0 ? parseFloat(((insight.total_cashback / insight.total_spending) * 100).toFixed(2)) : 0
  }));

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      <Sidebar onLogout={() => { authApi.logout(); router.push("/login"); }} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

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
              {/* Header Row */}
          <div className="flex justify-between items-center border-b border-slate-250 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-wide">AI FINANCIAL INTELLIGENCE</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Actionable advisor suggestions and saving targets mapped from credit card eligibility analysis.
              </p>
            </div>
            <Button size="sm" onClick={handleRefreshRecommendations} disabled={refreshing} className="flex items-center gap-2 bg-[#2874F0] hover:bg-[#1B4FAD] text-white">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Advisor
            </Button>
          </div>

          {/* Interactive Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Savings & Rewards Trend */}
            <Card className="border-slate-200 bg-white rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base text-slate-800 font-bold">Reward Savings Trend</CardTitle>
                <CardDescription>Track monthly cashback gains compared to your spending volumes</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCashbackFull" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Area type="monotone" dataKey="cashback" name="Cashback Rewards" stroke="#10B981" fillOpacity={1} fill="url(#colorCashbackFull)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    No history logs for trends.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 2: Reward Yield Ratio */}
            <Card className="border-slate-200 bg-white rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base text-slate-800 font-bold">Cashback Yield Ratio (%)</CardTitle>
                <CardDescription>Percentage efficiency of card reward collections per ₹100 spent</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, "Cashback Yield"]} />
                      <Bar dataKey="yield" name="Yield Index" fill="#2874F0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    No history logs for trends.
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Main Advisor Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Recommendations Stream List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-black text-sm text-slate-700 tracking-widest uppercase">Advisor Recommendations Stream</h3>
              
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <Card key={rec.id} className="relative overflow-hidden group border-slate-200 bg-white rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center border shrink-0 ${getRecommendationTypeClass(rec.recommendation_type)}`}>
                        {getRecommendationIcon(rec.recommendation_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-slate-100 text-slate-700 border-transparent">
                            {rec.recommendation_type}
                          </Badge>
                          {rec.impact_amount > 0 && (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              Est. Savings: {formatCurrency(rec.impact_amount)}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-base font-bold text-slate-800 mt-1">
                          {rec.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 text-xs">
                      <p className="text-slate-500 leading-relaxed text-sm font-medium">{rec.message}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 border border-dashed border-slate-350 bg-white rounded-2xl font-semibold">
                  No recommendations generated. Start importing transaction statements to trigger advisor.
                </div>
              )}
            </div>

            {/* Monthly Summaries and insights */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-black text-sm text-slate-700 tracking-widest uppercase">Monthly Budget Summaries</h3>
              
              {monthlyInsights.length > 0 ? (
                monthlyInsights.map((insight) => (
                  <Card key={insight.id} className="relative overflow-hidden border-slate-200 bg-white rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-[#2874F0] text-xs">{insight.month}</span>
                        <Badge className="text-[9px] font-bold flex gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Award className="h-3 w-3 shrink-0" />
                          Top Cat: {insight.top_category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-black text-slate-800 mt-2">
                        Summary of Expenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2 text-xs">
                      <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Spent</span>
                          <span className="text-slate-800 font-black text-sm">{formatCurrency(insight.total_spending)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Earned Rewards</span>
                          <span className="text-emerald-600 font-black text-sm">{formatCurrency(insight.total_cashback)}</span>
                        </div>
                      </div>

                      {insight.summary && (
                        <div className="text-slate-600 leading-relaxed border-t border-slate-50 pt-2 text-[11px]">
                          <span className="font-bold text-[9px] text-[#2874F0] block uppercase mb-1">AI Advisor Summary</span>
                          <p className="italic font-medium">{insight.summary}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 border border-dashed border-slate-350 bg-white rounded-2xl font-semibold">
                  No monthly summary insights available yet.
                </div>
              )}
            </div>

          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
