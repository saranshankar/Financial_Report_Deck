"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BrainCircuit, Calendar, Plus, Trash2, ArrowRight, ShieldCheck, Percent, HelpCircle, AlertTriangle } from "lucide-react";

import { api, authApi, offersApi, User, Offer, checkBackendHealth } from "../lib/api";
import { formatDate } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ServiceOffline from "../components/ServiceOffline";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";

export default function Offers() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simplifier Agent UI states
  const [rawTerms, setRawTerms] = useState("");
  const [simplifiedOutput, setSimplifiedOutput] = useState("");
  const [simplifying, setSimplifying] = useState(false);

  // Save offer states
  const [newTitle, setNewTitle] = useState("");
  const [newMerchant, setNewMerchant] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Cashback prediction test amount state
  const [testAmount, setTestAmount] = useState("1500");

  const fetchOffers = async () => {
    try {
      const list = await offersApi.getAll();
      setOffers(list);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load offers.");
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
      await fetchOffers();
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

  const handleSimplify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTerms.trim()) return;
    setSimplifying(true);
    setSimplifiedOutput("");
    try {
      const res = await offersApi.simplify(rawTerms);
      setSimplifiedOutput(res.simplified_explanation);
      
      // Auto-extract guess merchant
      const match = rawTerms.match(/(?:at|on|to|for)\s+([a-z0-9]+)/i);
      if (match && !newMerchant) {
        setNewMerchant(match[1].trim());
      }
    } catch (err) {
      console.error(err);
      alert("Failed to simplify offer. Falling back to local regex extraction.");
    } finally {
      setSimplifying(false);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMerchant || !rawTerms) {
      alert("Please complete the title, merchant, and original terms.");
      return;
    }
    setSaveLoading(true);
    try {
      await offersApi.create({
        title: newTitle,
        merchant: newMerchant,
        original_terms: rawTerms,
        simplified_explanation: simplifiedOutput,
        status: "ACTIVE",
        expires_at: expiryDate ? new Date(expiryDate).toISOString() : undefined
      });

      // Clear
      setNewTitle("");
      setNewMerchant("");
      setRawTerms("");
      setSimplifiedOutput("");
      setExpiryDate("");

      await fetchOffers();
    } catch (err) {
      console.error(err);
      alert("Failed to log offer.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Remove this offer from your checklist?")) return;
    try {
      await offersApi.delete(id);
      await fetchOffers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete offer.");
    }
  };

  // Heuristic offer parser for prediction card
  const parseOfferTerms = (terms: string) => {
    const cleanTerms = terms.toLowerCase();
    
    // Parse percentage
    let percentage = 0;
    const pctMatch = cleanTerms.match(/(\d+(?:\.\d+)?)\s*%\s*(?:instant|cashback|discount|off)/i);
    if (pctMatch) percentage = parseFloat(pctMatch[1]);
    else {
      const flatMatch = cleanTerms.match(/flat\s*(?:rs\.?|₹)?\s*(\d+)/i);
      if (flatMatch) percentage = 100; // Flat discount
    }

    // Parse max limit (cap)
    let maxLimit = 200; // default cap
    const capMatch = cleanTerms.match(/(?:up to|max|maximum|cap of|limit of)\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)?)/i);
    if (capMatch) maxLimit = parseFloat(capMatch[1].replace(/,/g, ""));
    else {
      const flatMatch = cleanTerms.match(/flat\s*(?:rs\.?|₹)?\s*(\d+)/i);
      if (flatMatch) maxLimit = parseFloat(flatMatch[1]);
    }

    // Parse minimum spend
    let minSpend = 0;
    const minMatch = cleanTerms.match(/(?:min|minimum|spend of|order of|above)\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)?)/i);
    if (minMatch) minSpend = parseFloat(minMatch[1].replace(/,/g, ""));

    // Parse card brand
    let eligibleCard = "Any Card";
    const cards = ["hdfc", "sbi", "axis", "icici", "hsbc", "citi", "onecard", "amex"];
    for (const card of cards) {
      if (cleanTerms.includes(card)) {
        eligibleCard = card.toUpperCase() + " Bank Card";
        break;
      }
    }

    return { percentage, maxLimit, minSpend, eligibleCard };
  };

  // Active or mock terms rule
  const currentTermsToParse = rawTerms || "10% instant discount up to ₹200 on Swiggy order of ₹999 HDFC Bank Credit Card";
  const parsedRules = parseOfferTerms(currentTermsToParse);
  const numericTestAmount = parseFloat(testAmount) || 0;
  
  const calculateCashback = () => {
    if (numericTestAmount < parsedRules.minSpend) return 0;
    if (parsedRules.percentage === 100) return Math.min(numericTestAmount, parsedRules.maxLimit);
    return Math.min((numericTestAmount * parsedRules.percentage) / 100, parsedRules.maxLimit);
  };
  const predictedCashback = calculateCashback();

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
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-wide">OFFERS & AI EXPLAINER</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Demystify banking offer documents. Simplify terms, calculate caps, and save matches to your advisor stream.
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Input, Log active offer, Saved Offers checklist */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Offer Input card */}
              <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 border border-blue-100 rounded text-[#2874F0]">
                      <BrainCircuit className="h-4 w-4 text-[#2874F0]" />
                    </div>
                    <CardTitle className="text-base text-slate-800 font-bold">Offer Explainability Agent</CardTitle>
                  </div>
                  <CardDescription className="text-slate-500">
                    Paste complex, fine-print offer T&C clauses to let Gemini rewrite them.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSimplify} className="space-y-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Paste Original Offer Clause</label>
                      <textarea
                        placeholder="e.g. Get 10% instant discount up to Rs. 200 on Swiggy Food orders of Rs. 999 and above. Valid twice per user per month using HDFC Bank Credit Cards..."
                        value={rawTerms}
                        onChange={(e) => setRawTerms(e.target.value)}
                        className="flex h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 focus:ring-[#2874F0] resize-none"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full flex items-center justify-center gap-2 h-9 bg-[#2874F0] hover:bg-[#1B4FAD] text-white" loading={simplifying}>
                      <Sparkles className="h-4 w-4" />
                      Simplify Terms with Gemini
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Log Active Offer Form (Visible if raw terms exist) */}
              {(rawTerms || simplifiedOutput) && (
                <Card className="border-slate-200 bg-white rounded-2xl shadow-sm animate-in fade-in duration-300">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold text-slate-800">Add to Active Offers Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveOffer} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Offer Title</label>
                          <Input
                            placeholder="e.g. Swiggy HDFC Discount"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-8 text-xs border-slate-200"
                            required
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Merchant</label>
                          <Input
                            placeholder="e.g. Swiggy, Amazon"
                            value={newMerchant}
                            onChange={(e) => setNewMerchant(e.target.value)}
                            className="h-8 text-xs border-slate-200"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Expiry Date</label>
                        <Input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="h-8 text-xs border-slate-200"
                        />
                      </div>

                      <Button type="submit" size="sm" className="w-full flex items-center justify-center gap-2 h-8 bg-[#2874F0] hover:bg-[#1B4FAD] text-white" loading={saveLoading}>
                        <Plus className="h-3.5 w-3.5" />
                        Log Active Offer
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Active Offers Checklist Card */}
              <div className="space-y-3">
                <h3 className="font-black text-sm text-slate-700 tracking-widest uppercase">Active Offers Checklist</h3>
                {offers.length > 0 ? (
                  offers.map((offer) => (
                    <Card key={offer.id} className="relative overflow-hidden border-slate-200 bg-white rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                      <CardHeader className="flex flex-row justify-between items-start pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-[#2874F0] tracking-widest">
                              {offer.merchant}
                            </span>
                            {offer.status === "ACTIVE" ? (
                              <Badge variant="success" className="h-3.5 text-[8px] px-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="h-3.5 text-[8px] px-1.5 font-bold">Expired</Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-bold text-slate-800 mt-1">{offer.title}</CardTitle>
                        </div>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          suppressHydrationWarning={true}
                          className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors border border-rose-100"
                          title="Remove Offer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-2 text-xs">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 font-semibold leading-relaxed">
                          {offer.simplified_explanation || offer.original_terms}
                        </div>

                        <div className="flex items-center gap-4 text-slate-400 text-[10px] justify-between">
                          {offer.expires_at && (
                            <span className="flex items-center gap-1 font-bold">
                              <Calendar className="h-3.5 w-3.5 text-slate-450" />
                              Expires: {formatDate(offer.expires_at).split(",")[0]}
                            </span>
                          )}
                          <span className="text-slate-400 truncate max-w-[200px]" title={offer.original_terms}>
                            T&C: {offer.original_terms}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 border border-dashed border-slate-300 bg-white rounded-2xl text-xs font-semibold">
                    No active logged offers found. Use the explainability agent to simplify and log one!
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: AI Explanation, Cashback Prediction, Eligibility Summary */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* AI Explanation Card */}
              <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#2874F0]" />
                    <CardTitle className="text-base text-slate-800 font-bold">AI Explanation Summary</CardTitle>
                  </div>
                  <CardDescription className="text-slate-500">Gemini's translated meaning of the fine print.</CardDescription>
                </CardHeader>
                <CardContent>
                  {simplifiedOutput ? (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-[#1B4FAD] space-y-2 animate-in fade-in duration-300">
                      <span className="font-black text-[#2874F0] text-[10px] uppercase tracking-wider block">Simplified Translation</span>
                      <p className="text-sm font-semibold leading-relaxed">{simplifiedOutput}</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Paste and simplify an offer on the left to activate AI Explanation.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cashback Prediction Card */}
              <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-emerald-500" />
                    <CardTitle className="text-base text-slate-800 font-bold">Cashback Predictor Calculator</CardTitle>
                  </div>
                  <CardDescription className="text-slate-500">Simulate transactions against the parsed offer rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase">Test Transaction Amount (INR)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={testAmount}
                        onChange={(e) => setTestAmount(e.target.value)}
                        className="border-slate-200 h-10 text-sm font-bold text-slate-800"
                        placeholder="e.g. 2000"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>Test Amount:</span>
                      <span>₹{testAmount || "0"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Parsed Rule:</span>
                      <span>
                        {parsedRules.percentage === 100 
                          ? `Flat ₹${parsedRules.maxLimit}` 
                          : `${parsedRules.percentage}% returns (Cap ₹${parsedRules.maxLimit})`}
                      </span>
                    </div>
                    {parsedRules.minSpend > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Min. Requirement:</span>
                        <span>Spend at least ₹{parsedRules.minSpend}</span>
                      </div>
                    )}
                    <div className="h-px bg-emerald-200/50 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-950">Predicted Savings</span>
                      <span className="text-xl font-black text-emerald-600">₹{predictedCashback.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Eligibility Summary Card */}
              <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-[#2874F0]" />
                    <CardTitle className="text-base text-slate-800 font-bold">Terms Eligibility Parameters</CardTitle>
                  </div>
                  <CardDescription className="text-slate-500">Extracted requirements for maximum reward eligibility.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-500">Reward Rate:</span>
                      <span className="text-slate-800 font-bold">
                        {parsedRules.percentage === 100 ? "Flat Benefit" : `${parsedRules.percentage}%`}
                      </span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-500">Maximum Cap:</span>
                      <span className="text-slate-800 font-bold">₹{parsedRules.maxLimit}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-500">Minimum Spend Required:</span>
                      <span className="text-slate-800 font-bold">₹{parsedRules.minSpend}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-slate-500">Eligible Card Channel:</span>
                      <Badge className="bg-blue-50 text-[#2874F0] border-transparent font-bold">
                        {parsedRules.eligibleCard}
                      </Badge>
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
    </div>
  );
}
