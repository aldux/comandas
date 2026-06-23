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

// Configuración de la impresora térmica
const printerConfig = {
  type: PrinterTypes.EPSON, // o STAR
  interface: 'tcp://192.168.1.100', // Ejemplo para impresora de RED LAN
  // interface: 'printer:ReceiptPrinter', // Ejemplo para impresora conectada por USB en Windows
  characterSet: CharacterSet.PC852_LATIN2,
  removeSpecialCharacters: false,
  lineCharacter: "=",
  breakLine: BreakLine.WORD,
  options:{
    timeout: 5000 // 5 segundos de timeout
  }
};

async function imprimirTicket(id: string, texto: string) {
  let printer = new ThermalPrinter(printerConfig);

  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("La impresora no está conectada o no responde.");
    }

    console.log(`🖨️  Imprimiendo ticket ID: ${id}...`);
    
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
    console.log(`✅ Ticket ${id} impreso con éxito.`);
    return true;
  } catch (error) {
    console.error(`❌ Error al imprimir ticket ${id}:`, error);
    return false;
  }
}

async function procesarTicket(registro: any) {
  const { id, ticket_texto } = registro;

  // Intentamos imprimir
  const exito = await imprimirTicket(id, ticket_texto);

  // Actualizamos el estado en Supabase
  const nuevoEstado = exito ? 'impreso' : 'error'; // Podríamos agregar un estado 'error' en el enum de la DB si falla, por ahora usemos texto libre o un status alternativo.
  
  // Nota: si el enum de la DB no admite 'error', quizás quieras cambiar el schema para permitirlo, 
  // o simplemente dejarlo 'pendiente' para reintentar. Vamos a intentar setearlo a 'error' si el schema lo permitiese, 
  // o a 'pendiente' para que se reintente después si prefieres. Asumiendo que el usuario ajustará el Enum si usa 'error'.
  
  const { error } = await supabase
    .from('cola_impresion')
    .update({ estado: exito ? 'impreso' : 'pendiente' }) // Si el Enum era ('pendiente', 'impreso'), no usamos 'error' para no crashear la DB, lo dejamos pendiente o agregamos log.
    .eq('id', id);

  if (error) {
    console.error(`Error actualizando el estado del ticket ${id} en la DB:`, error);
  }
}

async function startWorker() {
  console.log("🚀 Iniciando Print Worker...");

  // 1. Resiliencia: Buscar tickets pendientes que no se hayan impreso
  console.log("🔍 Buscando tickets pendientes históricos...");
  const { data: pendientes, error } = await supabase
    .from('cola_impresion')
    .select('*')
    .eq('estado', 'pendiente');

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
