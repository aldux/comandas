"use client";

import { useEffect, useState } from "react";
import { 
  obtenerImpresoras, 
  agregarImpresora, 
  eliminarImpresora, 
  toggleImpresora, 
  Impresora 
} from "@/acciones/impresoras";
import { Trash2, Plus, Printer as PrinterIcon, Wifi, Usb, Loader2 } from "lucide-react";

export default function ImpresorasPage() {
  const [impresoras, setImpresoras] = useState<Impresora[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"red" | "usb">("red");
  const [valor, setValor] = useState("");

  const cargarImpresoras = async () => {
    setLoading(true);
    const res = await obtenerImpresoras();
    if (res.success && res.data) {
      setImpresoras(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarImpresoras();
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !valor.trim()) return;
    
    setIsSubmitting(true);
    
    // Concatenar el prefijo correcto
    const interfazStr = tipo === "red" ? `tcp://${valor.trim()}` : `printer:${valor.trim()}`;
    
    const res = await agregarImpresora(nombre.trim(), interfazStr);
    
    if (res.success) {
      setNombre("");
      setValor("");
      await cargarImpresoras();
    } else {
      alert("Error al agregar la impresora: " + res.error);
    }
    
    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, estadoActual: boolean) => {
    const res = await toggleImpresora(id, !estadoActual);
    if (res.success) {
      setImpresoras(impresoras.map(i => i.id === id ? { ...i, activa: !estadoActual } : i));
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta impresora?")) return;
    const res = await eliminarImpresora(id);
    if (res.success) {
      setImpresoras(impresoras.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
          <PrinterIcon className="text-emerald-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Impresoras</h1>
          <p className="text-sm text-zinc-400">Configura las impresoras térmicas para las comandas</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulario Agregar */}
        <div className="md:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Nueva Impresora</h2>
            <form onSubmit={handleAgregar} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nombre (Ej: Cocina)</label>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Cocina Principal"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tipo de Conexión</label>
                <select 
                  value={tipo}
                  onChange={e => setTipo(e.target.value as "red" | "usb")}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="red">Red (LAN / Wi-Fi)</option>
                  <option value="usb">USB (Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  {tipo === "red" ? "Dirección IP" : "Nombre de Impresora (Windows)"}
                </label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500">
                  <span className="text-zinc-500 text-sm select-none">
                    {tipo === "red" ? "tcp://" : "printer:"}
                  </span>
                  <input 
                    type="text" 
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    placeholder={tipo === "red" ? "192.168.1.100" : "POS-58"}
                    className="w-full bg-transparent p-3 pl-1 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Agregar Impresora
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Impresoras */}
        <div className="md:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="font-semibold">Impresoras Registradas</h2>
            </div>
            
            {loading ? (
              <div className="p-8 flex justify-center text-zinc-500">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : impresoras.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                No hay impresoras configuradas.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {impresoras.map((imp) => {
                  const isRed = imp.interfaz.startsWith('tcp://');
                  return (
                    <li key={imp.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${imp.activa ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          {isRed ? <Wifi size={20} /> : <Usb size={20} />}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100 flex items-center gap-2">
                            {imp.nombre}
                            {!imp.activa && <span className="text-[10px] uppercase bg-red-950 text-red-500 px-2 py-0.5 rounded-full">Inactiva</span>}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono mt-0.5">{imp.interfaz}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggle(imp.id, imp.activa)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            imp.activa 
                              ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' 
                              : 'border-emerald-900 text-emerald-500 hover:bg-emerald-950'
                          }`}
                        >
                          {imp.activa ? 'Desactivar' : 'Activar'}
                        </button>
                        <button 
                          onClick={() => handleEliminar(imp.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
