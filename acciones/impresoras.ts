"use server";

import { createClient } from "@/utils/supabase/server";

export interface Impresora {
  id: string;
  nombre: string;
  interfaz: string;
  activa: boolean;
  created_at?: string;
}

export async function obtenerImpresoras() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("impresoras")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data as Impresora[] };
  } catch (error: any) {
    console.error("Error al obtener impresoras:", error);
    return { success: false, error: error.message };
  }
}

export async function agregarImpresora(nombre: string, interfaz: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("impresoras")
      .insert({ nombre, interfaz, activa: true })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error al agregar impresora:", error);
    return { success: false, error: error.message };
  }
}

export async function eliminarImpresora(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("impresoras")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar impresora:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleImpresora(id: string, activa: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("impresoras")
      .update({ activa })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error al cambiar estado de impresora:", error);
    return { success: false, error: error.message };
  }
}
