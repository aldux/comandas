"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { crearPedido } from "@/acciones/pedidos";

export default function CheckoutPage() {
  const router = useRouter();
  const { mozoActivo, mesaActiva, carrito, limpiarCarrito, setMozo, setMesa } = useAppStore();
  
  const [notas, setNotas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Si no hay carrito, mesa o mozo, volver atrás
  useEffect(() => {
    if (!mozoActivo || !mesaActiva || carrito.length === 0) {
      router.replace("/mozo/mesas");
    }
  }, [mozoActivo, mesaActiva, carrito, router]);

  if (!mozoActivo || !mesaActiva || carrito.length === 0) {
    return null; // Evitar renderizado mientras redirige
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
      mesa_id: mesaActiva.id,
      mesa_numero: mesaActiva.numero,
      mozo_id: mozoActivo.id,
      mozo_nombre: mozoActivo.nombre,
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
      // Éxito: Limpiamos todo el estado para liberar el dispositivo
      limpiarCarrito();
      setMesa(null);
      setMozo(null);
      
      // Redirigir al login
      router.push("/mozo/login");
    } else {
      setErrorMsg(resultado.error || "Ocurrió un error al enviar el pedido.");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col bg-zinc-950 text-zinc-50 pb-32">
      {/* Header Fijo */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg leading-tight">Revisión del Pedido</h1>
      </header>

      <div className="flex-1 p-4 space-y-6">
        {/* Info principal */}
        <section className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400">Mesa</span>
            <span className="font-bold text-xl">{mesaActiva.numero}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Mozo</span>
            <span className="font-medium">{mozoActivo.nombre}</span>
          </div>
        </section>

        {/* Resumen del Carrito */}
        <section className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <h2 className="font-semibold text-zinc-300 border-b border-zinc-800 pb-2 mb-3">Detalle</h2>
          <div className="space-y-3">
            {carrito.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-zinc-100">
                    <span className="text-emerald-500 mr-2">{item.cantidad}x</span>
                    {item.producto.nombre}
                  </div>
                  {item.notas && <div className="text-xs text-zinc-500 mt-0.5">{item.notas}</div>}
                </div>
                <div className="font-medium">
                  ${(item.producto.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-800 text-lg">
            <span className="font-bold">Total Final</span>
            <span className="font-bold text-emerald-400">${calcularTotal().toFixed(2)}</span>
          </div>
        </section>

        {/* Notas Adicionales */}
        <section>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Notas generales del pedido</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ej. Mandar rápido, cliente apurado..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none disabled:opacity-50"
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-20">
        <button 
          onClick={handleConfirmar}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-70 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Enviando a Cocina...
            </>
          ) : (
            <>
              <CheckCircle2 size={24} />
              Confirmar y Enviar a Cocina
            </>
          )}
        </button>
      </div>
    </main>
  );
}
