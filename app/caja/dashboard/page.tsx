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

interface PedidoItem {
  cantidad: number;
  notas: string | null;
  productos?: {
    nombre: string;
  };
}

interface Pedido {
  id: string;
  mesa_id: string;
  total: number;
  estado: string;
  tipo_pedido: string;
  created_at: string;
  mesas?: { numero: number };
  pedido_items?: PedidoItem[];
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
      .select('*, mesas(numero), pedido_items(cantidad, notas, productos(nombre))')
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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
      {/* Columna Izquierda: Mesas */}
      <section className="lg:w-[380px] flex-shrink-0 bg-surface-card border border-zinc-800/50 rounded-[2rem] p-6 flex flex-col shadow-sm">
        <h2 className="text-xl font-black tracking-tight mb-5 text-white flex items-center gap-2">
          Estado de Mesas
        </h2>
        <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {mesas.map((mesa) => {
            const isLibre = mesa.estado === 'libre';
            return (
              <div
                key={mesa.id}
                className={`
                  aspect-square rounded-[1.5rem] p-3 flex flex-col items-center justify-center border transition-all duration-200 cursor-default
                  ${isLibre 
                    ? 'bg-surface-base border-zinc-800/50 text-zinc-600' 
                    : 'bg-surface-card border-brand/40 text-brand shadow-neon'}
                `}
              >
                <span className={`text-3xl font-black ${isLibre ? 'text-zinc-500' : 'text-white'}`}>{mesa.numero}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isLibre ? 'opacity-50' : 'text-brand-light'}`}>
                  {mesa.estado}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Columna Derecha: Comandas Activas */}
      <section className="flex-1 bg-surface-card border border-zinc-800/50 rounded-[2rem] p-6 flex flex-col shadow-sm">
        <h2 className="text-xl font-black tracking-tight mb-5 text-white flex items-center gap-3">
          <Receipt size={22} className="text-zinc-400" />
          Comandas Activas
          <span className="bg-brand/10 text-brand text-xs font-bold py-1 px-3 rounded-xl border border-brand/20">
            {pedidos.length}
          </span>
          <a 
            href="/caja/delivery"
            className="ml-auto bg-surface-base hover:bg-surface-hover text-white text-sm font-semibold py-2 px-5 rounded-xl transition-colors border border-zinc-800"
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
            pedidos.map((pedido) => {
              const isDelivery = pedido.tipo_pedido === 'delivery';
              const isEntregado = pedido.estado === 'listo';

              return (
                <div 
                  key={pedido.id} 
                  className={`border rounded-[1.5rem] p-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 transition-all
                    ${isEntregado 
                      ? 'bg-blue-900/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                      : 'bg-surface-base border-zinc-800/80 hover:border-zinc-700'}
                  `}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      {isDelivery ? (
                        <span className="bg-brand-dark/20 border border-brand/30 text-brand-light text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 tracking-wider uppercase">
                          <span>🛵</span> DELIVERY
                        </span>
                      ) : (
                        <span className="bg-zinc-800 text-white font-black px-3 py-1.5 rounded-lg text-sm border border-zinc-700">
                          Mesa {pedido.mesas?.numero || '?'}
                        </span>
                      )}
                      
                      {isEntregado ? (
                        <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-blue-500 text-white uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                          Entregado
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-surface-card border border-zinc-700 text-zinc-400 uppercase tracking-widest">
                          {pedido.estado}
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-500 text-xs font-bold tracking-widest uppercase mt-3">
                      Pedido #{pedido.id.split('-')[0]}
                      <span className="ml-3 font-normal lowercase opacity-80">
                        {new Date(pedido.created_at).toLocaleString('es-AR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Detalle de los productos pedidos */}
                    {pedido.pedido_items && pedido.pedido_items.length > 0 && (
                      <div className="mt-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 text-sm">
                        <ul className="space-y-2">
                          {pedido.pedido_items.map((item, idx) => (
                            <li key={idx} className="flex flex-col text-zinc-300">
                              <div className="flex items-start">
                                <span className="font-black text-brand-light min-w-[28px]">{item.cantidad}x</span>
                                <span className="font-medium text-white">{item.productos?.nombre || 'Producto'}</span>
                              </div>
                              {item.notas && (
                                <span className="block text-zinc-500 text-xs italic mt-0.5 ml-[28px]">
                                  Nota: {item.notas}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                
                  <div className="flex flex-col xl:flex-row items-start xl:items-center gap-5 w-full xl:w-auto">
                    <div className="text-left xl:text-right flex-1 xl:flex-none">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total Pagar</p>
                      <p className="text-3xl font-black text-white">${pedido.total.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                      {pedido.estado === 'cobrado' && !isDelivery ? (
                        <button 
                          onClick={async () => {
                            const { liberarMesa } = await import("@/acciones/caja");
                            const res = await liberarMesa(pedido.id, pedido.mesa_id);
                            if (!res.success) alert(res.error);
                            else fetchData();
                          }}
                          className="flex-1 xl:flex-none bg-zinc-200 hover:bg-white text-zinc-900 font-black py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          Liberar Mesa
                        </button>
                      ) : (
                        <>
                          {isDelivery ? (
                            <button 
                              onClick={async () => {
                                if (window.confirm("¿Marcar este delivery como entregado al repartidor? Se sumará a las ventas de hoy.")) {
                                  const { entregarDelivery } = await import("@/acciones/caja");
                                  const res = await entregarDelivery(pedido.id);
                                  if (!res.success) alert(res.error);
                                  else fetchData();
                                }
                              }}
                              className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] active:scale-95"
                            >
                              Entregado
                            </button>
                          ) : (
                            <button 
                              onClick={() => openCobroModal(pedido)}
                              className="flex-1 xl:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
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
                            className="bg-transparent hover:bg-surface-hover text-zinc-500 hover:text-red-400 font-bold py-2.5 px-5 rounded-xl transition-colors text-sm border border-zinc-800 hover:border-red-900/50"
                          >
                            Anular
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal de Cobro */}
      {isModalOpen && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
          <div className="bg-surface-base border border-zinc-800 rounded-[2rem] w-full max-w-md shadow-glass overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-8 pb-6 border-b border-zinc-800/50 text-center bg-surface-card">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Cobrar {pedidoSeleccionado.tipo_pedido === 'delivery' ? 'Delivery' : `Mesa ${pedidoSeleccionado.mesas?.numero}`}
              </h3>
              <p className="text-5xl font-black text-white">${pedidoSeleccionado.total.toFixed(2)}</p>
            </div>

            <div className="p-8 flex flex-col gap-3">
              {cobroExitoso ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-500">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                    <CheckCircle2 size={64} className="relative z-10 animate-bounce" />
                  </div>
                  <h4 className="text-2xl font-black text-white">¡Cobro Registrado!</h4>
                  <p className="text-zinc-400 mt-2 text-center text-sm px-4">El pedido ha sido marcado como pagado.</p>
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 size={48} className="animate-spin mb-4 text-emerald-500" />
                  <p className="font-bold tracking-widest uppercase text-sm">Procesando...</p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 text-center">Seleccione método de pago</p>
                  
                  <button 
                    onClick={() => handleCobrar('efectivo')}
                    className="flex items-center justify-center gap-3 w-full bg-surface-card hover:bg-surface-hover hover:border-emerald-500/50 active:scale-[0.98] text-white font-bold py-4 rounded-2xl border border-zinc-800 transition-all"
                  >
                    <Banknote size={24} className="text-emerald-500" />
                    Efectivo
                  </button>
                  
                  <button 
                    onClick={() => handleCobrar('tarjeta_tpv')}
                    className="flex items-center justify-center gap-3 w-full bg-surface-card hover:bg-surface-hover hover:border-blue-500/50 active:scale-[0.98] text-white font-bold py-4 rounded-2xl border border-zinc-800 transition-all"
                  >
                    <CreditCard size={24} className="text-blue-400" />
                    Tarjeta (TPV)
                  </button>
                  
                  <button 
                    onClick={() => handleCobrar('bizum')}
                    className="flex items-center justify-center gap-3 w-full bg-surface-card hover:bg-surface-hover hover:border-indigo-500/50 active:scale-[0.98] text-white font-bold py-4 rounded-2xl border border-zinc-800 transition-all"
                  >
                    <Smartphone size={24} className="text-indigo-400" />
                    Bizum
                  </button>
                  
                  <button 
                    onClick={closeCobroModal}
                    className="mt-4 text-zinc-500 hover:text-white py-3 font-bold transition-colors"
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
