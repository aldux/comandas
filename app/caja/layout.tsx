"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, ReceiptText, Utensils, Printer, Package } from "lucide-react";

export default function CajaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/caja/dashboard", icon: LayoutDashboard },
    { name: "Ventas", href: "/caja/ventas", icon: ReceiptText },
    { name: "Menú", href: "/caja/menu", icon: Utensils },
    { name: "Impresoras", href: "/caja/impresoras", icon: Printer },
  ];

  return (
    <div className="min-h-screen bg-surface-base text-zinc-50 flex">
      {/* Sidebar Lateral */}
      <aside className="w-[280px] bg-surface-card border-r border-zinc-800/50 flex-col hidden md:flex z-10 shadow-glass">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shadow-neon">
              <Package size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Comandas</h1>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest pl-11">Terminal de Caja</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {links.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name}
                href={link.href} 
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200
                  ${isActive 
                    ? "bg-brand/10 text-brand shadow-sm border border-brand/20 relative" 
                    : "text-zinc-400 hover:bg-surface-hover hover:text-zinc-100 border border-transparent"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-brand rounded-r-full" />
                )}
                <Icon size={20} className={isActive ? "text-brand" : "text-zinc-500"} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mb-4">
          <button className="flex w-full items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-2xl font-semibold transition-all border border-transparent hover:border-red-500/20 active:scale-95">
            <LogOut size={20} />
            Cerrar Turno
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header móvil */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between p-4 bg-surface-card/80 backdrop-blur-xl border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center">
              <Package size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-white">Comandas</h1>
          </div>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-surface-base">
          {children}
        </div>
      </main>
    </div>
  );
}
