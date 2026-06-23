import { create } from 'zustand';

export interface Mozo {
  id: string;
  nombre: string;
}

export interface Mesa {
  id: string;
  numero: number;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
  notas: string;
}

interface AppState {
  mozoActivo: Mozo | null;
  mesaActiva: Mesa | null;
  carrito: CartItem[];
  
  setMozo: (mozo: Mozo | null) => void;
  setMesa: (mesa: Mesa | null) => void;
  agregarAlCarrito: (producto: Producto, notas?: string) => void;
  quitarDelCarrito: (productoId: string) => void;
  limpiarCarrito: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  mozoActivo: null,
  mesaActiva: null,
  carrito: [],

  setMozo: (mozo) => set({ mozoActivo: mozo }),
  
  setMesa: (mesa) => set({ mesaActiva: mesa }),
  
  agregarAlCarrito: (producto, notas = '') => set((state) => {
    const itemIndex = state.carrito.findIndex(item => item.producto.id === producto.id && item.notas === notas);
    
    if (itemIndex >= 0) {
      // Producto ya existe con las mismas notas, incrementar cantidad
      const nuevoCarrito = [...state.carrito];
      nuevoCarrito[itemIndex].cantidad += 1;
      return { carrito: nuevoCarrito };
    }
    
    // Producto nuevo en el carrito
    return { 
      carrito: [...state.carrito, { producto, cantidad: 1, notas }] 
    };
  }),
  
  quitarDelCarrito: (productoId) => set((state) => {
    // Buscar el último item o el que coincida (simplificado por ahora, quita 1 de la cantidad)
    const itemIndex = state.carrito.findIndex(item => item.producto.id === productoId);
    
    if (itemIndex >= 0) {
      const nuevoCarrito = [...state.carrito];
      if (nuevoCarrito[itemIndex].cantidad > 1) {
        nuevoCarrito[itemIndex].cantidad -= 1;
      } else {
        nuevoCarrito.splice(itemIndex, 1);
      }
      return { carrito: nuevoCarrito };
    }
    return state;
  }),
  
  limpiarCarrito: () => set({ carrito: [] }),
}));
