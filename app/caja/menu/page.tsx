"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { upsertProducto, toggleProductoActivo } from "@/acciones/menu";
import { Plus, Edit2, Loader2, Power, CheckCircle2 } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  activo: boolean;
}

export default function CajaMenu() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Producto>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchProductos();

    const channel = supabase
      .channel('productos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        fetchProductos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('categoria', { ascending: true })
      .order('nombre', { ascending: true });

    if (!error && data) {
      setProductos(data as Producto[]);
    }
    setLoading(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const handleOpenModal = (prod?: Producto) => {
    if (prod) {
      setCurrentProduct(prod);
    } else {
      setCurrentProduct({ nombre: "", categoria: "Hamburguesas", precio: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.nombre || !currentProduct.categoria || currentProduct.precio === undefined) return;

    setIsSaving(true);
    const res = await upsertProducto(
      currentProduct.id || null, 
      currentProduct.nombre, 
      currentProduct.categoria, 
      currentProduct.precio
    );

    setIsSaving(false);

    if (res.success) {
      showToast(currentProduct.id ? "Producto actualizado" : "Producto creado");
      setIsModalOpen(false);
    } else {
      alert(res.error);
    }
  };

  const handleToggleActivo = async (id: string, currentState: boolean) => {
    const res = await toggleProductoActivo(id, !currentState);
    if (res.success) {
      showToast(currentState ? "Producto pausado" : "Producto activado");
    } else {
      alert(res.error);
    }
  };

  if (loading && productos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 size={20} />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Gestión de Menú</h1>
          <p className="text-zinc-400 text-sm">Administra tu catálogo de productos</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </header>

      {/* Tabla de Productos */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col flex-1 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-400 text-sm border-b border-zinc-800">
                <th className="p-4 font-medium w-1/3">Nombre</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium">Precio</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {productos.map((prod) => (
                <tr key={prod.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${!prod.activo ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-medium text-zinc-100">{prod.nombre}</td>
                  <td className="p-4 text-zinc-400">
                    <span className="bg-zinc-800 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider">
                      {prod.categoria}
                    </span>
                  </td>
                  <td className="p-4 text-emerald-400 font-bold">€{prod.precio.toFixed(2)}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleActivo(prod.id, prod.activo)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        prod.activo 
                          ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' 
                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                      }`}
                    >
                      <Power size={14} />
                      {prod.activo ? 'ACTIVO' : 'PAUSADO'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleOpenModal(prod)}
                      className="p-2 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors inline-flex"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-100">
                {currentProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={currentProduct.nombre}
                  onChange={(e) => setCurrentProduct({...currentProduct, nombre: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ej. Hamburguesa Doble"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Categoría</label>
                <select
                  required
                  value={currentProduct.categoria}
                  onChange={(e) => setCurrentProduct({...currentProduct, categoria: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="Hamburguesas">Hamburguesas</option>
                  <option value="Papas">Papas</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Extras">Extras</option>
                  <option value="Postres">Postres</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Precio (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={currentProduct.precio || ''}
                  onChange={(e) => setCurrentProduct({...currentProduct, precio: parseFloat(e.target.value)})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-70 flex items-center justify-center"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
