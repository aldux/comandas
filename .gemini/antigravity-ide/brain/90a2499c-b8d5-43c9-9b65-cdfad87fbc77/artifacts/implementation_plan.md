# Propuesta de Lifting Visual (SaaS Premium) - ComandasApp

¡Hola! Confirmo al 100% que entiendo el contexto. Tenemos un producto con una base de datos robusta y flujos operativos completamente funcionales. Ahora el objetivo es hacer que el software **se vea y se sienta** como una herramienta de primer nivel (rápida, intuitiva, elegante y con personalidad), ideal tanto para el ajetreo táctil del mozo como para la claridad analítica de la caja.

> [!NOTE]
> He notado en tu repositorio que estás utilizando **Tailwind CSS v4**. En esta nueva versión, la configuración ya no se hace en `tailwind.config.ts`, sino directamente en el archivo `globals.css` usando la nueva directiva `@theme`. Mi propuesta está adaptada a este estándar moderno.

## 1. Sistema de Color (Dark Mode Elegante + Acentos)
Dado que es un entorno gastronómico (luces tenues en el salón) y una herramienta de uso prolongado, propongo un **Dark Mode nativo** como base. Da una sensación muy premium y reduce la fatiga visual.
* **Fondos y Superficies:** Tonos `zinc` muy profundos (sin llegar al negro puro).
* **Color de Marca (Brand):** Al ser una hamburguesería, sustituiremos los azules/esmeraldas genéricos por una gama **Naranja Vibrante / Ámbar** (`amber-500` a `orange-600`) que estimula el apetito y da mucha energía.
* **Acciones de Éxito / Cobros:** Mantendremos un `emerald-500` brillante para transmitir seguridad al procesar pagos.

## 2. Tipografía: "Outfit"
Recomiendo usar la fuente **Outfit**. Es geométrica, altamente legible en pantallas pequeñas (ideal para el móvil del mozo) y le da un aspecto tecnológico pero amigable y audaz.

## 3. Implementación Base (globals.css y layout)

### Configuración en `app/globals.css` (Tailwind v4)
```css
@import "tailwindcss";

@theme {
  /* Tipografía */
  --font-sans: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;

  /* Colores de Superficie (Elevación) */
  --color-surface-base: #09090b; /* zinc-950 */
  --color-surface-card: #18181b; /* zinc-900 */
  --color-surface-hover: #27272a; /* zinc-800 */
  
  /* Colores de Acento (Brand) */
  --color-brand-light: #f59e0b; /* amber-500 */
  --color-brand-DEFAULT: #ea580c; /* orange-600 */
  --color-brand-dark: #c2410c; /* orange-700 */

  /* Sombras y Glassmorphism */
  --shadow-glass: 0 4px 30px rgba(0, 0, 0, 0.5);
  --shadow-neon: 0 0 15px rgba(234, 88, 12, 0.3);
}

body {
  background-color: var(--color-surface-base);
  color: #fafafa;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

### Inyección en `layout.tsx`
```tsx
import { Outfit } from 'next/font/google';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={outfit.variable}>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
```

## 4. Patrones de Diseño y Microinteracciones
* **Botones Principales:** Pasaremos de fondos planos a gradientes sutiles o brillos on-hover. Ej: `bg-brand hover:bg-brand-light active:scale-95 transition-all duration-200 shadow-neon`.
* **Tarjetas de Mesas (Glassmorphism):** Usaremos bordes semitransparentes (`border-zinc-800/50`) y un fondo `bg-surface-card`. Cuando se presiona una tarjeta, el efecto `active:scale-[0.98]` dará un feedback táctil excelente.

## 5. Ejemplo Refactorizado: Tarjeta de Mesa Ocupada (Mozo)

Aquí tienes un adelanto de cómo se vería el código aplicando estos principios (sin tocar la lógica):

```tsx
<div 
  onClick={() => irAMesa(mesa.id)}
  className="
    group relative overflow-hidden rounded-2xl cursor-pointer select-none
    bg-surface-card border border-zinc-800/50 
    transition-all duration-300 ease-out
    hover:border-brand/50 hover:shadow-neon
    active:scale-[0.98]
  "
>
  {/* Acento superior sutil */}
  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-brand-light opacity-80" />

  <div className="p-5">
    <div className="flex justify-between items-center mb-4">
      <span className="text-zinc-400 font-medium tracking-wide text-sm uppercase">Mesa</span>
      <div className="flex items-center gap-1.5 bg-brand/10 text-brand px-2.5 py-1 rounded-full text-xs font-bold border border-brand/20">
        <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        Ocupada
      </div>
    </div>
    
    <div className="text-5xl font-black text-white mb-2 tracking-tighter">
      {mesa.numero}
    </div>
    
    {/* Micro-animación de la flecha al hacer hover */}
    <div className="mt-4 flex items-center text-brand font-medium text-sm group-hover:translate-x-1 transition-transform">
      Añadir o Entregar <ArrowRight size={16} className="ml-1" />
    </div>
  </div>
</div>
```

> [!IMPORTANT]
> **Feedback Requerido:** 
> ¿Qué te parece la dirección hacia un esquema oscuro con acentos ámbar/naranja para darle identidad de hamburguesería moderna? Si apruebas esta base, procedo a inyectar las fuentes, el tailwind config y refactorizar progresivamente la UI (sin romper nada de la lógica).
