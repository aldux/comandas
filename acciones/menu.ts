"use server";

import { supabase } from "@/lib/supabase";

export async function upsertProducto(id: string | null, nombre: string, categoria: string, precio: number) {
  try {
    const payload = {
      nombre,
      categoria,
      precio,
      activo: true
    };

    let result;

    if (id) {
      // Edit
      result = await supabase.from('productos').update(payload).eq('id', id);
    } else {
      // Insert
      result = await supabase.from('productos').insert(payload);
    }

    if (result.error) {
      console.error("Error upserting producto:", result.error);
      return { success: false, error: "No se pudo guardar el producto" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleProductoActivo(id: string, activo: boolean) {
  try {
    const { error } = await supabase.from('productos').update({ activo }).eq('id', id);
    
    if (error) {
      console.error("Error toggling producto:", error);
      return { success: false, error: "No se pudo cambiar el estado del producto" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
