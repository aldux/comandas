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
    // 1. Insertar el pedido
    const { data: pedidoData, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        mesa_id: payload.mesa_id,
        mozo_id: payload.mozo_id,
        estado: "preparando",
        total: payload.total,
      })
      .select("id")
      .single();

    if (pedidoError || !pedidoData) {
      console.error("Error insertando pedido:", pedidoError);
      return { success: false, error: "Error al crear el pedido principal" };
    }

    const pedidoId = pedidoData.id;

    // 2. Preparar los items e insertarlos
    const itemsParaInsertar = payload.items.map((item) => ({
      pedido_id: pedidoId,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      notas: item.notas || null,
    }));

    const { error: itemsError } = await supabase
      .from("pedido_items")
      .insert(itemsParaInsertar);

    if (itemsError) {
      console.error("Error insertando items:", itemsError);
      return { success: false, error: "Error al guardar los items del pedido" };
    }

    // 3. Generación del Ticket de Impresión
    let ticketTexto = `--- NUEVO PEDIDO ---\n`;
    ticketTexto += `MESA: ${payload.mesa_numero} | MOZO: ${payload.mozo_nombre}\n`;
    ticketTexto += `--------------------\n`;
    
    payload.items.forEach((item) => {
      ticketTexto += `${item.cantidad}x ${item.nombre} ($${item.precio_unitario})\n`;
      if (item.notas) {
        ticketTexto += `   *Nota: ${item.notas}*\n`;
      }
    });
    
    ticketTexto += `--------------------\n`;
    if (payload.notas_generales) {
      ticketTexto += `NOTAS GENERALES:\n${payload.notas_generales}\n`;
      ticketTexto += `--------------------\n`;
    }
    ticketTexto += `TOTAL: $${payload.total.toFixed(2)}\n`;

    // Insertar en cola de impresión
    const { error: impresionError } = await supabase
      .from("cola_impresion")
      .insert({
        pedido_id: pedidoId,
        ticket_texto: ticketTexto,
        estado: "pendiente",
      });

    if (impresionError) {
      console.error("Error en cola de impresión:", impresionError);
      // No rompemos todo el pedido si solo falla la impresión, pero podríamos loguearlo.
    }

    return { success: true, pedido_id: pedidoId };
  } catch (error: any) {
    console.error("Error inesperado en crearPedido:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}
