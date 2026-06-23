"use server";

import { supabase } from "@/lib/supabase";

export async function imprimirCierreCaja(
  fecha: string,
  totalVentas: number,
  efectivo: number,
  tpv: number,
  bizum: number,
  cantidadTickets: number
) {
  try {
    let ticketTexto = `--- CIERRE DE CAJA ---\n`;
    ticketTexto += `FECHA: ${fecha}\n`;
    ticketTexto += `TOTAL VENTAS: €${totalVentas.toFixed(2)}\n`;
    ticketTexto += `----------------------\n`;
    ticketTexto += `EFECTIVO: €${efectivo.toFixed(2)}\n`;
    ticketTexto += `TPV: €${tpv.toFixed(2)}\n`;
    ticketTexto += `BIZUM: €${bizum.toFixed(2)}\n`;
    ticketTexto += `----------------------\n`;
    ticketTexto += `TICKETS EMITIDOS: ${cantidadTickets}\n`;

    const { error } = await supabase
      .from("cola_impresion")
      .insert({
        ticket_texto: ticketTexto,
        estado: "pendiente",
      });

    if (error) {
      console.error("Error al enviar cierre a impresión:", error);
      return { success: false, error: "No se pudo encolar la impresión" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado en imprimirCierreCaja:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}
