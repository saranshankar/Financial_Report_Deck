"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Link2, 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trash2, 
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Smartphone,
  CreditCard,
  Building
} from "lucide-react";

import { 
  accountsApi, 
  authApi, 
  ConnectedAccount, 
  AccountImport, 
  User, 
  checkBackendHealth 
} from "../lib/api";
import { formatCurrency, formatDate } from "../lib/utils";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ServiceOffline from "../components/ServiceOffline";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/Dialog";

const PROVIDERS = [
  { id: "Google Pay", name: "Google Pay", icon: Smartphone, color: "bg-blue-50 text-blue-600 border-blue-200", brandColor: "#4285F4" },
  { id: "PhonePe", name: "PhonePe", icon: Smartphone, color: "bg-purple-50 text-purple-600 border-purple-200", brandColor: "#5f259f" },
  { id: "Paytm", name: "Paytm", icon: Smartphone, color: "bg-cyan-50 text-cyan-600 border-cyan-200", brandColor: "#00baf2" },
  { id: "Amazon Pay", name: "Amazon Pay", icon: Smartphone, color: "bg-amber-50 text-amber-600 border-amber-200", brandColor: "#ff9900" },
  { id: "Bank Account", name: "Bank Account", icon: Building, color: "bg-slate-50 text-slate-600 border-slate-200", brandColor: "#475569" },
  { id: "Credit Card", name: "Credit Card", icon: CreditCard, color: "bg-indigo-50 text-indigo-600 border-indigo-200", brandColor: "#4f46e5" }
];

export default function ConnectAccounts() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [imports, setImports] = useState<AccountImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Connection Simulation States
  const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDERS[0] | null>(null);
  const [accountName, setAccountName] = useState("");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [simulatingStep, setSimulatingStep] = useState(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // CSV Upload States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      
      const accountsList = await accountsApi.getAll();
      setAccounts(accountsList);

      const importsList = await accountsApi.getImports();
      setImports(importsList);
    } catch (err: any) {
      console.error("Failed to load accounts metadata", err);
      setError(err.message || "Failed to load connected accounts data.");
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

  // Connection Simulation Actions
  const handleOpenConnect = (provider: typeof PROVIDERS[0]) => {
    setSelectedProvider(provider);
    setAccountName(`My ${provider.name} Connection`);
    setSimulatingStep(0);
    setSimulationLogs([]);
    setIsSimulating(false);
    setIsConnectModalOpen(true);
  };

  const startConnectionSimulation = async () => {
    if (!accountName.trim() || !selectedProvider) return;
    
    setIsSimulating(true);
    setSimulatingStep(1);
    
    const logs = [
      `Initializing secure API handshake with ${selectedProvider.name} OAuth gateway...`,
      `Requesting passive read-only financial query permissions...`,
      `Validating credential hash and digital certificates...`,
      `Syncing past 90 days transaction records...`,
      `Account verification completed successfully!`
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSimulationLogs((prev) => [...prev, logs[i]]);
      setSimulatingStep(i + 2);
    }

    try {
      await accountsApi.connect(selectedProvider.id, accountName);
      
      // Refresh local accounts list
      const accountsList = await accountsApi.getAll();
      setAccounts(accountsList);
      
      setTimeout(() => {
        setIsConnectModalOpen(false);
        setSelectedProvider(null);
        setAccountName("");
        setIsSimulating(false);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setSimulationLogs((prev) => [...prev, `Error occurred: ${err.message || "Connection failed"}`]);
      setIsSimulating(false);
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect '${name}'? This will disable automated sync logs.`)) {
      return;
    }
    
    try {
      await accountsApi.disconnect(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error(err);
      alert("Failed to disconnect account. Please try again.");
    }
  };

  // CSV Drag-and-Drop and Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setUploadSuccess(null);
      setUploadError(null);
    }
  };

  const handleUploadCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const result = await accountsApi.uploadCSV(formData);
      setUploadSuccess(`Successfully imported ${result.length} transaction entries from statement file!`);
      setCsvFile(null);
      
      // Reload lists
      const importsList = await accountsApi.getImports();
      setImports(importsList);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.detail || "Parsing failed. Please verify the CSV columns: date, merchant, amount, type, payment_method.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const headers = "date,merchant,amount,type,payment_method\n";
    const rows = [
      "2026-06-18,Swiggy Restaurant,380.00,debit,Google Pay UPI",
      "2026-06-19,Amazon India Pay,2400.00,debit,Axis Credit Card",
      "2026-06-20,Zomato Delivery,450.00,debit,PhonePe Wallet",
      "2026-06-21,Netflix Entertainment,499.00,debit,Paytm AutoPay",
      "2026-06-21,Salary Credit,45000.00,credit,Bank Account Direct",
      "2026-06-22,Cashback Rewards,120.00,credit,Amazon Pay Balance"
    ].join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finsight_sample_statement.csv";
    a.click();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      {/* Sidebar navigation */}
      <Sidebar onLogout={() => { authApi.logout(); router.push("/login"); }} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main panel */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 space-y-6 z-10 max-w-7xl w-full mx-auto">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
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
                <h2 className="text-2xl font-black text-slate-800 tracking-wide">CONNECT ACCOUNTS</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link your payment wallets, credit cards, or upload CSV files to aggregate your data.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <ServiceOffline error={error} onRetry={loadData} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Link New Providers & Connected Accounts */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Section: Choose Provider */}
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Add Account Connection
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Link wallets, cards, or bank APIs in read-only sandbox mode.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {PROVIDERS.map((provider) => {
                        const Icon = provider.icon;
                        const isConnected = accounts.some((a) => a.provider === provider.id && a.status === "CONNECTED");
                        
                        return (
                          <button
                            key={provider.id}
                            onClick={() => handleOpenConnect(provider)}
                            suppressHydrationWarning={true}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-slate-100 hover:border-[#2874F0]/40 bg-white hover:bg-blue-50/20 transition-all duration-200 group text-center space-y-3 shadow-sm hover:shadow"
                          >
                            <div className={`p-3 rounded-2xl ${provider.color} transition-transform duration-250 group-hover:scale-105`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs font-black text-slate-700 block tracking-wide">
                                {provider.name}
                              </span>
                              {isConnected ? (
                                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold py-0 px-2 rounded-full">
                                  Linked
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold block">
                                  Not Connected
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Section: Connected Accounts Table */}
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-base font-black text-slate-800 uppercase tracking-wider">
                      Active Connections
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      You have {accounts.length} active read-only connection feeds linked to this account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {accounts.length === 0 ? (
                      <div className="text-center py-12 px-4 flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                          <Link2 className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-700">No active accounts</h4>
                        <p className="text-xs text-slate-400 max-w-sm mt-1">
                          You haven&apos;t connected any accounts or bank channels yet. Select a provider above to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="py-3 px-2">Provider</th>
                              <th className="py-3 px-2">Connection Name</th>
                              <th className="py-3 px-2">Status</th>
                              <th className="py-3 px-2">Last Synced</th>
                              <th className="py-3 px-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {accounts.map((acc) => {
                              const providerMeta = PROVIDERS.find((p) => p.id === acc.provider);
                              const ProvIcon = providerMeta?.icon || Link2;
                              
                              return (
                                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-4 px-2 flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${providerMeta?.color || "bg-slate-100"}`}>
                                      <ProvIcon className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-slate-700">{acc.provider}</span>
                                  </td>
                                  <td className="py-4 px-2 font-semibold text-slate-600">
                                    {acc.account_name}
                                  </td>
                                  <td className="py-4 px-2">
                                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                                      {acc.status}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-2 text-slate-400 flex items-center gap-1 font-medium mt-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDate(acc.last_synced)}
                                  </td>
                                  <td className="py-4 px-2 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDisconnect(acc.id, acc.account_name)}
                                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 border-slate-200 rounded-lg"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Right Column: Statement Upload Area */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Statement CSV Uploader */}
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-slate-50 bg-[#2874F0]/5">
                    <CardTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="text-[#2874F0] h-5 w-5" />
                      Statement Import
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Upload your bank or wallet statements manually using CSV standard logs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    
                    {/* Sample statement download section */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                      <FileText className="text-blue-500 h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700">Need a sample file?</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Generate and download a mock statement to verify correct categorization and cashback simulation.
                        </p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDownloadSample} 
                          className="h-7 px-3 bg-white text-xs border-blue-200 hover:bg-blue-50 text-blue-600 font-bold rounded-lg flex items-center gap-1.5"
                        >
                          <Download className="h-3 w-3" />
                          Download Sample CSV
                        </Button>
                      </div>
                    </div>

                    {/* Drag & Drop File Form */}
                    <form onSubmit={handleUploadCSV} className="space-y-4">
                      <div className="border-2 border-dashed border-slate-200 hover:border-[#2874F0]/50 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 bg-slate-50/50 relative">
                        <input 
                          type="file" 
                          accept=".csv" 
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <Upload className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-700">
                              {csvFile ? csvFile.name : "Select bank statement CSV"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Only standard .csv file format supported
                            </p>
                          </div>
                        </div>
                      </div>

                      {uploadError && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-rose-600 text-[11px] font-semibold leading-relaxed">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {uploadSuccess && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-emerald-600 text-[11px] font-semibold leading-relaxed">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{uploadSuccess}</span>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={!csvFile || uploading}
                        className="w-full bg-[#2874F0] hover:bg-[#1B4FAD] text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading & Categorizing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Process Statement
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Import Logs History */}
                <Card className="border-none shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400" />
                      Import Logs History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {imports.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-6">
                        No logs recorded yet. Upload a statement file to populate.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {imports.map((imp) => (
                          <div 
                            key={imp.id} 
                            className="p-3 border border-slate-100 hover:border-slate-200 bg-slate-50/20 rounded-xl flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="space-y-1 max-w-[70%]">
                              <span className="font-bold text-slate-700 truncate block text-[11px]">
                                {imp.file_name}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {formatDate(imp.import_date)}
                              </span>
                            </div>
                            <div className="text-right space-y-1.5 flex flex-col items-end">
                              <Badge className={
                                imp.status === "SUCCESS" 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold" 
                                  : "bg-rose-50 text-rose-600 border border-rose-100 font-bold"
                              }>
                                {imp.status}
                              </Badge>
                              {imp.status === "SUCCESS" && (
                                <span className="text-[9px] text-slate-500 font-bold block bg-slate-100 px-1.5 py-0.5 rounded-full">
                                  {imp.records_count} transactions
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

            </div>
          )}
        </main>
      </div>

      {/* Account Connection Simulation Modal */}
      <Dialog isOpen={isConnectModalOpen} onClose={() => !isSimulating && setIsConnectModalOpen(false)}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[#2874F0]" />
              Link {selectedProvider?.name} Wallet
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Establish a secure read-only token-based synchronization hook to FinSight AI.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Account Label / Name
              </label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. HDFC Card, My UPI"
                disabled={isSimulating}
                className="rounded-xl border-slate-200 text-xs py-2 px-3 focus:ring-1 focus:ring-[#2874F0]"
              />
            </div>

            {/* Connection logs simulation */}
            {isSimulating && (
              <div className="bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl p-4 space-y-2 overflow-y-auto max-h-48 border border-slate-800 shadow-inner">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-1.5 mb-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>SYNCING WITH {selectedProvider?.name.toUpperCase()}...</span>
                </div>
                {simulationLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1.5 animate-fade-in">
                    <span className="text-[#2874F0] font-bold">&gt;</span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConnectModalOpen(false)}
              disabled={isSimulating}
              className="border-slate-200 rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={startConnectionSimulation}
              disabled={isSimulating || !accountName.trim()}
              className="bg-[#2874F0] hover:bg-[#1B4FAD] text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm Connection
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
