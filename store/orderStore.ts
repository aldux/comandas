import { create } from 'zustand';

// --- Interfaces Base ---
export interface Modificador {
  id: string;
  nombre: string;
  precioExtra: number;
}

export interface ProductoMenu {
  id: string;
  nombre: string;
  categoria: 'comida' | 'bebida';
  precioBase: number;
  opciones: {
    agregables: Modificador[];
    quitables: Modificador[];
    variantes: Modificador[];
  };
}

export interface Selecciones {
  variante: Modificador | null;
  agregados: Modificador[];
  quitados: Modificador[];
}

export interface CartItem {
  cartItemId: string;
  producto: ProductoMenu;
  selecciones: Selecciones;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

// --- Interfaz del Store ---
interface OrderState {
  cart: CartItem[];
  addToCart: (producto: ProductoMenu, selecciones: Selecciones, cantidad?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, cantidad: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

// Helper: Función para comparar selecciones de manera confiable
// Normalizamos mapeando a los IDs y ordenando, para que [Tómate, Lechuga] sea igual a [Lechuga, Tómate]
const areSelectionsEqual = (s1: Selecciones, s2: Selecciones): boolean => {
  const sortById = (a: Modificador, b: Modificador) => a.id.localeCompare(b.id);
  
  const norm1 = {
    variante: s1.variante?.id || null,
    agregados: [...s1.agregados].sort(sortById).map(m => m.id),
    quitados: [...s1.quitados].sort(sortById).map(m => m.id),
  };
  
  const norm2 = {
    variante: s2.variante?.id || null,
    agregados: [...s2.agregados].sort(sortById).map(m => m.id),
    quitados: [...s2.quitados].sort(sortById).map(m => m.id),
  };

  return JSON.stringify(norm1) === JSON.stringify(norm2);
};

export const useOrderStore = create<OrderState>((set, get) => ({
  cart: [],

  addToCart: (producto, selecciones, cantidad = 1) => {
    set((state) => {
      // 1. Calcular el precio unitario en base al producto y selecciones
      let precioUnitario = producto.precioBase;
      
      if (selecciones.variante) {
        precioUnitario += selecciones.variante.precioExtra;
      }
      
      selecciones.agregados.forEach((agregado) => {
        precioUnitario += agregado.precioExtra;
      });

      // 2. Buscar si el producto ya existe con exactamente las mismas opciones
      const existingItemIndex = state.cart.findIndex(
        (item) => item.producto.id === producto.id && areSelectionsEqual(item.selecciones, selecciones)
      );

      // 3. Logica de agregado o actualización
      if (existingItemIndex >= 0) {
        // Actualizar item existente mediante inmutabilidad
        const updatedCart = [...state.cart];
        const item = updatedCart[existingItemIndex];
        const nuevaCantidad = item.cantidad + cantidad;
        
        updatedCart[existingItemIndex] = {
          ...item,
          cantidad: nuevaCantidad,
          precioTotal: nuevaCantidad * item.precioUnitario,
        };

        return { cart: updatedCart };
      } else {
        // Generar un nuevo ítem único
        const newItem: CartItem = {
          cartItemId: crypto.randomUUID(), // Generador nativo de IDs únicos (compatible con React 19 / Modern JS)
          producto,
          selecciones,
          cantidad,
          precioUnitario,
          precioTotal: precioUnitario * cantidad,
        };

        return { cart: [...state.cart, newItem] };
      }
    });
  },

  removeFromCart: (cartItemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.cartItemId !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId, cantidad) => {
    // Si la cantidad solicitada es <= 0, eliminamos el item del carrito reutilizando la acción anterior
    if (cantidad <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }

    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            cantidad,
            precioTotal: item.precioUnitario * cantidad,
          };
        }
        return item;
      }),
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  // Helper getters
  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + item.precioTotal, 0);
  },

  getCartCount: () => {
    return get().cart.reduce((count, item) => count + item.cantidad, 0);
  },
}));
