"use server";

import { supabase } from "@/lib/supabase";

interface PedidoPayload {
  mesa_id: string;
  mesa_numero: number;
  mozo_id: string;
  mozo_nombre: string;
  total: number;
  notas_generales: string;
  items: Array<{
    producto_id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    notas: string;
  }>;
}

export async function crearPedido(payload: PedidoPayload) {
  try {
    // Usamos el RPC transaccional que agrupa la creación del pedido, 
    // sus ítems y la cola de impresión en una única transacción atómica en Postgres.
    const { data: pedidoId, error } = await supabase.rpc(
      "crear_pedido_completo",
      { payload }
    );

    if (error || !pedidoId) {
      console.error("Error en RPC crear_pedido_completo:", error);
      return { success: false, error: "Error al crear el pedido en la base de datos." };
    }

    return { success: true, pedido_id: pedidoId };
  } catch (error: any) {
    console.error("Error inesperado en crearPedido:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}
