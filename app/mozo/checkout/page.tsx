"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/orderStore";
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { crearPedido } from "@/acciones/pedidos";

export default function CheckoutPage() {
  const router = useRouter();
  const { mozoActivo, mesaActiva, setMozo, setMesa } = useAppStore();
  const cart = useOrderStore(state => state.cart);
  const clearCart = useOrderStore(state => state.clearCart);
  
  const [notas, setNotas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Si no hay carrito, mesa o mozo y no estamos en la pantalla de éxito, volver atrás
  useEffect(() => {
    if (!orderSuccess && (!mozoActivo || !mesaActiva || cart.length === 0)) {
      router.replace("/mozo/mesas");
    }
  }, [mozoActivo, mesaActiva, cart, orderSuccess, router]);

  if (!orderSuccess && (!mozoActivo || !mesaActiva || cart.length === 0)) {
    return null; // Evitar renderizado mientras redirige
  }

  const calcularTotal = () => {
    return cart.reduce((total, item) => total + item.precioTotal, 0);
  };

  const isSubmittingRef = useRef(false);

  const handleConfirmar = async () => {
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg("");

    const formatSelecciones = (selecciones: any) => {
      const parts = [];
      if (selecciones.variante) parts.push(`Variante: ${selecciones.variante.nombre}`);
      if (selecciones.agregados.length > 0) parts.push(`Extra: ${selecciones.agregados.map((a: any) => a.nombre).join(', ')}`);
      if (selecciones.quitados.length > 0) parts.push(`Sin: ${selecciones.quitados.map((q: any) => q.nombre).join(', ')}`);
      return parts.join(' | ');
    };

    const payload = {
      mesa_id: mesaActiva.id,
      mesa_numero: mesaActiva.numero,
      mozo_id: mozoActivo.id,
      mozo_nombre: mozoActivo.nombre,
      total: calcularTotal(),
      notas_generales: notas,
      items: cart.map((item) => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        notas: formatSelecciones(item.selecciones),
      })),
    };

    const resultado = await crearPedido(payload);

    if (resultado.success) {
      // Éxito: Mostramos pantalla de confirmación y limpiamos carrito global
      setOrderSuccess(true);
      clearCart();
      
      setTimeout(() => {
        // Redirigimos sin mutar el estado global aquí para no pisar el useEffect
        router.push("/mozo/mesas");
      }, 2000);
    } else {
      setErrorMsg(resultado.error || "Ocurrió un error al enviar el pedido.");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (orderSuccess) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-surface-base text-zinc-50 p-6 animate-in fade-in duration-500">
        <div className="bg-emerald-500/10 p-8 rounded-full mb-8 relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
          <CheckCircle2 size={80} className="text-emerald-500 relative z-10 animate-bounce" />
        </div>
        <h1 className="text-4xl font-black text-center mb-3 tracking-tight">¡Enviado!</h1>
        <p className="text-zinc-400 text-center text-lg">La cocina ya lo está preparando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col bg-surface-base text-zinc-50 pb-32">
      {/* Header Fijo */}
      <header className="sticky top-0 z-20 bg-surface-base/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-4 flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="p-2 -ml-2 rounded-xl bg-surface-card border border-zinc-800 hover:bg-surface-hover transition-colors disabled:opacity-50 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl leading-tight">Revisión Final</h1>
      </header>

      <div className="flex-1 p-4 space-y-6">
        {/* Info principal */}
        <section className="bg-surface-card border border-zinc-800/50 p-5 rounded-[1.5rem] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Mesa</span>
            <span className="font-black text-2xl text-white">{mesaActiva.numero}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Atiende</span>
            <span className="font-semibold text-brand">{mozoActivo.nombre}</span>
          </div>
        </section>

        {/* Resumen del Carrito */}
        <section className="bg-surface-card border border-zinc-800/50 p-5 rounded-[1.5rem] shadow-sm">
          <h2 className="font-bold text-zinc-300 border-b border-zinc-800/50 pb-3 mb-4 uppercase tracking-widest text-xs">Detalle del Pedido</h2>
          <div className="space-y-4">
            {cart.map((item, idx) => {
              const formatSeleccionesDisplay = (selecciones: any) => {
                const parts = [];
                if (selecciones.variante) parts.push(`Variante: ${selecciones.variante.nombre}`);
                if (selecciones.agregados.length > 0) parts.push(`Extra: ${selecciones.agregados.map((a: any) => a.nombre).join(', ')}`);
                if (selecciones.quitados.length > 0) parts.push(`Sin: ${selecciones.quitados.map((q: any) => q.nombre).join(', ')}`);
                return parts.join(' | ');
              };
              const notasItem = formatSeleccionesDisplay(item.selecciones);
              return (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <div className="font-semibold text-zinc-100 flex gap-2">
                      <span className="text-brand font-black">{item.cantidad}x</span>
                      {item.producto.nombre}
                    </div>
                    {notasItem && <div className="text-xs text-zinc-400 mt-1 pl-6">↳ {notasItem}</div>}
                  </div>
                  <div className="font-bold text-zinc-300">
                    ${item.precioTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-zinc-800/50">
            <span className="font-bold uppercase tracking-widest text-xs text-zinc-500">Total a Pagar</span>
            <span className="font-black text-2xl text-white">${calcularTotal().toFixed(2)}</span>
          </div>
        </section>

        {/* Notas Adicionales */}
        <section>
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 pl-1">Notas para la cocina</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ej. Mandar rápido, cliente apurado..."
            className="w-full bg-surface-card border border-zinc-800/50 rounded-[1.5rem] p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 min-h-[120px] resize-none disabled:opacity-50 transition-all shadow-inner"
          />
        </section>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-900 text-red-400 rounded-xl">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-surface-base via-surface-base to-transparent z-20">
        <button 
          onClick={handleConfirmar}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 bg-brand hover:bg-brand-light active:scale-[0.98] text-white p-5 rounded-[1.5rem] font-bold text-lg transition-all shadow-neon disabled:opacity-70 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Enviando a Cocina...
            </>
          ) : (
            <>
              Confirmar y Enviar a Cocina
              <ArrowLeft size={24} className="rotate-180" />
            </>
          )}
        </button>
      </div>
    </main>
  );
}
