import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

// Cargar variables de entorno locales
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan las variables de entorno SUPABASE_URL o la KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Base de configuración (sin interface que se llenará dinámicamente)
const basePrinterConfig = {
  type: PrinterTypes.EPSON,
  characterSet: CharacterSet.PC852_LATIN2,
  removeSpecialCharacters: false,
  lineCharacter: "=",
  breakLine: BreakLine.WORD,
  options: {
    timeout: 5000 // 5 segundos de timeout
  }
};

async function obtenerImpresorasActivas() {
  const { data, error } = await supabase
    .from('impresoras')
    .select('*')
    .eq('activa', true);

  if (error) {
    console.error("Error obteniendo impresoras activas:", error);
    return [];
  }
  return data || [];
}

async function imprimirTicket(id: string, texto: string, impresoraDB: any) {
  let printer = new ThermalPrinter({
    ...basePrinterConfig,
    interface: impresoraDB.interfaz,
  });

  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`La impresora '${impresoraDB.nombre}' (${impresoraDB.interfaz}) no está conectada o no responde.`);
    }

    console.log(`🖨️  Imprimiendo ticket ID: ${id} en '${impresoraDB.nombre}'...`);
    
    printer.alignCenter();
    printer.bold(true);
    printer.println("MADRE MIA BURGERS");
    printer.bold(false);
    printer.drawLine();
    
    printer.alignLeft();
    printer.print(texto);
    
    printer.drawLine();
    printer.cut();

    await printer.execute();
    console.log(`✅ Ticket ${id} impreso con éxito en '${impresoraDB.nombre}'.`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error al imprimir ticket ${id} en '${impresoraDB.nombre}':`, error.message);
    return false;
  }
}

async function procesarTicket(registro: any) {
  const { id, ticket_texto } = registro;

  const impresoras = await obtenerImpresorasActivas();

  if (impresoras.length === 0) {
    console.warn(`⚠️ No hay impresoras activas configuradas. El ticket ${id} quedará pendiente.`);
    return;
  }

  let algunaImpresoraExitosa = false;

  for (const impresora of impresoras) {
    const exito = await imprimirTicket(id, ticket_texto, impresora);
    if (exito) algunaImpresoraExitosa = true;
  }

  // Si al menos una impresora imprimió, consideramos el ticket "impreso" para no re-imprimir infinitamente.
  // Podrías ajustar esto para que marque impreso solo si TODAS imprimen.
  if (algunaImpresoraExitosa) {
    const { error } = await supabase
      .from('cola_impresion')
      .update({ estado: 'impreso' })
      .eq('id', id);

    if (error) {
      console.error(`Error actualizando el estado del ticket ${id} en la DB:`, error);
    }
  }
}

async function startWorker() {
  console.log("🚀 Iniciando Print Worker...");

  // 1. Resiliencia: Buscar tickets pendientes que no se hayan impreso
  console.log("🔍 Buscando tickets pendientes históricos...");
  const { data: pendientes, error } = await supabase
    .from('cola_impresion')
    .select('*')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error consultando tickets pendientes:", error);
  } else if (pendientes && pendientes.length > 0) {
    console.log(`Encontrados ${pendientes.length} tickets pendientes. Procesando...`);
    for (const ticket of pendientes) {
      await procesarTicket(ticket);
    }
  } else {
    console.log("No hay tickets pendientes históricos.");
  }

  // 2. Escucha en Tiempo Real
  console.log("🎧 Escuchando nuevos pedidos en tiempo real...");
  
  supabase
    .channel('cola_impresion_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cola_impresion',
      },
      async (payload) => {
        const nuevoRegistro = payload.new;
        if (nuevoRegistro.estado === 'pendiente') {
          console.log(`\n🔔 Nuevo ticket recibido! ID: ${nuevoRegistro.id}`);
          await procesarTicket(nuevoRegistro);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Suscripción a Realtime activada correctamente.');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en la suscripción a Realtime.');
      }
    });
}

// Iniciar
startWorker().catch(console.error);
