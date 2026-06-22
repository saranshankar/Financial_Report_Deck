"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Receipt, 
  Search, 
  Plus, 
  Upload, 
  Trash2, 
  Filter, 
  Sparkles,
  AlertTriangle,
  Utensils,
  Plane,
  ShoppingBag,
  FileText,
  Activity,
  BookOpen,
  Film,
  TrendingUp,
  Percent
} from "lucide-react";

import { 
  api, 
  authApi, 
  transactionsApi, 
  reconciliationApi,
  User, 
  Transaction, 
  ReconciliationLog,
  checkBackendHealth
} from "../lib/api";
import { formatCurrency, formatDate, getCategoryBadgeClass } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import UploadModal from "../components/UploadModal";
import ServiceOffline from "../components/ServiceOffline";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";
import { Select } from "../components/ui/Select";

export default function Transactions() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliationLogs, setReconciliationLogs] = useState<ReconciliationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Search & filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Manual Transaction Form states
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState("DEBIT");
  const [txCategory, setTxCategory] = useState("Others");
  const [txPaymentMethod, setTxPaymentMethod] = useState("UPI");
  const [txDate, setTxDate] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Reconciliation processing state
  const [reconRunning, setReconRunning] = useState(false);

  const CATEGORIES_LIST = [
    { value: "All", label: "All Categories" },
    { value: "Food", label: "Food" },
    { value: "Travel", label: "Travel" },
    { value: "Shopping", label: "Shopping" },
    { value: "Bills", label: "Bills" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Education", label: "Education" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Investments", label: "Investments" },
    { value: "Others", label: "Others" }
  ];

  const fetchTransactions = async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search;
      if (category !== "All") params.category = category;
      if (paymentMethod.trim()) params.payment_method = paymentMethod;

      const list = await transactionsApi.getAll(params);
      setTransactions(list);

      const logs = await reconciliationApi.getLogs();
      setReconciliationLogs(logs.filter(l => !l.resolved));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load transactions.");
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
      await fetchTransactions();
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
  }, [router, category]);

  // Handle manual search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  // Create manual transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const formattedDate = txDate ? new Date(txDate).toISOString() : new Date().toISOString();
      await transactionsApi.create({
        date: formattedDate,
        merchant,
        amount: parseFloat(amount),
        type: txType as any,
        category: txCategory,
        payment_method: txPaymentMethod,
        status: "CLEARED",
        source: "MANUAL"
      });

      // Reset
      setMerchant("");
      setAmount("");
      setTxCategory("Others");
      setTxPaymentMethod("UPI");
      setTxDate("");
      setIsAddOpen(false);

      await fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to create transaction.");
    } finally {
      setAddLoading(false);
    }
  };

  // Run Reconciliation agent
  const handleRunReconciliation = async () => {
    setReconRunning(true);
    try {
      const logs = await reconciliationApi.run();
      setReconciliationLogs(logs);
      await fetchTransactions(); // Refresh list to see PENDING flags
      alert(`Reconciliation complete! Detected ${logs.length} duplicate transaction issues.`);
    } catch (err) {
      console.error(err);
      alert("Reconciliation engine error.");
    } finally {
      setReconRunning(false);
    }
  };

  // Resolve duplicate transaction
  const handleResolveDuplicate = async (logId: string, action: "keep" | "delete") => {
    try {
      await reconciliationApi.resolve(logId, action);
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to resolve duplicate log.");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await transactionsApi.delete(txId);
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Food":
        return <Utensils className="h-5 w-5 text-rose-600" />;
      case "Travel":
        return <Plane className="h-5 w-5 text-[#2874F0]" />;
      case "Shopping":
        return <ShoppingBag className="h-5 w-5 text-emerald-600" />;
      case "Bills":
        return <FileText className="h-5 w-5 text-amber-600" />;
      case "Healthcare":
        return <Activity className="h-5 w-5 text-pink-650" />;
      case "Education":
        return <BookOpen className="h-5 w-5 text-violet-600" />;
      case "Entertainment":
        return <Film className="h-5 w-5 text-rose-500" />;
      case "Investments":
        return <TrendingUp className="h-5 w-5 text-cyan-600" />;
      default:
        return <Receipt className="h-5 w-5 text-slate-500" />;
    }
  };

  const getCategoryIconBg = (cat: string) => {
    switch (cat) {
      case "Food": return "bg-rose-50 border-rose-100";
      case "Travel": return "bg-blue-50 border-blue-100";
      case "Shopping": return "bg-emerald-50 border-emerald-100";
      case "Bills": return "bg-amber-50 border-amber-100";
      case "Healthcare": return "bg-pink-50 border-pink-100";
      case "Education": return "bg-violet-50 border-violet-100";
      case "Entertainment": return "bg-rose-50 border-rose-100";
      case "Investments": return "bg-cyan-50 border-cyan-100";
      default: return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      <Sidebar onLogout={() => { authApi.logout(); router.push("/login"); }} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 space-y-6 z-10 max-w-7xl w-full mx-auto">
          {error ? (
            <ServiceOffline error={error} onRetry={loadData} />
          ) : (
            <>
              {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-205 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-wide">TRANSACTION MANAGEMENT</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregate spending, classify merchant categories, and review credit card cashback potential.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRunReconciliation} loading={reconRunning} className="flex items-center gap-2 border-blue-200 text-[#2874F0] hover:bg-blue-50">
                <Sparkles className="h-4 w-4" />
                Run AI Reconcile
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
              <Button size="sm" onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 bg-[#2874F0] hover:bg-[#1B4FAD] text-white">
                <Upload className="h-4 w-4" />
                Import Logs
              </Button>
            </div>
          </div>

          {/* Reconciliation alert boxes */}
          {reconciliationLogs.length > 0 && (
            <div className="space-y-3">
              {reconciliationLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold text-sm text-slate-800">Duplicate Charge Warning</span>
                      <p className="text-slate-500 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleResolveDuplicate(log.id, "keep")} className="border-amber-200 text-amber-700 hover:bg-amber-100/50 h-7 text-[10px] px-2.5">
                      Keep Both
                    </Button>
                    <Button size="sm" onClick={() => handleResolveDuplicate(log.id, "delete")} className="bg-amber-600 text-white hover:bg-amber-700 h-7 text-[10px] px-2.5">
                      Remove Duplicate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter Search Bar */}
          <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Search Merchant</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. Zomato, Amazon"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <Select
                    label="Filter Category"
                    options={CATEGORIES_LIST}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Payment Method</label>
                  <Input
                    placeholder="e.g. Axis Ace, UPI"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border-slate-200"
                  />
                </div>

                <div>
                  <Button type="submit" className="w-full flex items-center justify-center gap-2 h-10 bg-[#2874F0] hover:bg-[#1B4FAD] text-white">
                    <Filter className="h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Amazon-style transaction list */}
          <div className="space-y-4">
            <h3 className="font-black text-sm text-slate-700 tracking-widest uppercase">Aggregated Transactions</h3>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <Card key={tx.id} className={`border-slate-200 bg-white rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 ${tx.status === 'PENDING' ? 'border-amber-200 bg-amber-50/10' : ''}`}>
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Left: Category Icon, Merchant Name, Payment Method, Date */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center border shrink-0 ${getCategoryIconBg(tx.category)}`}>
                          {getCategoryIcon(tx.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 truncate text-sm sm:text-base">
                              {tx.merchant}
                            </span>
                            {tx.status === "PENDING" && (
                              <Badge className="bg-amber-100 text-amber-800 border-transparent text-[8px] font-black uppercase px-1">
                                Duplicate Warning
                              </Badge>
                            )}
                            <Badge className={getCategoryBadgeClass(tx.category) + " text-[9px] px-1.5 py-0 rounded font-bold"}>
                              {tx.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2.5 mt-1 text-[11px] text-slate-500 font-semibold">
                            <span className="font-mono">{formatDate(tx.date)}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            <span>Paid via {tx.payment_method}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount, Cashback Details, Actions */}
                      <div className="flex sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="text-base sm:text-lg font-black text-slate-800">
                            {formatCurrency(tx.amount)}
                          </div>
                          <div className="flex flex-col sm:items-end mt-0.5">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                              <Percent className="h-3 w-3 shrink-0" />
                              {formatCurrency(tx.cashback_earned)} cashback
                            </span>
                            {tx.potential_cashback > tx.cashback_earned && (
                              <span className="text-[9px] text-rose-600 font-bold mt-1 block bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                Lost reward: {formatCurrency(tx.potential_cashback - tx.cashback_earned)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            suppressHydrationWarning={true}
                            className="p-2 rounded-xl bg-rose-55 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors border border-rose-100"
                            title="Delete Transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 border border-dashed border-slate-300 bg-white rounded-2xl font-semibold text-sm">
                No transactions match your search. Try adding records manually or importing statements.
              </div>
            )}
          </div>
            </>
          )}
        </main>
      </div>

      {/* Upload statement popup modal */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={fetchTransactions} 
      />

      {/* Add Manual Record dialog popup modal */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <DialogHeader>
          <DialogTitle>Add Transaction Record</DialogTitle>
          <DialogDescription>
            Manually enter spent transactions. FinSight AI will auto-calculate reward values based on payment method.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-slate-500 font-semibold">Merchant Payee</label>
              <Input
                placeholder="e.g. Swiggy, Netflix"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-slate-500 font-semibold">Amount (INR)</label>
              <Input
                type="number"
                placeholder="₹1200.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <Select
                label="Spend Category"
                options={[
                  { value: "Food", label: "Food" },
                  { value: "Travel", label: "Travel" },
                  { value: "Shopping", label: "Shopping" },
                  { value: "Bills", label: "Bills & Utilities" },
                  { value: "Healthcare", label: "Healthcare" },
                  { value: "Education", label: "Education" },
                  { value: "Entertainment", label: "Entertainment" },
                  { value: "Investments", label: "Investments" },
                  { value: "Others", label: "Others" },
                ]}
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-slate-500 font-semibold">Payment Method</label>
              <Input
                placeholder="e.g. Axis Ace, UPI, HDFC Card"
                value={txPaymentMethod}
                onChange={(e) => setTxPaymentMethod(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs text-slate-500 font-semibold">Transaction Date</label>
            <Input
              type="datetime-local"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} disabled={addLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={addLoading} className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white">
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
