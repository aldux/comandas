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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col bg-zinc-950 text-zinc-50 pb-32">
      {/* Header Fijo */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/mozo/mesas")}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Mesa {mesaActiva?.numero}</h1>
            <p className="text-xs text-zinc-400">Mozo: {mozoActivo?.nombre}</p>
          </div>
        </div>
      </header>

      {/* Tabs de Categorías */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-zinc-800 p-2 gap-2 sticky top-[60px] z-10 bg-zinc-950/90 backdrop-blur-md">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`
              flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors
              ${categoriaActiva === cat 
                ? "bg-emerald-600 text-white" 
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Productos */}
      <div className="flex-1 p-4 space-y-4">
        {productosFiltrados.length === 0 ? (
          <p className="text-center text-zinc-500 mt-10">No hay productos activos en esta categoría.</p>
        ) : (
          productosFiltrados.map((producto) => {
            const cantidad = getCantidadEnCarrito(producto.id);
            
            return (
              <div 
                key={producto.id}
                className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800/50"
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-semibold text-zinc-100">{producto.nombre}</h3>
                  <p className="text-emerald-500 font-medium mt-1">€{producto.precio.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-zinc-950 rounded-full p-1 border border-zinc-800">
                  <button
                    onClick={() => quitarDelCarrito(producto.id)}
                    disabled={cantidad === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-300 active:bg-zinc-700 disabled:opacity-30 transition-all"
                  >
                    <Minus size={20} />
                  </button>
                  
                  <span className="w-6 text-center font-bold text-lg">
                    {cantidad > 0 ? cantidad : ""}
                  </span>
                  
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-600 text-white active:bg-emerald-500 transition-all shadow-md"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-20">
          <div className="bg-zinc-800 rounded-2xl p-4 shadow-2xl border border-zinc-700 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-zinc-400 text-sm">Total ({totalItems} items)</span>
              <span className="text-2xl font-bold text-emerald-400">€{calcularTotal().toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => router.push("/mozo/checkout")}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              <ShoppingCart size={20} />
              Revisar y Enviar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
