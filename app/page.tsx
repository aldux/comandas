import Link from "next/link";
import { ChefHat, MonitorDot } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-emerald-500 mb-4 tracking-tight">ComandasApp</h1>
          <p className="text-zinc-400 text-lg">Selecciona tu portal de acceso</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link 
            href="/mozo/login"
            className="flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-emerald-500/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-zinc-100">Mozo / Salón</h2>
                <p className="text-zinc-500 text-sm mt-1">Toma de pedidos con PIN</p>
              </div>
            </div>
            <span className="text-zinc-600 group-hover:text-emerald-500 transition-colors">→</span>
          </Link>

          <Link 
            href="/caja/login"
            className="flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                <MonitorDot className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-zinc-100">Caja / Admin</h2>
                <p className="text-zinc-500 text-sm mt-1">Cobros y gestión de menú</p>
              </div>
            </div>
            <span className="text-zinc-600 group-hover:text-blue-500 transition-colors">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
