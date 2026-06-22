"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Sparkles, 
  TrendingUp, 
  User, 
  LogOut,
  BrainCircuit
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { authApi } from "@/app/lib/api";

interface SidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ onLogout, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Cashback Rules", href: "/cashback", icon: CreditCard },
    { name: "Offers & AI Simplifier", href: "/offers", icon: Sparkles },
    { name: "Insights & Advice", href: "/insights", icon: TrendingUp },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-45 w-64 glass-sidebar transition-transform duration-300 transform md:translate-x-0 flex flex-col justify-between p-6",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-8">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="FinSight Logo" className="h-10 w-10 rounded-xl shadow-md bg-white border border-slate-100" />
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-wide leading-none">
                FINSIGHT <span className="text-[#2874F0]">AI</span>
              </h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Unified Intel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 group border-l-4",
                    isActive
                      ? "bg-blue-50/80 text-[#2874F0] border-[#2874F0] rounded-r-lg pl-3"
                      : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-[#2874F0]" : "text-slate-500 group-hover:text-slate-800"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout Button */}
        <button
          onClick={() => {
            if (confirm("Are you sure you want to log out of FinSight AI?")) {
              onLogout();
            }
          }}
          suppressHydrationWarning={true}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </aside>
    </>
  );
}
