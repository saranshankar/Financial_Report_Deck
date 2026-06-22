"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, Trash2, HelpCircle, Save, AlertTriangle } from "lucide-react";

import { api, authApi, cashbackApi, User, CashbackRule, checkBackendHealth } from "../lib/api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ServiceOffline from "../components/ServiceOffline";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";
import { Select } from "../components/ui/Select";

export default function Cashback() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rules, setRules] = useState<CashbackRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [cardName, setCardName] = useState("");
  const [merchantPattern, setMerchantPattern] = useState("*");
  const [categoryPattern, setCategoryPattern] = useState("*");
  const [cashbackPercentage, setCashbackPercentage] = useState("");
  const [maxLimit, setMaxLimit] = useState("");
  const [minTransactionAmount, setMinTransactionAmount] = useState("0");
  const [conditions, setConditions] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchRules = async () => {
    try {
      const list = await cashbackApi.getAll();
      setRules(list);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load cashback rules.");
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
      await fetchRules();
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

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await cashbackApi.create({
        card_name: cardName,
        merchant_pattern: merchantPattern || "*",
        category_pattern: categoryPattern || "*",
        cashback_percentage: parseFloat(cashbackPercentage),
        max_limit: maxLimit ? parseFloat(maxLimit) : undefined,
        min_transaction_amount: parseFloat(minTransactionAmount || "0"),
        conditions: conditions || undefined
      });

      // Reset
      setCardName("");
      setMerchantPattern("*");
      setCategoryPattern("*");
      setCashbackPercentage("");
      setMaxLimit("");
      setMinTransactionAmount("0");
      setConditions("");
      setIsAddOpen(false);

      await fetchRules();
    } catch (err) {
      console.error(err);
      alert("Failed to save cashback rule.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await cashbackApi.delete(ruleId);
      await fetchRules();
    } catch (err) {
      console.error(err);
      alert("Failed to delete rule.");
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
          <div className="flex justify-between items-center border-b border-slate-205 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-wide">CASHBACK INTELLIGENCE DATABASE</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure credit card cashback metrics to let the AI agent identify missed rewards on past transactions.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 bg-[#2874F0] hover:bg-[#1B4FAD] text-white">
              <Plus className="h-4 w-4" />
              Add Card Rule
            </Button>
          </div>

          {/* Quick guide card */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-150 text-slate-800 text-xs flex gap-3.5 items-start shadow-sm">
            <CreditCard className="h-5 w-5 text-[#2874F0] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm text-[#1B4FAD]">How Card Rules Drive Optimization</span>
              <p className="text-slate-650 mt-1 leading-relaxed font-semibold">
                Our engine scans these parameters whenever a transaction is registered. For instance, if you define that `Axis Ace` grants `5.00%` on category `Bills`, the engine will flag any transaction categorized under `Bills` that did not use `Axis Ace` as a missed saving opportunity, advising you to switch cards. Use `*` to represent universal matching keywords.
              </p>
            </div>
          </div>

          {/* Card Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.length > 0 ? (
              rules.map((rule) => (
                <Card key={rule.id} className="relative overflow-hidden border-slate-200 bg-white rounded-2xl shadow-sm hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-blue-50 rounded-full filter blur-2xl pointer-events-none" />
                  <CardHeader className="flex flex-row justify-between items-start pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-black text-[#2874F0] tracking-widest">Active Rule</span>
                      <CardTitle className="text-lg font-black text-slate-800 mt-0.5">{rule.card_name}</CardTitle>
                    </div>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      suppressHydrationWarning={true}
                      className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-750 transition-colors border border-rose-100"
                      title="Remove Rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs font-semibold text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Cashback</span>
                        <span className="font-black text-[#2874F0] text-sm">{rule.cashback_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Merchant</span>
                        <span className="font-bold text-slate-800 truncate block">{rule.merchant_pattern === "*" ? "All Merchants" : rule.merchant_pattern}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                        <span className="font-bold text-slate-800 truncate block">{rule.category_pattern === "*" ? "All Spends" : rule.category_pattern}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 font-semibold text-slate-500">
                      {rule.max_limit && (
                        <div className="flex justify-between">
                          <span>Maximum Limit (Cap):</span>
                          <span className="text-slate-850 font-bold">₹{rule.max_limit}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Minimum Spend Required:</span>
                        <span className="text-slate-850 font-bold">₹{rule.min_transaction_amount}</span>
                      </div>
                      {rule.conditions && (
                        <div className="mt-2 border-t border-slate-100 pt-2">
                          <span className="font-bold text-[10px] block uppercase mb-0.5 text-slate-400">Rule Terms</span>
                          <p className="italic text-[11px] leading-relaxed text-slate-600 font-medium">{rule.conditions}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-20 text-slate-450 border border-dashed border-slate-300 bg-white rounded-2xl font-bold text-xs">
                No cashback rules configured yet. Click "Add Card Rule" to seed your cards.
              </div>
            )}
          </div>
            </>
          )}
        </main>
      </div>

      {/* Add Rule Modal Popup Dialog */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <DialogHeader>
          <DialogTitle>Create Cashback Rule</DialogTitle>
          <DialogDescription>
            Specify cashback percentage returns, category filters, and spending caps for card rules.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-slate-550 font-semibold">Card/Payment Platform Name</label>
            <Input
              placeholder="e.g. SBI SimplyClick, Amazon Pay ICICI"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-slate-550 font-semibold">Merchant Keyword</label>
              <Input
                placeholder="e.g. Amazon, Swiggy (or * for all)"
                value={merchantPattern}
                onChange={(e) => setMerchantPattern(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <Select
                label="Eligible Category"
                options={[
                  { value: "*", label: "All Categories" },
                  { value: "Food", label: "Food" },
                  { value: "Travel", label: "Travel" },
                  { value: "Shopping", label: "Shopping" },
                  { value: "Bills", label: "Bills & Utilities" },
                  { value: "Healthcare", label: "Healthcare" },
                  { value: "Education", label: "Education" },
                  { value: "Entertainment", label: "Entertainment" },
                  { value: "Investments", label: "Investments" },
                ]}
                value={categoryPattern}
                onChange={(e) => setCategoryPattern(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-slate-550 font-semibold">Percentage (%)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="5%"
                value={cashbackPercentage}
                onChange={(e) => setCashbackPercentage(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-slate-550 font-semibold">Max Limit (Cap)</label>
              <Input
                type="number"
                placeholder="None"
                value={maxLimit}
                onChange={(e) => setMaxLimit(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-slate-550 font-semibold">Min Spend</label>
              <Input
                type="number"
                placeholder="0"
                value={minTransactionAmount}
                onChange={(e) => setMinTransactionAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs text-slate-550 font-semibold">Conditions/Additional Details</label>
            <textarea
              placeholder="e.g. Valid on online purchases. Excluding gold, fuel, and jewelry transactions."
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className="flex h-20 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 focus:ring-[#2874F0] resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading} className="bg-[#2874F0] hover:bg-[#1B4FAD] text-[#ffffff]">
              Save Card Rule
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
