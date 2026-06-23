import React from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, ReceiptText, Utensils, Printer } from "lucide-react";

export default function CajaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold tracking-tight text-emerald-500">ComandasApp</h1>
          <p className="text-sm text-zinc-400 mt-1">Portal de Caja</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/caja/dashboard" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl font-medium transition-colors"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link 
            href="/caja/ventas" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl font-medium transition-colors"
          >
            <ReceiptText size={20} />
            Ventas
          </Link>
          <Link 
            href="/caja/menu" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl font-medium transition-colors"
          >
            <Utensils size={20} />
            Menú
          </Link>
          <Link 
            href="/caja/impresoras" 
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl font-medium transition-colors"
          >
            <Printer size={20} />
            Impresoras
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-xl font-medium transition-colors">
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil (visible solo en pantallas pequeñas) */}
        <header className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-emerald-500">Caja</h1>
          <button className="text-zinc-400">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
