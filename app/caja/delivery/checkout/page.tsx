"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { crearPedido } from "@/acciones/pedidos";

export default function CajaDeliveryCheckoutPage() {
  const router = useRouter();
  const { carrito, limpiarCarrito } = useAppStore();
  
  const [notas, setNotas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Si no hay carrito, volver atrás
  useEffect(() => {
    if (carrito.length === 0) {
      router.replace("/caja/delivery");
    }
  }, [carrito, router]);

  if (carrito.length === 0) {
    return null; 
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.producto.precio * item.cantidad, 0);
  };

  const isSubmittingRef = useRef(false);

  const handleConfirmar = async () => {
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      mesa_id: null,
      mesa_numero: "DELIVERY",
      mozo_id: "", // Para que el RPC lo convierta en NULL y evite error de Foreign Key
      mozo_nombre: "Cajero",
      tipo_pedido: "delivery",
      total: calcularTotal(),
      notas_generales: notas,
      items: carrito.map((item) => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio,
        notas: item.notas,
      })),
    };

    const resultado = await crearPedido(payload);

    if (resultado.success) {
      setOrderSuccess(true);
      setTimeout(() => {
        router.push("/caja/dashboard");
      }, 2000);
    } else {
      setErrorMsg(resultado.error || "Ocurrió un error al enviar el pedido.");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <div className="bg-emerald-900/20 p-6 rounded-full mb-6">
          <CheckCircle2 size={80} className="text-emerald-500 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-100 text-center mb-2">¡Delivery Enviado!</h1>
        <p className="text-zinc-400 text-center">La cocina ya lo está preparando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header Fijo */}
      <header className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-2xl text-zinc-100">Revisión de Delivery</h1>
      </header>

      <div className="flex-1 space-y-6 max-w-3xl mx-auto w-full">
        {/* Info principal */}
        <section className="bg-indigo-900/20 border border-indigo-800/50 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-indigo-400 font-bold uppercase tracking-wider text-sm">Tipo de Pedido</span>
            <div className="font-bold text-2xl text-zinc-100 mt-1 flex items-center gap-2">
              <span>🛵</span> Plataforma Externa / Delivery
            </div>
          </div>
        </section>

        {/* Resumen del Carrito */}
        <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="font-semibold text-zinc-300 border-b border-zinc-800 pb-3 mb-4">Detalle del Pedido</h2>
          <div className="space-y-4">
            {carrito.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-zinc-100 text-lg">
                    <span className="text-emerald-500 mr-2">{item.cantidad}x</span>
                    {item.producto.nombre}
                  </div>
                  {item.notas && <div className="text-sm text-zinc-500 mt-1">Nota: {item.notas}</div>}
                </div>
                <div className="font-medium text-lg text-zinc-300">
                  ${(item.producto.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800 text-xl">
            <span className="font-bold text-zinc-100">Total Final</span>
            <span className="font-bold text-emerald-400">${calcularTotal().toFixed(2)}</span>
          </div>
        </section>

        {/* Notas Adicionales */}
        <section className="pb-10">
          <label className="block text-sm font-medium text-zinc-400 mb-2">Notas generales (Nombre de cliente, Repartidor, etc.)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ej. PedidosYa - Cliente: Juan Perez..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px] resize-none disabled:opacity-50"
          />
        </section>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-900 text-red-400 rounded-xl mb-6">
            <AlertCircle size={24} className="shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Bottom Action */}
        <button 
          onClick={handleConfirmar}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-5 rounded-2xl font-bold text-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-70 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={28} />
              Enviando a Cocina...
            </>
          ) : (
            <>
              <CheckCircle2 size={28} />
              Confirmar Delivery e Imprimir
            </>
          )}
        </button>
      </div>
    </div>
  );
}
