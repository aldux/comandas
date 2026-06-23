"use server";

import { supabase } from "@/lib/supabase";

export async function validarPinMozo(pin: string) {
  try {
    // Buscar empleado con ese PIN exacto
    const { data, error } = await supabase
      .from("empleados")
      .select("id, nombre, rol, activo")
      .eq("pin", pin)
      .eq("rol", "mozo")
      .eq("activo", true)
      .single();

    if (error || !data) {
      return { success: false, error: "PIN incorrecto o empleado inactivo." };
    }

    return { 
      success: true, 
      mozo: {
        id: data.id,
        nombre: data.nombre
      } 
    };
  } catch (err: any) {
    return { success: false, error: "Error de conexión." };
  }
}
