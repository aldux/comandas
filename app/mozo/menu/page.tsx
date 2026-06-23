"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, Producto } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";

export default function MenuPage() {
  const router = useRouter();
  const { mozoActivo, mesaActiva, carrito, agregarAlCarrito, quitarDelCarrito } = useAppStore();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay sesión, volver al login
    if (!mozoActivo || !mesaActiva) {
      router.push("/mozo/login");
      return;
    }

    fetchProductos();
  }, [mozoActivo, mesaActiva, router]);

  const fetchProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('nombre');

    if (!error && data) {
      setProductos(data as Producto[]);
      // Extraer categorías únicas
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
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col bg-surface-base text-zinc-50 pb-32">
      {/* Header Fijo */}
      <header className="sticky top-0 z-20 bg-surface-base/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/mozo/mesas")}
            className="p-2 -ml-2 rounded-xl bg-surface-card border border-zinc-800 hover:bg-surface-hover transition-colors active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-xl leading-tight text-white">Mesa {mesaActiva?.numero}</h1>
            <p className="text-xs text-brand font-medium uppercase tracking-wider">{mozoActivo?.nombre}</p>
          </div>
        </div>
      </header>

      {/* Tabs de Categorías */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-zinc-800/50 p-3 gap-2 sticky top-[73px] z-10 bg-surface-base/80 backdrop-blur-xl">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`
              flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95
              ${categoriaActiva === cat 
                ? "bg-brand text-white shadow-neon" 
                : "bg-surface-card border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Productos */}
      <div className="flex-1 p-4 space-y-3">
        {productosFiltrados.length === 0 ? (
          <p className="text-center text-zinc-500 mt-10 font-medium">No hay productos en esta categoría.</p>
        ) : (
          productosFiltrados.map((producto) => {
            const cantidad = getCantidadEnCarrito(producto.id);
            const isSelected = cantidad > 0;
            
            return (
              <div 
                key={producto.id}
                className={`flex items-center justify-between p-4 rounded-[1.5rem] border transition-all duration-200
                  ${isSelected ? 'bg-brand/5 border-brand/30 shadow-neon' : 'bg-surface-card border-zinc-800'}
                `}
              >
                <div className="flex-1 pr-4">
                  <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>{producto.nombre}</h3>
                  <p className="text-zinc-400 font-medium mt-0.5">${producto.precio.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-surface-base rounded-2xl p-1.5 border border-zinc-800/50 shadow-inner">
                  <button
                    onClick={() => quitarDelCarrito(producto.id)}
                    disabled={cantidad === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-card border border-zinc-800 text-zinc-300 active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all"
                  >
                    <Minus size={18} />
                  </button>
                  
                  <span className={`w-4 text-center font-black text-lg ${isSelected ? 'text-brand' : 'text-zinc-500'}`}>
                    {cantidad > 0 ? cantidad : ""}
                  </span>
                  
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand hover:bg-brand-light text-white active:scale-95 transition-all shadow-md"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-surface-base via-surface-base to-transparent z-30 pointer-events-none">
          <div className="pointer-events-auto bg-surface-card/90 backdrop-blur-lg rounded-[2rem] p-4 shadow-glass border border-zinc-800/80 flex items-center justify-between mb-2">
            <div className="flex flex-col pl-2">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Pedido</span>
              <span className="text-2xl font-black text-white">${calcularTotal().toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => router.push("/mozo/checkout")}
              className="flex items-center gap-2 bg-brand hover:bg-brand-light active:scale-[0.98] text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-neon"
            >
              <ShoppingCart size={20} />
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{totalItems}</span>
              Ver Pedido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
