"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cobrarPedido } from "@/acciones/caja";
import { Loader2, Banknote, CreditCard, Smartphone, Receipt, CheckCircle2 } from "lucide-react";

// Interfaces
interface Mesa {
  id: string;
  numero: number;
  estado: string;
}

interface Pedido {
  id: string;
  mesa_id: string;
  total: number;
  estado: string;
  tipo_pedido: string;
  created_at: string;
  mesas?: { numero: number };
}

export default function CajaDashboard() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cobroExitoso, setCobroExitoso] = useState(false);

  useEffect(() => {
    // 1. Cargar datos iniciales
    fetchData();

    // 2. Suscripción Realtime a Mesas
    const mesasSubscription = supabase
      .channel('mesas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => {
        fetchData(); // Simplificado: recargamos todo
      })
      .subscribe();

    // 3. Suscripción Realtime a Pedidos
    const pedidosSubscription = supabase
      .channel('pedidos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(mesasSubscription);
      supabase.removeChannel(pedidosSubscription);
    };
  }, []);

  const fetchData = async () => {
    // Obtener mesas
    const { data: mesasData } = await supabase.from('mesas').select('*').order('numero');
    if (mesasData) setMesas(mesasData);

    // Obtener pedidos activos (preparando, listo o cobrado)
    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('*, mesas(numero)')
      .in('estado', ['preparando', 'listo', 'cobrado'])
      .order('created_at', { ascending: false });
      
    if (pedidosData) setPedidos(pedidosData);
  };

  const openCobroModal = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setIsModalOpen(true);
    setCobroExitoso(false);
  };

  const closeCobroModal = () => {
    setIsModalOpen(false);
    setPedidoSeleccionado(null);
    setIsProcessing(false);
    setCobroExitoso(false);
  };

  const handleCobrar = async (metodo: "efectivo" | "tarjeta_tpv" | "bizum") => {
    if (!pedidoSeleccionado) return;
    
    setIsProcessing(true);
    
    const res = await cobrarPedido(pedidoSeleccionado.id, pedidoSeleccionado.mesa_id, metodo);
    
    if (res.success) {
      setCobroExitoso(true);
      setTimeout(() => {
        closeCobroModal();
        fetchData(); // Refrescar UI (aunque realtime debería hacerlo)
      }, 1500);
    } else {
      setIsProcessing(false);
      alert(res.error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Columna Izquierda: Mesas */}
      <section className="lg:w-1/3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
          Estado de Mesas
        </h2>
        <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              className={`
                aspect-square rounded-xl p-3 flex flex-col items-center justify-center border shadow-sm transition-all
                ${mesa.estado === 'libre' 
                  ? 'bg-emerald-900/20 border-emerald-800/40 text-emerald-500' 
                  : 'bg-red-900/20 border-red-800/40 text-red-500'}
              `}
            >
              <span className="text-3xl font-bold">{mesa.numero}</span>
              <span className="text-xs font-medium uppercase tracking-wider mt-1">
                {mesa.estado}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Columna Derecha: Comandas Activas */}
      <section className="lg:w-2/3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
          <Receipt size={24} className="text-emerald-500" />
          Comandas Activas
          <span className="bg-zinc-800 text-zinc-300 text-sm py-1 px-3 rounded-full">
            {pedidos.length}
          </span>
          <a 
            href="/caja/delivery"
            className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-1.5 px-4 rounded-xl transition-colors shadow-md"
          >
            + Nuevo Delivery
          </a>
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {pedidos.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 italic">
              No hay comandas activas en este momento.
            </div>
          ) : (
            pedidos.map((pedido) => (
              <div 
                key={pedido.id} 
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    {pedido.tipo_pedido === 'delivery' ? (
                      <span className="bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 font-bold px-3 py-1 rounded-lg flex items-center gap-2">
                        <span>🛵</span> DELIVERY
                      </span>
                    ) : (
                      <span className="bg-zinc-800 text-emerald-400 font-bold px-3 py-1 rounded-lg">
                        Mesa {pedido.mesas?.numero || '?'}
                      </span>
                    )}
                    {pedido.estado === 'listo' ? (
                      <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-700 text-blue-400 uppercase tracking-wider">
                        ENTREGADO
                      </span>
                    ) : (
                      <span className="text-sm px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-400 uppercase">
                        {pedido.estado}
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-500 text-sm mt-2">
                    Pedido #{pedido.id.split('-')[0]}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="text-right flex-1 sm:flex-none">
                    <p className="text-xs text-zinc-400">Total</p>
                    <p className="text-2xl font-bold text-zinc-100">${pedido.total.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {pedido.estado === 'cobrado' && pedido.tipo_pedido !== 'delivery' ? (
                      <button 
                        onClick={async () => {
                          const { liberarMesa } = await import("@/acciones/caja");
                          const res = await liberarMesa(pedido.id, pedido.mesa_id);
                          if (!res.success) alert(res.error);
                          else fetchData();
                        }}
                        className="bg-zinc-100 hover:bg-zinc-300 text-zinc-900 font-bold py-2 px-6 rounded-xl transition-colors shadow-lg active:scale-95"
                      >
                        Liberar Mesa
                      </button>
                    ) : (
                      <>
                        {pedido.tipo_pedido === 'delivery' ? (
                          <button 
                            onClick={async () => {
                              if (window.confirm("¿Marcar este delivery como entregado al repartidor? Se sumará a las ventas de hoy.")) {
                                const { entregarDelivery } = await import("@/acciones/caja");
                                const res = await entregarDelivery(pedido.id);
                                if (!res.success) alert(res.error);
                                else fetchData();
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-xl transition-colors shadow-lg active:scale-95"
                          >
                            Entregado
                          </button>
                        ) : (
                          <button 
                            onClick={() => openCobroModal(pedido)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-6 rounded-xl transition-colors shadow-lg active:scale-95"
                          >
                            Cobrar
                          </button>
                        )}
                        <button 
                          onClick={async () => {
                            if (window.confirm("¿Estás seguro de anular este pedido? Esta acción no se puede deshacer.")) {
                              const { anularPedido } = await import("@/acciones/caja");
                              const res = await anularPedido(pedido.id, pedido.mesa_id);
                              if (!res.success) alert(res.error);
                              else fetchData();
                            }
                          }}
                          className="bg-zinc-800 hover:bg-red-900/60 text-zinc-300 hover:text-red-400 font-semibold py-1.5 px-6 rounded-xl transition-colors text-sm border border-zinc-700 hover:border-red-900/50"
                        >
                          Anular
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal de Cobro */}
      {isModalOpen && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-zinc-800 text-center">
              <h3 className="text-xl font-bold text-zinc-100">
                Cobrar {pedidoSeleccionado.tipo_pedido === 'delivery' ? 'Delivery' : `Mesa ${pedidoSeleccionado.mesas?.numero}`}
              </h3>
              <p className="text-3xl font-bold text-emerald-400 mt-2">${pedidoSeleccionado.total.toFixed(2)}</p>
            </div>

            <div className="p-6 flex flex-col gap-3">
              {cobroExitoso ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-500">
                  <CheckCircle2 size={64} className="mb-4" />
                  <h4 className="text-xl font-bold text-zinc-100">¡Cobro Registrado!</h4>
                  <p className="text-zinc-400 mt-1 text-center text-sm px-4">El pedido ha sido marcado como pagado. Recuerde liberar la mesa luego.</p>
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                  <Loader2 size={48} className="animate-spin mb-4 text-emerald-500" />
                  <p>Procesando pago...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-400 mb-2 text-center">Seleccione el método de pago</p>
                  
                  <button 
                    onClick={() => handleCobrar('efectivo')}
                    className="flex items-center justify-center gap-3 w-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-medium py-4 rounded-xl border border-zinc-700 transition-all"
                  >
                    <Banknote size={24} className="text-emerald-500" />
                    Efectivo
                  </button>
                  
                  <button 
                    onClick={() => handleCobrar('tarjeta_tpv')}
                    className="flex items-center justify-center gap-3 w-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-medium py-4 rounded-xl border border-zinc-700 transition-all"
                  >
                    <CreditCard size={24} className="text-blue-400" />
                    Tarjeta (TPV)
                  </button>
                  
                  <button 
                    onClick={() => handleCobrar('bizum')}
                    className="flex items-center justify-center gap-3 w-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-medium py-4 rounded-xl border border-zinc-700 transition-all"
                  >
                    <Smartphone size={24} className="text-indigo-400" />
                    Bizum
                  </button>
                  
                  <button 
                    onClick={closeCobroModal}
                    className="mt-4 text-zinc-500 hover:text-zinc-300 py-2 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
