"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, Producto } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";

export default function CajaDeliveryMenuPage() {
  const router = useRouter();
  const { carrito, agregarAlCarrito, quitarDelCarrito, limpiarCarrito } = useAppStore();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al entrar a la ruta de delivery, limpiamos el carrito por si quedó algo colgado
    limpiarCarrito();
    fetchProductos();
  }, [limpiarCarrito]);

  const fetchProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('nombre');

    if (!error && data) {
      setProductos(data as Producto[]);
      const cats = Array.from(new Set(data.map(p => p.categoria)));
      setCategorias(cats);
      if (cats.length > 0) setCategoriaActiva(cats[0]);
    }
    setLoading(false);
  };

  const productosFiltrados = productos.filter((p) => p.categoria === categoriaActiva);

  const getCantidadEnCarrito = (productoId: string) => {
    return carrito
      .filter((item) => item.producto.id === productoId)
      .reduce((total, item) => total + item.cantidad, 0);
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.producto.precio * item.cantidad, 0);
  };

  const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.push("/caja/dashboard")}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <span>🛵</span> Nuevo Pedido Delivery
          </h1>
          <p className="text-zinc-400 text-sm">Seleccione los productos para el pedido externo</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Side: Menú */}
        <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Tabs de Categorías */}
          <div className="flex overflow-x-auto hide-scrollbar border-b border-zinc-800 p-2 gap-2 bg-zinc-950/50">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`
                  flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors
                  ${categoriaActiva === cat 
                    ? "bg-emerald-600 text-white" 
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de Productos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {productosFiltrados.length === 0 ? (
              <p className="text-center text-zinc-500 mt-10">No hay productos en esta categoría.</p>
            ) : (
              productosFiltrados.map((producto) => {
                const cantidad = getCantidadEnCarrito(producto.id);
                return (
                  <div 
                    key={producto.id}
                    className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold text-zinc-100">{producto.nombre}</h3>
                      <p className="text-emerald-500 font-medium mt-1">${producto.precio.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-zinc-900 rounded-full p-1 border border-zinc-800">
                      <button
                        onClick={() => quitarDelCarrito(producto.id)}
                        disabled={cantidad === 0}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-300 active:bg-zinc-700 disabled:opacity-30 transition-all"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="w-6 text-center font-bold text-lg">{cantidad > 0 ? cantidad : ""}</span>
                      <button
                        onClick={() => agregarAlCarrito(producto)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-600 text-white active:bg-emerald-500 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Resumen Ráápido */}
        <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-4">
            <ShoppingCart size={20} className="text-emerald-500" />
            Resumen ({totalItems})
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm italic opacity-50">
                <ShoppingCart size={48} className="mb-2" />
                <p>El carrito está vacío</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.producto.id} className="flex justify-between items-start text-sm border-b border-zinc-800 pb-2">
                  <div className="flex gap-2">
                    <span className="font-bold text-emerald-400">{item.cantidad}x</span>
                    <span className="text-zinc-300">{item.producto.nombre}</span>
                  </div>
                  <span className="font-medium text-zinc-400">${(item.producto.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-end mb-4">
              <span className="text-zinc-400">Total</span>
              <span className="text-2xl font-bold text-emerald-400">${calcularTotal().toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => router.push("/caja/delivery/checkout")}
              disabled={totalItems === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Continuar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
