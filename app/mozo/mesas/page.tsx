"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { User, LogOut } from "lucide-react";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { User, LogOut, ArrowRight, CheckCircle } from "lucide-react";

export default function MesasPage() {
  const router = useRouter();
  const { mozoActivo, setMozo, setMesa, limpiarCarrito } = useAppStore();

  // Redirigir a login si no hay mozo activo
  React.useEffect(() => {
    if (!mozoActivo) {
      router.push("/mozo/login");
    } else {
      // Siempre que llegamos a la pantalla de mesas, limpiamos cualquier carrito y mesa anterior
      setMesa(null);
      limpiarCarrito();
    }
  }, [mozoActivo, router, setMesa, limpiarCarrito]);

  if (!mozoActivo) {
    return null; // Evitar renderizado mientras redirige
  }

  const [mesas, setMesas] = React.useState<any[]>([]);

  React.useEffect(() => {
    // 1. Carga inicial
    const fetchMesas = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.from('mesas').select('*').order('numero');
      if (data) setMesas(data);
    };
    fetchMesas();

    // 2. Suscripción Realtime
    let mesasSubscription: any;
    const initRealtime = async () => {
      const { supabase } = await import("@/lib/supabase");
      mesasSubscription = supabase
        .channel('mesas_mozo_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => {
          fetchMesas();
        })
        .subscribe();
    };
    initRealtime();

    return () => {
      if (mesasSubscription) {
        import("@/lib/supabase").then(({ supabase }) => {
          supabase.removeChannel(mesasSubscription);
        });
      }
    };
  }, []);

  const [mesaOcupadaSeleccionada, setMesaOcupadaSeleccionada] = React.useState<any | null>(null);

  const handleSelectMesa = (mesa: { id: string; numero: number; estado: string }) => {
    if (mesa.estado === "ocupada") {
      setMesaOcupadaSeleccionada(mesa);
    } else {
      setMesa(mesa);
      router.push("/mozo/menu");
    }
  };

  const handleMarcarEntregado = async () => {
    if (!mesaOcupadaSeleccionada) return;
    const { supabase } = await import("@/lib/supabase");
    
    // Buscar el pedido activo de esta mesa
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id')
      .eq('mesa_id', mesaOcupadaSeleccionada.id)
      .eq('estado', 'preparando')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pedido) {
      const { marcarListo } = await import("@/acciones/caja");
      const res = await marcarListo(pedido.id);
      if (!res.success) alert(res.error);
      else alert("¡Comida marcada como entregada!");
    } else {
      alert("No hay pedidos 'preparando' para esta mesa.");
    }
    setMesaOcupadaSeleccionada(null);
  };

  const handleAgregarProductos = () => {
    if (!mesaOcupadaSeleccionada) return;
    setMesa(mesaOcupadaSeleccionada);
    setMesaOcupadaSeleccionada(null);
    router.push("/mozo/menu");
  };

  const handleLogout = () => {
    setMozo(null);
    router.push("/mozo/login");
  };

  return (
    <main className="min-h-screen w-full flex flex-col p-4 bg-surface-base text-zinc-50 pb-20">
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-surface-card border border-zinc-800 p-2.5 rounded-2xl shadow-sm">
            <User size={20} className="text-brand-light" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Turno Activo</p>
            <h2 className="font-semibold text-lg leading-tight">{mozoActivo.nombre}</h2>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 text-zinc-500 hover:text-white hover:bg-surface-hover rounded-xl transition-colors active:scale-95"
        >
          <LogOut size={22} />
        </button>
      </header>

      {/* Título de sección */}
      <div className="mb-6 px-1">
        <h1 className="text-3xl font-black tracking-tight text-white">Salón</h1>
        <p className="text-zinc-400 text-sm mt-1">Selecciona una mesa para tomar pedido</p>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 gap-4">
        {mesas.map((mesa) => {
          const isOcupada = mesa.estado === "ocupada";
          
          return (
            <button
              key={mesa.id}
              onClick={() => handleSelectMesa(mesa)}
              className={`
                group relative overflow-hidden flex flex-col items-start justify-between aspect-square rounded-[2rem] p-5 transition-all duration-300 ease-out select-none
                active:scale-[0.97] border text-left
                ${isOcupada 
                  ? "bg-surface-card border-zinc-800/50 hover:border-brand/50 shadow-glass" 
                  : "bg-surface-base border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }
              `}
            >
              {/* Indicador de estado */}
              {isOcupada ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-brand-light opacity-80" />
                  <div className="flex w-full justify-between items-center">
                    <span className="text-zinc-400 font-medium tracking-widest text-xs uppercase">Mesa</span>
                    <div className="flex items-center gap-1.5 bg-brand/10 text-brand px-2.5 py-1 rounded-full text-[10px] font-bold border border-brand/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                      Ocupada
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex w-full justify-between items-center">
                  <span className="text-zinc-500 font-medium tracking-widest text-xs uppercase">Mesa</span>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-50">Libre</div>
                </div>
              )}

              <div className="mt-auto w-full">
                <span className={`text-6xl font-black tracking-tighter ${isOcupada ? 'text-white' : 'text-zinc-600'}`}>
                  {mesa.numero}
                </span>
                
                {/* Arrow hint for ocupada */}
                <div className={`mt-2 flex items-center text-sm font-medium transition-all ${isOcupada ? 'text-brand opacity-100' : 'opacity-0 translate-y-2'}`}>
                  Ver pedido <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {/* Modal para Mesas Ocupadas */}
      {mesaOcupadaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
          <div className="bg-surface-base border border-zinc-800 rounded-[2rem] w-full max-w-sm p-6 flex flex-col shadow-glass animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex items-center justify-center w-16 h-16 bg-surface-card rounded-2xl border border-zinc-800 mx-auto mb-4 shadow-sm">
              <span className="text-3xl font-black text-white">{mesaOcupadaSeleccionada.numero}</span>
            </div>
            
            <h3 className="text-2xl font-bold text-center text-white mb-2">Mesa Ocupada</h3>
            <p className="text-center text-zinc-400 text-sm mb-8 px-4">Selecciona una acción para continuar con esta mesa.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleMarcarEntregado}
                className="flex items-center justify-center gap-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600/20 active:scale-[0.98] font-semibold py-4 rounded-2xl transition-all"
              >
                <CheckCircle size={20} />
                Marcar Entregado
              </button>
              
              <button 
                onClick={handleAgregarProductos}
                className="flex items-center justify-center gap-2 bg-brand text-white hover:bg-brand-light active:scale-[0.98] font-bold py-4 rounded-2xl transition-all shadow-neon"
              >
                Añadir al Pedido
              </button>

              <button 
                onClick={() => setMesaOcupadaSeleccionada(null)}
                className="mt-2 text-zinc-500 hover:text-white font-medium py-3 rounded-xl transition-colors active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
