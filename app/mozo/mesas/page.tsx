"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { User, LogOut } from "lucide-react";

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
    <main className="min-h-screen w-full flex flex-col p-4 bg-zinc-950 text-zinc-50 pb-20">
      {/* Header */}
      <header className="flex items-center justify-between py-4 border-b border-zinc-800 mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800 p-2 rounded-full">
            <User size={20} className="text-zinc-300" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">Mozo</p>
            <h2 className="font-medium">{mozoActivo.nombre}</h2>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 text-zinc-400 hover:text-white transition-colors"
        >
          <LogOut size={24} />
        </button>
      </header>

      {/* Título de sección */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Selecciona una mesa</h1>
        <p className="text-zinc-400 text-sm mt-1">Toca para tomar un nuevo pedido</p>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {mesas.map((mesa) => (
          <button
            key={mesa.id}
            onClick={() => handleSelectMesa(mesa)}
            className={`
              flex flex-col items-center justify-center aspect-square rounded-2xl p-4 transition-all
              active:scale-95 shadow-md border
              ${mesa.estado === "ocupada" 
                ? "bg-zinc-800 border-zinc-700 text-zinc-300" 
                : "bg-emerald-900/30 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/40"
              }
            `}
          >
            <span className="text-5xl font-bold mb-2">{mesa.numero}</span>
            <span className="text-sm font-medium uppercase tracking-wider">
              {mesa.estado}
            </span>
          </button>
        ))}
      </div>
      {/* Modal para Mesas Ocupadas */}
      {mesaOcupadaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 flex flex-col shadow-2xl">
            <h3 className="text-xl font-bold text-center text-zinc-100 mb-2">Mesa {mesaOcupadaSeleccionada.numero}</h3>
            <p className="text-center text-zinc-400 text-sm mb-6">Esta mesa ya tiene un pedido en curso.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleMarcarEntregado}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
              >
                Marcar Comida Entregada
              </button>
              
              <button 
                onClick={handleAgregarProductos}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
              >
                Añadir más productos
              </button>

              <button 
                onClick={() => setMesaOcupadaSeleccionada(null)}
                className="mt-2 text-zinc-500 hover:text-zinc-300 font-medium py-3 transition-colors"
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
