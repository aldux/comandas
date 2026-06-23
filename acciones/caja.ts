"use server";

import { supabase } from "@/lib/supabase";

export async function cobrarPedido(pedidoId: string, mesaId: string, metodoPago: "efectivo" | "tarjeta_tpv" | "bizum") {
  try {
    // 1. Actualizar el pedido
    const { error: pedidoError } = await supabase
      .from("pedidos")
      .update({
        estado: "cobrado",
        metodo_pago: metodoPago,
      })
      .eq("id", pedidoId);

    if (pedidoError) {
      console.error("Error al cobrar pedido:", pedidoError);
      return { success: false, error: "Error al actualizar el estado del pedido" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado en cobrarPedido:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}


export async function anularPedido(pedidoId: string, mesaId: string) {
  try {
    const { error: pedidoError } = await supabase.from('pedidos').update({ estado: 'anulado' }).eq('id', pedidoId);
    if (pedidoError) return { success: false, error: 'Error al anular pedido' };

    const { error: mesaError } = await supabase.from('mesas').update({ estado: 'libre' }).eq('id', mesaId);
    if (mesaError) return { success: false, error: 'Error al liberar mesa' };

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function marcarListo(pedidoId: string) {
  try {
    const { error } = await supabase.from('pedidos').update({ estado: 'listo' }).eq('id', pedidoId);
    if (error) return { success: false, error: 'Error al actualizar estado' };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function liberarMesa(pedidoId: string, mesaId: string) {
  try {
    // 1. Cambiar estado del pedido a finalizado (para que desaparezca del dashboard activo)
    const { error: pedidoError } = await supabase.from('pedidos').update({ estado: 'finalizado' }).eq('id', pedidoId);
    if (pedidoError) return { success: false, error: 'Error al finalizar pedido' };

    // 2. Liberar la mesa
    const { error: mesaError } = await supabase.from('mesas').update({ estado: 'libre' }).eq('id', mesaId);
    if (mesaError) return { success: false, error: 'Error al liberar mesa' };

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function entregarDelivery(pedidoId: string) {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado: 'finalizado',
        metodo_pago: 'app_delivery'
      })
      .eq('id', pedidoId);

    if (error) return { success: false, error: 'Error al entregar delivery' };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archivarVentasDia() {
  try {
    // Archivar todos los pedidos que estén cobrados o finalizados
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'archivado' })
      .in('estado', ['cobrado', 'finalizado']);

    if (error) {
      console.error("Error al archivar ventas:", error);
      return { success: false, error: 'Error al archivar el historial' };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
