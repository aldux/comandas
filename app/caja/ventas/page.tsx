"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { imprimirCierreCaja } from "@/acciones/reportes";
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  Receipt, 
  Printer, 
  Download, 
  Loader2 
} from "lucide-react";

interface Empleado {
  nombre: string;
}

interface Mesa {
  numero: number;
}

interface Venta {
  id: string;
  total: number;
  metodo_pago: string;
  created_at: string;
  empleados?: Empleado | null;
  mesas?: Mesa | null;
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [imprimiendo, setImprimiendo] = useState(false);

  // Metricas
  const [totales, setTotales] = useState({
    bruto: 0,
    efectivo: 0,
    tpv: 0,
    bizum: 0,
    app_delivery: 0,
    cantidad: 0
  });

  useEffect(() => {
    fetchVentasHoy();
  }, []);

  const fetchVentasHoy = async () => {
    setLoading(true);
    
    // Obtener inicio y fin del día actual (local)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioDia = hoy.toISOString();
    
    hoy.setHours(23, 59, 59, 999);
    const finDia = hoy.toISOString();

    const { data, error } = await supabase
      .from('pedidos')
      .select('id, total, metodo_pago, created_at, empleados(nombre), mesas(numero)')
      .in('estado', ['cobrado', 'finalizado'])
      .gte('created_at', inicioDia)
      .lte('created_at', finDia)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error obteniendo ventas:", error);
    } else if (data) {
      setVentas(data as any[]);
      
      // Calcular métricas
      let bruto = 0;
      let efectivo = 0;
      let tpv = 0;
      let bizum = 0;
      let appDelivery = 0;

      data.forEach(v => {
        bruto += Number(v.total);
        if (v.metodo_pago === 'efectivo') efectivo += Number(v.total);
        if (v.metodo_pago === 'tarjeta_tpv') tpv += Number(v.total);
        if (v.metodo_pago === 'bizum') bizum += Number(v.total);
        if (v.metodo_pago === 'app_delivery') appDelivery += Number(v.total);
      });

      setTotales({
        bruto,
        efectivo,
        tpv,
        bizum,
        app_delivery: appDelivery,
        cantidad: data.length
      });
    }
    
    setLoading(false);
  };

  const handleImprimirCierre = async () => {
    setImprimiendo(true);
    
    const fechaStr = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });

    const res = await imprimirCierreCaja(
      fechaStr,
      totales.bruto,
      totales.efectivo,
      totales.tpv,
      totales.bizum,
      totales.cantidad
    );

    if (res.success) {
      alert("Cierre de caja enviado a la impresora.");
    } else {
      alert("Error al enviar el cierre: " + res.error);
    }
    
    setImprimiendo(false);
  };

  const handleExportarCSV = () => {
    if (ventas.length === 0) {
      alert("No hay ventas para exportar.");
      return;
    }

    // Cabeceras del CSV
    let csvContent = "Fecha,Hora,Mesa,Mozo,Metodo_Pago,Total\n";

    ventas.forEach(venta => {
      const fecha = new Date(venta.created_at);
      const fString = fecha.toLocaleDateString('es-ES');
      const hString = fecha.toLocaleTimeString('es-ES');
      const mesa = venta.mesas?.numero || 'Barra';
      const mozo = venta.empleados?.nombre || 'N/A';
      const pago = venta.metodo_pago || 'N/A';
      const total = venta.total.toFixed(2);

      csvContent += `${fString},${hString},${mesa},${mozo},${pago},${total}\n`;
    });

    // Crear Blob y enlace de descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const fileName = `ventas_cierre_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Resumen de Ventas Diarias</h1>
          <p className="text-zinc-400 text-sm">Hoy: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportarCSV}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-100 px-4 py-2.5 rounded-lg font-medium transition-all border border-zinc-700"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          
          <button 
            onClick={handleImprimirCierre}
            disabled={imprimiendo || ventas.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg disabled:opacity-50"
          >
            {imprimiendo ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
            Imprimir Cierre
          </button>
        </div>
      </header>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bruto */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="font-medium text-sm uppercase tracking-wider">Total Facturado</span>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-zinc-100">€{totales.bruto.toFixed(2)}</p>
          <p className="text-xs text-zinc-500 mt-auto">{totales.cantidad} tickets emitidos</p>
        </div>

        {/* Efectivo */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="font-medium text-sm uppercase tracking-wider">Efectivo</span>
            <Banknote size={20} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-100">€{totales.efectivo.toFixed(2)}</p>
        </div>

        {/* TPV */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="font-medium text-sm uppercase tracking-wider">Tarjeta (TPV)</span>
            <CreditCard size={20} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-100">€{totales.tpv.toFixed(2)}</p>
        </div>

        {/* Bizum */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="font-medium text-sm uppercase tracking-wider">Bizum</span>
            <Smartphone size={20} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-100">€{totales.bizum.toFixed(2)}</p>
        </div>

        {/* Apps Delivery */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="font-medium text-sm uppercase tracking-wider">Apps Delivery</span>
            <span className="text-2xl">🛵</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">€{(totales.app_delivery || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Historial de Tickets */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col flex-1">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
          <Receipt size={20} className="text-zinc-400" />
          <h3 className="font-bold text-zinc-100">Historial del Día</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-400 text-sm border-b border-zinc-800">
                <th className="p-4 font-medium">Hora</th>
                <th className="p-4 font-medium">Ticket #</th>
                <th className="p-4 font-medium">Mesa</th>
                <th className="p-4 font-medium">Mozo</th>
                <th className="p-4 font-medium">Método</th>
                <th className="p-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                    Aún no hay ventas registradas el día de hoy.
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => (
                  <tr key={venta.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 text-zinc-300">
                      {new Date(venta.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="p-4 text-zinc-500">{venta.id.split('-')[0].toUpperCase()}</td>
                    <td className="p-4 font-medium">{venta.mesas?.numero || 'Barra'}</td>
                    <td className="p-4 text-zinc-300">{venta.empleados?.nombre || 'Desconocido'}</td>
                    <td className="p-4 capitalize text-emerald-400">{venta.metodo_pago?.replace('_', ' ')}</td>
                    <td className="p-4 font-bold text-right text-zinc-100">€{venta.total.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
