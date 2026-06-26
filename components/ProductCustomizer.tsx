import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Modificador, ProductoMenu, Selecciones } from '@/store/orderStore';

interface SeleccionesState {
  agregables: string[]; // IDs de agregables seleccionados
  quitables: string[]; // IDs de quitables seleccionados
  varianteId: string | null; // ID de la variante seleccionada
}

interface ProductCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoMenu | null;
  onAddToCart: (producto: ProductoMenu, selecciones: Selecciones) => void;
}

export default function ProductCustomizer({
  isOpen,
  onClose,
  producto,
  onAddToCart,
}: ProductCustomizerProps) {
  const [selecciones, setSelecciones] = useState<SeleccionesState>({
    agregables: [],
    quitables: [],
    varianteId: null,
  });

  // Resetear el estado cada vez que se abre el modal o cambia el producto
  useEffect(() => {
    if (producto) {
      setSelecciones({
        agregables: [],
        quitables: [],
        varianteId: producto.opciones.variantes.length > 0 ? producto.opciones.variantes[0].id : null,
      });
    }
  }, [producto, isOpen]);

  // Bloquear el scroll del body cuando el slide-over está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !producto) return null;

  const toggleAgregable = (id: string) => {
    setSelecciones((prev) => ({
      ...prev,
      agregables: prev.agregables.includes(id)
        ? prev.agregables.filter((a) => a !== id)
        : [...prev.agregables, id],
    }));
  };

  const toggleQuitable = (id: string) => {
    setSelecciones((prev) => ({
      ...prev,
      quitables: prev.quitables.includes(id)
        ? prev.quitables.filter((q) => q !== id)
        : [...prev.quitables, id],
    }));
  };

  const calcularTotal = () => {
    let total = producto.precioBase;
    
    if (selecciones.varianteId) {
      const variante = producto.opciones.variantes.find(v => v.id === selecciones.varianteId);
      if (variante) total += variante.precioExtra;
    }

    selecciones.agregables.forEach(agregableId => {
      const agregable = producto.opciones.agregables.find(a => a.id === agregableId);
      if (agregable) total += agregable.precioExtra;
    });

    return total;
  };

  const handleAddToCart = () => {
    // Si hay variantes, validar que al menos una esté seleccionada
    if (producto.opciones.variantes.length > 0 && !selecciones.varianteId) {
      alert("Por favor selecciona una variante");
      return;
    }
    
    // Mapear los IDs locales a los objetos completos para el orderStore
    const seleccionesParaStore: Selecciones = {
      variante: selecciones.varianteId 
        ? producto.opciones.variantes.find(v => v.id === selecciones.varianteId) || null
        : null,
      agregados: selecciones.agregables
        .map(id => producto.opciones.agregables.find(a => a.id === id))
        .filter((a): a is Modificador => a !== undefined),
      quitados: selecciones.quitables
        .map(id => producto.opciones.quitables.find(q => q.id === id))
        .filter((q): q is Modificador => q !== undefined)
    };
    
    onAddToCart(producto, seleccionesParaStore);
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  return (
    <>
      {/* Backdrop oscuro */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-over-title"
      >
        {/* Header fijo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <h2 id="slide-over-title" className="text-xl font-bold text-gray-900 truncate pr-4">
            {producto.nombre}
          </h2>
          <button 
            onClick={onClose}
            className="p-3 -mr-3 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Contenido scrolleable (Touch Friendly) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8 overscroll-contain">
          
          {/* Precio Base */}
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 font-medium">Precio base</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(producto.precioBase)}
            </span>
          </div>

          {/* Variantes (Obligatorias, con Radio buttons) */}
          {producto.opciones.variantes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900">Variantes</h3>
              <div className="space-y-2">
                {producto.opciones.variantes.map((variante) => (
                  <label 
                    key={variante.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors cursor-pointer touch-manipulation ${
                      selecciones.varianteId === variante.id 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : 'border-gray-200 active:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="variante" 
                        value={variante.id}
                        checked={selecciones.varianteId === variante.id}
                        onChange={() => setSelecciones(prev => ({ ...prev, varianteId: variante.id }))}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="font-medium text-gray-800 text-lg">{variante.nombre}</span>
                    </div>
                    {variante.precioExtra > 0 && (
                      <span className="text-gray-600 font-medium">+{formatPrice(variante.precioExtra)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Agregables (Opcionales, con Checkboxes) */}
          {producto.opciones.agregables.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900">Agregables</h3>
              <div className="space-y-2">
                {producto.opciones.agregables.map((agregable) => (
                  <label 
                    key={agregable.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors cursor-pointer touch-manipulation ${
                      selecciones.agregables.includes(agregable.id)
                        ? 'border-green-500 bg-green-50/50'
                        : 'border-gray-200 active:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selecciones.agregables.includes(agregable.id)}
                        onChange={() => toggleAgregable(agregable.id)}
                        className="w-5 h-5 text-green-600 focus:ring-green-500 rounded border-gray-300"
                      />
                      <span className="font-medium text-gray-800 text-lg">{agregable.nombre}</span>
                    </div>
                    <span className="text-gray-600 font-medium">+{formatPrice(agregable.precioExtra)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quitables (Sin cargo, destructivos) */}
          {producto.opciones.quitables.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-red-600">Quitar ingredientes</h3>
              <div className="space-y-2">
                {producto.opciones.quitables.map((quitable) => (
                  <label 
                    key={quitable.id} 
                    className={`flex items-center p-4 rounded-xl border-2 transition-colors cursor-pointer touch-manipulation ${
                      selecciones.quitables.includes(quitable.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-red-100 bg-red-50/30 hover:bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selecciones.quitables.includes(quitable.id)}
                        onChange={() => toggleQuitable(quitable.id)}
                        className="w-5 h-5 text-red-600 focus:ring-red-500 rounded border-red-300"
                      />
                      <span className="font-medium text-red-700 text-lg line-through decoration-red-400">
                        {quitable.nombre}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Espacio extra al final para asegurar que se pueda scrollear bien por encima del footer fijo */}
          <div className="h-4"></div>
        </div>

        {/* Footer fijo (Call to Action) */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-gray-500 font-semibold text-lg">Total final:</span>
            <span className="text-3xl font-bold text-gray-900">{formatPrice(calcularTotal())}</span>
          </div>
          <button 
            onClick={handleAddToCart}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-transform transform active:scale-[0.98] flex items-center justify-center gap-3 text-xl touch-manipulation"
          >
            <Plus className="w-6 h-6" />
            Agregar a la comanda
          </button>
        </div>
      </div>
    </>
  );
}
