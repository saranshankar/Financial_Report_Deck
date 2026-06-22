"use client";

import { useState } from "react";
import { Menu, Bell, Search, Sparkles, X, Clock, AlertTriangle } from "lucide-react";
import { User, authApi, searchApi, GlobalSearchResponse } from "@/app/lib/api";
import { Input } from "./ui/Input";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopbarProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Topbar({ user, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Global Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length === 0) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    
    setSearching(true);
    setShowSearchDropdown(true);
    try {
      const results = await searchApi.globalSearch(value);
      setSearchResults(results);
    } catch (err) {
      console.error("Global search failed", err);
    } finally {
      setSearching(false);
    }
  };

  const handleDropdownLogout = () => {
    if (confirm("Are you sure you want to log out of FinSight AI?")) {
      authApi.logout();
      router.push("/login");
    }
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Offer expires in 2 days",
      description: "Swiggy HDFC Instant Discount is expiring on June 22.",
      time: "2h ago",
      type: "alert",
      read: false,
    },
    {
      id: "2",
      title: "You missed ₹75 cashback yesterday",
      description: "You paid via standard UPI at Zomato. Using Axis Ace would have saved ₹75.",
      time: "1d ago",
      type: "missed",
      read: false,
    },
    {
      id: "3",
      title: "Better payment method available",
      description: "Axis Ace yields 5% cashback on utility payments. Switch now to save more.",
      time: "2d ago",
      type: "info",
      read: false,
    }
  ]);

  // Extract user initials
  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-4 flex-1">
        <button
          suppressHydrationWarning={true}
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-slate-50 md:hidden text-slate-700 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search Input Panel */}
        <div className="relative max-w-sm w-full hidden sm:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            placeholder="Search transactions, offers, subscriptions..."
            className="pl-9 bg-slate-50 border-slate-200 text-xs placeholder:text-slate-400 text-slate-800 w-full focus:bg-white rounded-xl h-9"
          />
          
          {showSearchDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)} />
              <div className="absolute left-0 mt-2 w-[420px] bg-white border border-slate-200 rounded-xl shadow-xl z-55 max-h-96 overflow-y-auto p-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 text-xs font-semibold">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Results</span>
                  <button 
                    onClick={() => { setSearchQuery(""); setSearchResults(null); setShowSearchDropdown(false); }}
                    className="text-[10px] text-slate-400 hover:text-slate-650 font-bold"
                  >
                    Clear
                  </button>
                </div>

                {searching ? (
                  <div className="flex justify-center items-center py-6 text-slate-400">
                    <span className="animate-spin rounded-full h-4.5 w-4.5 border-t-2 border-slate-350 mr-2" />
                    <span>Searching platform...</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Category: Transactions */}
                    {searchResults?.transactions && searchResults.transactions.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <h4 className="text-[9px] font-black text-[#2874F0] uppercase tracking-wider">Transactions</h4>
                        <div className="space-y-1">
                          {searchResults.transactions.map((tx) => (
                            <Link 
                              key={tx.id}
                              href="/transactions" 
                              onClick={() => setShowSearchDropdown(false)}
                              className="flex justify-between p-1.5 rounded hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-slate-700 font-bold truncate max-w-[200px]">{tx.merchant}</span>
                              <div className="space-x-2">
                                <span className="text-slate-400 text-[10px]">{tx.category}</span>
                                <span className="text-slate-800 font-black">₹{tx.amount}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category: Subscriptions */}
                    {searchResults?.subscriptions && searchResults.subscriptions.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <h4 className="text-[9px] font-black text-purple-600 uppercase tracking-wider">Subscriptions</h4>
                        <div className="space-y-1">
                          {searchResults.subscriptions.map((sub) => (
                            <Link 
                              key={sub.id}
                              href="/subscriptions" 
                              onClick={() => setShowSearchDropdown(false)}
                              className="flex justify-between p-1.5 rounded hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-slate-700 font-bold truncate">{sub.name}</span>
                              <span className="text-slate-800 font-black">₹{sub.monthly_cost}/mo</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category: Offers */}
                    {searchResults?.offers && searchResults.offers.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Offers & Rewards</h4>
                        <div className="space-y-1">
                          {searchResults.offers.map((offer) => (
                            <Link 
                              key={offer.id}
                              href="/offers" 
                              onClick={() => setShowSearchDropdown(false)}
                              className="flex flex-col p-1.5 rounded hover:bg-slate-50 transition-colors text-left"
                            >
                              <span className="text-slate-700 font-bold">{offer.title}</span>
                              <span className="text-slate-400 text-[10px] truncate max-w-[350px] font-medium">{offer.merchant} | {offer.original_terms}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category: Connected Accounts */}
                    {searchResults?.accounts && searchResults.accounts.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Connected Accounts Feeds</h4>
                        <div className="space-y-1">
                          {searchResults.accounts.map((acc) => (
                            <Link 
                              key={acc.id}
                              href="/connect-accounts" 
                              onClick={() => setShowSearchDropdown(false)}
                              className="flex justify-between p-1.5 rounded hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-slate-700 font-bold truncate">{acc.account_name}</span>
                              <span className="text-emerald-600 text-[10px] font-bold uppercase">{acc.provider}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!searchResults || (
                      searchResults.transactions.length === 0 &&
                      searchResults.subscriptions.length === 0 &&
                      searchResults.offers.length === 0 &&
                      searchResults.accounts.length === 0
                    )) && (
                      <div className="text-center py-6 text-slate-400 text-[11px]">
                        No results match &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        {/* Active Insights Notification indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold select-none hidden md:flex">
          <Sparkles className="h-3 w-3.5 text-emerald-600 animate-pulse" />
          AI Engine Online
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button 
            suppressHydrationWarning={true}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#2874F0] text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Smart Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    suppressHydrationWarning={true}
                    className="text-[10px] text-[#2874F0] font-bold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-3 text-xs transition-colors hover:bg-slate-50 relative ${!n.read ? 'bg-blue-50/20' : ''}`}
                    >
                      <button 
                        onClick={() => removeNotification(n.id)}
                        suppressHydrationWarning={true}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-650"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="flex gap-2 pr-4">
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'alert' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                          {n.type === 'missed' && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                          {n.type === 'info' && <Sparkles className="h-3.5 w-3.5 text-[#2874F0]" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">{n.description}</p>
                          <span className="text-[9px] text-slate-400 font-medium block mt-1.5">{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-[11px]">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Identity Details & Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors select-none"
          >
            <div className="text-right hidden sm:block font-bold">
              <p className="text-sm text-slate-800 leading-none">
                {user?.full_name || "Demo User"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                {user?.email || "demo@finsight.ai"}
              </p>
            </div>
            
            <div className="h-9 w-9 rounded-full bg-[#2874F0] flex items-center justify-center text-sm font-bold text-white shadow-sm border border-slate-200/50">
              {getInitials(user?.full_name)}
            </div>
          </div>

          {showUserDropdown && (
            <>
              {/* Overlay transparent to close dropdown on clicking outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-850 truncate">{user?.full_name || "Demo User"}</p>
                  <p className="text-[10px] text-slate-450 truncate mt-0.5 font-semibold">{user?.email || "demo@finsight.ai"}</p>
                </div>
                <Link 
                  href="/profile" 
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Profile Settings
                </Link>
                <Link 
                  href="/dashboard" 
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleDropdownLogout();
                  }}
                  suppressHydrationWarning={true}
                  className="flex w-full items-center text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
